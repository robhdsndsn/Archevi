# update_tenant.py
# Windmill Python script for updating a tenant (admin only)
# Path: f/admin/update_tenant
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Update an existing tenant's settings.

This admin-only endpoint updates tenant configuration.
All changes are logged to admin_audit_logs for compliance.

Args:
    tenant_id: UUID of the tenant to update
    name: Optional new name
    plan: Optional new plan
    status: Optional new status (active, suspended, cancelled)
    ai_allowance_usd: Optional AI budget
    max_members: Optional max members
    max_storage_gb: Optional storage limit
    actor_email: Email of admin performing the action (for audit)

Returns:
    dict: Success status
"""

import psycopg2
import json
from datetime import datetime
from typing import TypedDict
import wmill


class UpdateTenantResult(TypedDict):
    success: bool
    message: str | None
    error: str | None


def log_audit(
    cursor,
    actor_email: str,
    action: str,
    action_type: str,
    resource_type: str,
    resource_id: str,
    resource_name: str,
    tenant_id: str,
    tenant_name: str,
    old_value: dict | None,
    new_value: dict | None,
    changes: dict | None,
    success: bool = True,
    error_message: str | None = None
) -> int | None:
    """Log action to admin_audit_logs table."""
    try:
        cursor.execute("""
            INSERT INTO admin_audit_logs (
                actor_id, actor_email, actor_type,
                action, action_type,
                resource_type, resource_id, resource_name,
                tenant_id, tenant_name,
                old_value, new_value, changes,
                success, error_message
            ) VALUES (
                %s, %s, %s,
                %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s, %s,
                %s, %s
            )
            RETURNING id
        """, (
            actor_email,
            actor_email,
            'admin',
            action,
            action_type,
            resource_type,
            resource_id,
            resource_name,
            tenant_id,
            tenant_name,
            json.dumps(old_value) if old_value else None,
            json.dumps(new_value) if new_value else None,
            json.dumps(changes) if changes else None,
            success,
            error_message
        ))
        result = cursor.fetchone()
        return result[0] if result else None
    except Exception as e:
        # Don't fail the main operation if audit logging fails
        print(f"Warning: Failed to log audit: {e}")
        return None


def main(
    tenant_id: str,
    name: str | None = None,
    plan: str | None = None,
    status: str | None = None,
    ai_allowance_usd: float | None = None,
    max_members: int | None = None,
    max_storage_gb: int | None = None,
    actor_email: str = "admin@system",
) -> UpdateTenantResult:
    """Update an existing tenant."""

    if not tenant_id:
        return {
            "success": False,
            "message": None,
            "error": "tenant_id is required"
        }

    # Validate plan if provided
    valid_plans = ['free', 'family', 'family_plus', 'family_office', 'trial', 'starter']
    if plan and plan not in valid_plans:
        return {
            "success": False,
            "message": None,
            "error": f"Invalid plan: {plan}. Must be one of: {', '.join(valid_plans)}"
        }

    # Validate status if provided
    valid_statuses = ['active', 'suspended', 'cancelled', 'pending']
    if status and status not in valid_statuses:
        return {
            "success": False,
            "message": None,
            "error": f"Invalid status: {status}. Must be one of: {', '.join(valid_statuses)}"
        }

    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    conn = psycopg2.connect(
        host=postgres_db['host'],
        port=postgres_db['port'],
        dbname=postgres_db['dbname'],
        user=postgres_db['user'],
        password=postgres_db['password'],
        sslmode=postgres_db.get('sslmode', 'disable')
    )
    cursor = conn.cursor()

    try:
        # First, fetch current tenant state for audit logging
        cursor.execute("""
            SELECT id, name, plan, status, ai_allowance_usd, max_members, max_storage_gb
            FROM tenants WHERE id = %s
        """, (tenant_id,))
        current = cursor.fetchone()

        if not current:
            conn.close()
            return {
                "success": False,
                "message": None,
                "error": f"Tenant with ID '{tenant_id}' not found"
            }

        # Store old values for audit
        old_state = {
            "name": current[1],
            "plan": current[2],
            "status": current[3],
            "ai_allowance_usd": float(current[4]) if current[4] else None,
            "max_members": current[5],
            "max_storage_gb": current[6]
        }
        tenant_name = current[1]

        # Build dynamic update query
        updates = []
        values = []
        changes = {}

        if name is not None:
            updates.append("name = %s")
            values.append(name)
            if name != old_state["name"]:
                changes["name"] = {"from": old_state["name"], "to": name}
        if plan is not None:
            updates.append("plan = %s")
            values.append(plan)
            if plan != old_state["plan"]:
                changes["plan"] = {"from": old_state["plan"], "to": plan}
        if status is not None:
            updates.append("status = %s")
            values.append(status)
            if status != old_state["status"]:
                changes["status"] = {"from": old_state["status"], "to": status}
        if ai_allowance_usd is not None:
            updates.append("ai_allowance_usd = %s")
            values.append(ai_allowance_usd)
            if ai_allowance_usd != old_state["ai_allowance_usd"]:
                changes["ai_allowance_usd"] = {"from": old_state["ai_allowance_usd"], "to": ai_allowance_usd}
        if max_members is not None:
            updates.append("max_members = %s")
            values.append(max_members)
            if max_members != old_state["max_members"]:
                changes["max_members"] = {"from": old_state["max_members"], "to": max_members}
        if max_storage_gb is not None:
            updates.append("max_storage_gb = %s")
            values.append(max_storage_gb)
            if max_storage_gb != old_state["max_storage_gb"]:
                changes["max_storage_gb"] = {"from": old_state["max_storage_gb"], "to": max_storage_gb}

        if not updates:
            conn.close()
            return {
                "success": False,
                "message": None,
                "error": "No updates provided"
            }

        # Always update updated_at
        updates.append("updated_at = %s")
        values.append(datetime.utcnow())

        # Add tenant_id for WHERE clause
        values.append(tenant_id)

        query = f"UPDATE tenants SET {', '.join(updates)} WHERE id = %s"
        cursor.execute(query, values)

        # Build new state for audit
        new_state = {**old_state}
        if name is not None:
            new_state["name"] = name
        if plan is not None:
            new_state["plan"] = plan
        if status is not None:
            new_state["status"] = status
        if ai_allowance_usd is not None:
            new_state["ai_allowance_usd"] = ai_allowance_usd
        if max_members is not None:
            new_state["max_members"] = max_members
        if max_storage_gb is not None:
            new_state["max_storage_gb"] = max_storage_gb

        # Log the audit entry
        log_audit(
            cursor=cursor,
            actor_email=actor_email,
            action="tenant.update",
            action_type="update",
            resource_type="tenant",
            resource_id=tenant_id,
            resource_name=tenant_name,
            tenant_id=tenant_id,
            tenant_name=tenant_name,
            old_value=old_state,
            new_value=new_state,
            changes=changes if changes else None,
            success=True
        )

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "message": "Tenant updated successfully",
            "error": None
        }

    except Exception as e:
        # Log failed attempt
        try:
            log_audit(
                cursor=cursor,
                actor_email=actor_email,
                action="tenant.update",
                action_type="update",
                resource_type="tenant",
                resource_id=tenant_id,
                resource_name=tenant_name if 'tenant_name' in dir() else None,
                tenant_id=tenant_id,
                tenant_name=tenant_name if 'tenant_name' in dir() else None,
                old_value=None,
                new_value=None,
                changes=None,
                success=False,
                error_message=str(e)
            )
            conn.commit()
        except:
            pass  # Don't fail if audit logging fails

        conn.rollback()
        cursor.close()
        conn.close()
        return {
            "success": False,
            "message": None,
            "error": str(e)
        }

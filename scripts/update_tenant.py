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

Args:
    tenant_id: UUID of the tenant to update
    name: Optional new name
    plan: Optional new plan
    status: Optional new status (active, suspended, cancelled)
    ai_allowance_usd: Optional AI budget
    max_members: Optional max members
    max_storage_gb: Optional storage limit

Returns:
    dict: Success status
"""

import psycopg2
from datetime import datetime
from typing import TypedDict
import wmill


class UpdateTenantResult(TypedDict):
    success: bool
    message: str | None
    error: str | None


def main(
    tenant_id: str,
    name: str | None = None,
    plan: str | None = None,
    status: str | None = None,
    ai_allowance_usd: float | None = None,
    max_members: int | None = None,
    max_storage_gb: int | None = None,
) -> UpdateTenantResult:
    """Update an existing tenant."""

    if not tenant_id:
        return {
            "success": False,
            "message": None,
            "error": "tenant_id is required"
        }

    # Validate plan if provided
    valid_plans = ['starter', 'family', 'family_office', 'trial']
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
        # Check tenant exists
        cursor.execute("SELECT id FROM tenants WHERE id = %s", (tenant_id,))
        if not cursor.fetchone():
            conn.close()
            return {
                "success": False,
                "message": None,
                "error": f"Tenant with ID '{tenant_id}' not found"
            }

        # Build dynamic update query
        updates = []
        values = []

        if name is not None:
            updates.append("name = %s")
            values.append(name)
        if plan is not None:
            updates.append("plan = %s")
            values.append(plan)
        if status is not None:
            updates.append("status = %s")
            values.append(status)
        if ai_allowance_usd is not None:
            updates.append("ai_allowance_usd = %s")
            values.append(ai_allowance_usd)
        if max_members is not None:
            updates.append("max_members = %s")
            values.append(max_members)
        if max_storage_gb is not None:
            updates.append("max_storage_gb = %s")
            values.append(max_storage_gb)

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

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "message": "Tenant updated successfully",
            "error": None
        }

    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return {
            "success": False,
            "message": None,
            "error": str(e)
        }

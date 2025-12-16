# log_admin_action.py
# Windmill Python script for logging admin actions
# Path: f/admin/log_admin_action
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Log an administrative action to the audit trail.

This script creates an entry in admin_audit_logs for compliance and debugging.
Should be called by other admin scripts after performing actions.

Args:
    actor_email: Email of the admin performing the action
    action: Action identifier (e.g., 'tenant.update', 'member.remove')
    action_type: Type of action ('create', 'update', 'delete', 'config', etc.)
    resource_type: Type of resource ('tenant', 'member', 'document', 'settings')
    resource_id: ID of the affected resource (optional)
    resource_name: Human-readable name of resource (optional)
    tenant_id: UUID of affected tenant (optional)
    tenant_name: Name of affected tenant (optional)
    old_value: Previous state as dict (optional)
    new_value: New state as dict (optional)
    changes: Summary of changes as dict (optional)
    success: Whether action succeeded (default True)
    error_message: Error message if failed (optional)
    metadata: Additional context as dict (optional)

Returns:
    dict: Log entry ID and status
"""

import wmill
import psycopg2
import json
from typing import Optional
from datetime import datetime


def main(
    actor_email: str,
    action: str,
    action_type: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    resource_name: Optional[str] = None,
    tenant_id: Optional[str] = None,
    tenant_name: Optional[str] = None,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    changes: Optional[dict] = None,
    success: bool = True,
    error_message: Optional[str] = None,
    metadata: Optional[dict] = None
) -> dict:
    """Log an admin action to the audit trail."""

    # Validate action_type
    valid_action_types = ['create', 'read', 'update', 'delete', 'auth', 'config', 'execute']
    if action_type not in valid_action_types:
        return {
            "status": "error",
            "error": f"Invalid action_type. Must be one of: {valid_action_types}"
        }

    # Get database connection
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    try:
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        cursor = conn.cursor()

        # Determine actor type (admin vs system)
        actor_type = 'system' if 'scheduler' in actor_email.lower() or actor_email == 'system' else 'admin'

        # Insert audit log
        cursor.execute("""
            INSERT INTO admin_audit_logs (
                actor_id, actor_email, actor_type,
                action, action_type,
                resource_type, resource_id, resource_name,
                tenant_id, tenant_name,
                old_value, new_value, changes,
                success, error_message,
                metadata
            ) VALUES (
                %s, %s, %s,
                %s, %s,
                %s, %s, %s,
                %s, %s,
                %s, %s, %s,
                %s, %s,
                %s
            )
            RETURNING id, created_at
        """, (
            actor_email,  # actor_id (using email for now)
            actor_email,
            actor_type,
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
            error_message,
            json.dumps(metadata) if metadata else None
        ))

        result = cursor.fetchone()
        log_id = result[0]
        created_at = result[1].isoformat()

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "status": "success",
            "log_id": log_id,
            "created_at": created_at,
            "action": action,
            "resource": f"{resource_type}/{resource_id or 'N/A'}"
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

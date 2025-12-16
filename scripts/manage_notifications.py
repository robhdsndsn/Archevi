# manage_notifications.py
# Windmill Python script for managing notification state
# Path: f/admin/manage_notifications
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Manage notification state (mark as read, dismiss, etc.)

Args:
    action (str): Action to perform: 'read', 'dismiss', 'dismiss_all', 'read_all'
    notification_id (optional): ID of specific notification
    tenant_id (str): UUID of the tenant
    user_id (optional): UUID of the user

Returns:
    dict: Result of the action
"""

import wmill
import psycopg2
from typing import Optional
from datetime import datetime


def main(
    action: str,
    tenant_id: str,
    notification_id: Optional[int] = None,
    user_id: Optional[str] = None
) -> dict:
    """Manage notification state."""

    valid_actions = ['read', 'dismiss', 'dismiss_all', 'read_all', 'acknowledge_alert']
    if action not in valid_actions:
        return {"error": f"Invalid action. Must be one of: {valid_actions}"}

    if action in ['read', 'dismiss'] and not notification_id:
        return {"error": "notification_id is required for this action"}

    if not tenant_id:
        return {"error": "tenant_id is required"}

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

    result = {"action": action, "success": False}

    try:
        if action == 'read':
            cursor.execute("""
                UPDATE in_app_notifications
                SET is_read = TRUE, read_at = NOW()
                WHERE id = %s AND tenant_id = %s
                RETURNING id
            """, (notification_id, tenant_id))
            updated = cursor.fetchone()
            result["success"] = updated is not None
            result["notification_id"] = notification_id

        elif action == 'dismiss':
            cursor.execute("""
                UPDATE in_app_notifications
                SET is_dismissed = TRUE, dismissed_at = NOW()
                WHERE id = %s AND tenant_id = %s
                RETURNING id
            """, (notification_id, tenant_id))
            updated = cursor.fetchone()
            result["success"] = updated is not None
            result["notification_id"] = notification_id

        elif action == 'read_all':
            conditions = ["tenant_id = %s", "is_read = FALSE"]
            params = [tenant_id]

            if user_id:
                conditions.append("(user_id = %s OR user_id IS NULL)")
                params.append(user_id)

            cursor.execute(f"""
                UPDATE in_app_notifications
                SET is_read = TRUE, read_at = NOW()
                WHERE {' AND '.join(conditions)}
            """, params)
            result["success"] = True
            result["notifications_updated"] = cursor.rowcount

        elif action == 'dismiss_all':
            conditions = ["tenant_id = %s", "is_dismissed = FALSE"]
            params = [tenant_id]

            if user_id:
                conditions.append("(user_id = %s OR user_id IS NULL)")
                params.append(user_id)

            cursor.execute(f"""
                UPDATE in_app_notifications
                SET is_dismissed = TRUE, dismissed_at = NOW()
                WHERE {' AND '.join(conditions)}
            """, params)
            result["success"] = True
            result["notifications_updated"] = cursor.rowcount

        elif action == 'acknowledge_alert':
            # Mark the underlying usage alert as acknowledged
            if notification_id:
                cursor.execute("""
                    UPDATE usage_alerts ua
                    SET status = 'acknowledged',
                        acknowledged_at = NOW(),
                        acknowledged_by = %s::uuid
                    FROM in_app_notifications n
                    WHERE n.id = %s
                      AND n.tenant_id = %s
                      AND ua.id = n.alert_id
                    RETURNING ua.id
                """, (user_id, notification_id, tenant_id))
                updated = cursor.fetchone()
                result["success"] = updated is not None
                if updated:
                    result["alert_id"] = updated[0]

        conn.commit()

    except Exception as e:
        result["error"] = str(e)
        conn.rollback()

    cursor.close()
    conn.close()

    return result

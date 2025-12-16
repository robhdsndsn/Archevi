# get_notifications.py
# Windmill Python script for fetching in-app notifications
# Path: f/admin/get_notifications
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Get in-app notifications for a user or tenant.

Args:
    tenant_id (str): UUID of the tenant
    user_id (optional): UUID of specific user. If None, gets tenant-wide notifications.
    include_read (bool): Whether to include already-read notifications (default False)
    include_dismissed (bool): Whether to include dismissed notifications (default False)
    limit (int): Maximum notifications to return (default 20)

Returns:
    dict: notifications list and unread count
"""

import wmill
import psycopg2
from typing import Optional
from datetime import datetime


def main(
    tenant_id: str,
    user_id: Optional[str] = None,
    include_read: bool = False,
    include_dismissed: bool = False,
    limit: int = 20
) -> dict:
    """Get notifications for a user/tenant."""

    if not tenant_id:
        return {"error": "tenant_id is required", "notifications": [], "unread_count": 0}

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

    # Build query based on filters
    conditions = ["n.tenant_id = %s"]
    params = [tenant_id]

    if user_id:
        conditions.append("(n.user_id = %s OR n.user_id IS NULL)")
        params.append(user_id)
    else:
        conditions.append("n.user_id IS NULL")

    if not include_read:
        conditions.append("n.is_read = FALSE")

    if not include_dismissed:
        conditions.append("n.is_dismissed = FALSE")

    # Exclude expired notifications
    conditions.append("(n.expires_at IS NULL OR n.expires_at > NOW())")

    where_clause = " AND ".join(conditions)
    params.append(limit)

    cursor.execute(f"""
        SELECT
            n.id,
            n.tenant_id,
            n.user_id,
            n.title,
            n.message,
            n.notification_type,
            n.alert_id,
            n.action_url,
            n.action_label,
            n.is_read,
            n.read_at,
            n.is_dismissed,
            n.dismissed_at,
            n.expires_at,
            n.created_at,
            ua.alert_type
        FROM in_app_notifications n
        LEFT JOIN usage_alerts ua ON n.alert_id = ua.id
        WHERE {where_clause}
        ORDER BY n.created_at DESC
        LIMIT %s
    """, params)

    notifications = []
    for row in cursor.fetchall():
        notifications.append({
            "id": row[0],
            "tenant_id": str(row[1]),
            "user_id": str(row[2]) if row[2] else None,
            "title": row[3],
            "message": row[4],
            "notification_type": row[5],
            "alert_id": row[6],
            "action_url": row[7],
            "action_label": row[8],
            "is_read": row[9],
            "read_at": row[10].isoformat() if row[10] else None,
            "is_dismissed": row[11],
            "dismissed_at": row[12].isoformat() if row[12] else None,
            "expires_at": row[13].isoformat() if row[13] else None,
            "created_at": row[14].isoformat() if row[14] else None,
            "alert_type": row[15]
        })

    # Get unread count
    count_conditions = ["n.tenant_id = %s", "n.is_read = FALSE", "n.is_dismissed = FALSE"]
    count_params = [tenant_id]

    if user_id:
        count_conditions.append("(n.user_id = %s OR n.user_id IS NULL)")
        count_params.append(user_id)
    else:
        count_conditions.append("n.user_id IS NULL")

    count_conditions.append("(n.expires_at IS NULL OR n.expires_at > NOW())")

    cursor.execute(f"""
        SELECT COUNT(*)
        FROM in_app_notifications n
        WHERE {' AND '.join(count_conditions)}
    """, count_params)

    unread_count = cursor.fetchone()[0]

    cursor.close()
    conn.close()

    return {
        "notifications": notifications,
        "unread_count": unread_count,
        "total_returned": len(notifications)
    }

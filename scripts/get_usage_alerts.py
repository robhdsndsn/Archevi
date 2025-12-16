# get_usage_alerts.py
# Windmill Python script for fetching usage alerts
# Path: f/admin/get_usage_alerts
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Get usage alerts across all tenants (admin) or for a specific tenant.

Args:
    tenant_id (optional): UUID of specific tenant. If None, gets all.
    status (optional): Filter by status: 'active', 'acknowledged', 'resolved', 'dismissed'
    alert_type (optional): Filter by type: 'ai_budget_warning', etc.
    limit (int): Maximum alerts to return (default 50)

Returns:
    dict: alerts list and summary
"""

import wmill
import psycopg2
from typing import Optional


def main(
    tenant_id: Optional[str] = None,
    status: Optional[str] = None,
    alert_type: Optional[str] = None,
    limit: int = 50
) -> dict:
    """Get usage alerts."""

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

    # Build query
    conditions = []
    params = []

    if tenant_id:
        conditions.append("ua.tenant_id = %s")
        params.append(tenant_id)

    if status:
        conditions.append("ua.status = %s")
        params.append(status)

    if alert_type:
        conditions.append("ua.alert_type = %s")
        params.append(alert_type)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    params.append(limit)

    cursor.execute(f"""
        SELECT
            ua.id,
            ua.tenant_id,
            t.name as tenant_name,
            t.plan as tenant_plan,
            ua.alert_type,
            ua.threshold_percent,
            ua.current_value,
            ua.limit_value,
            ua.status,
            ua.triggered_at,
            ua.acknowledged_at,
            ua.acknowledged_by,
            ua.resolved_at,
            ua.message,
            ua.email_sent,
            ua.in_app_shown,
            ua.metadata
        FROM usage_alerts ua
        JOIN tenants t ON ua.tenant_id = t.id
        {where_clause}
        ORDER BY
            CASE ua.status WHEN 'active' THEN 0 ELSE 1 END,
            ua.triggered_at DESC
        LIMIT %s
    """, params)

    alerts = []
    for row in cursor.fetchall():
        alerts.append({
            "id": row[0],
            "tenant_id": str(row[1]),
            "tenant_name": row[2],
            "tenant_plan": row[3],
            "alert_type": row[4],
            "threshold_percent": row[5],
            "current_value": float(row[6]) if row[6] else None,
            "limit_value": float(row[7]) if row[7] else None,
            "status": row[8],
            "triggered_at": row[9].isoformat() if row[9] else None,
            "acknowledged_at": row[10].isoformat() if row[10] else None,
            "acknowledged_by": str(row[11]) if row[11] else None,
            "resolved_at": row[12].isoformat() if row[12] else None,
            "message": row[13],
            "email_sent": row[14],
            "in_app_shown": row[15],
            "metadata": row[16] or {},
            # Calculate current percent from metadata or values
            "current_percent": (row[16] or {}).get('current_percent') or
                              (round((float(row[6]) / float(row[7])) * 100, 1) if row[6] and row[7] and row[7] > 0 else None)
        })

    # Get summary counts
    cursor.execute("""
        SELECT
            COUNT(*) FILTER (WHERE status = 'active') as active_count,
            COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged_count,
            COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
            COUNT(*) FILTER (WHERE alert_type LIKE 'ai_budget%' AND status = 'active') as budget_alerts,
            COUNT(*) FILTER (WHERE alert_type LIKE 'storage%' AND status = 'active') as storage_alerts,
            COUNT(*) FILTER (WHERE alert_type = 'member_limit_reached' AND status = 'active') as member_alerts
        FROM usage_alerts ua
        WHERE TRUE
    """)
    summary_row = cursor.fetchone()

    summary = {
        "total_active": summary_row[0],
        "total_acknowledged": summary_row[1],
        "total_resolved": summary_row[2],
        "budget_alerts_active": summary_row[3],
        "storage_alerts_active": summary_row[4],
        "member_alerts_active": summary_row[5]
    }

    cursor.close()
    conn.close()

    return {
        "alerts": alerts,
        "summary": summary,
        "total_returned": len(alerts)
    }

# get_admin_audit_logs.py
# Windmill Python script for fetching admin audit logs
# Path: f/admin/get_admin_audit_logs
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Fetch admin audit logs with filtering and pagination.

Args:
    limit: Max number of logs to return (default 50)
    offset: Pagination offset (default 0)
    actor_email: Filter by actor email (optional)
    action_type: Filter by action type (optional)
    resource_type: Filter by resource type (optional)
    tenant_id: Filter by tenant ID (optional)
    success: Filter by success status (optional)
    start_date: Filter by start date YYYY-MM-DD (optional)
    end_date: Filter by end date YYYY-MM-DD (optional)

Returns:
    dict: List of audit logs and pagination info
"""

import wmill
import psycopg2
import json
from typing import Optional
from datetime import datetime


def main(
    limit: int = 50,
    offset: int = 0,
    actor_email: Optional[str] = None,
    action_type: Optional[str] = None,
    resource_type: Optional[str] = None,
    tenant_id: Optional[str] = None,
    success: Optional[bool] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> dict:
    """Fetch admin audit logs with filtering."""

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

        # Build query with filters
        where_clauses = []
        params = []

        if actor_email:
            where_clauses.append("actor_email ILIKE %s")
            params.append(f"%{actor_email}%")

        if action_type:
            where_clauses.append("action_type = %s")
            params.append(action_type)

        if resource_type:
            where_clauses.append("resource_type = %s")
            params.append(resource_type)

        if tenant_id:
            where_clauses.append("tenant_id = %s")
            params.append(tenant_id)

        if success is not None:
            where_clauses.append("success = %s")
            params.append(success)

        if start_date:
            where_clauses.append("created_at >= %s")
            params.append(start_date)

        if end_date:
            where_clauses.append("created_at < %s::date + 1")
            params.append(end_date)

        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

        # Get total count
        cursor.execute(f"""
            SELECT COUNT(*) FROM admin_audit_logs
            WHERE {where_sql}
        """, params)
        total = cursor.fetchone()[0]

        # Get logs
        cursor.execute(f"""
            SELECT
                id,
                actor_email,
                actor_type,
                action,
                action_type,
                resource_type,
                resource_id,
                resource_name,
                tenant_id,
                tenant_name,
                old_value,
                new_value,
                changes,
                ip_address,
                success,
                error_message,
                metadata,
                created_at
            FROM admin_audit_logs
            WHERE {where_sql}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """, params + [limit, offset])

        logs = []
        for row in cursor.fetchall():
            logs.append({
                "id": row[0],
                "actor_email": row[1],
                "actor_type": row[2],
                "action": row[3],
                "action_type": row[4],
                "resource_type": row[5],
                "resource_id": row[6],
                "resource_name": row[7],
                "tenant_id": str(row[8]) if row[8] else None,
                "tenant_name": row[9],
                "old_value": row[10],
                "new_value": row[11],
                "changes": row[12],
                "ip_address": row[13],
                "success": row[14],
                "error_message": row[15],
                "metadata": row[16],
                "created_at": row[17].isoformat() if row[17] else None
            })

        # Get summary stats
        cursor.execute("""
            SELECT
                COUNT(*) as total_logs,
                COUNT(DISTINCT actor_email) as unique_actors,
                COUNT(*) FILTER (WHERE success = false) as failed_actions,
                COUNT(DISTINCT DATE(created_at)) as active_days
            FROM admin_audit_logs
            WHERE created_at >= NOW() - INTERVAL '30 days'
        """)
        stats = cursor.fetchone()

        cursor.close()
        conn.close()

        return {
            "status": "success",
            "logs": logs,
            "pagination": {
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_more": offset + len(logs) < total
            },
            "summary": {
                "total_logs_30d": stats[0],
                "unique_actors_30d": stats[1],
                "failed_actions_30d": stats[2],
                "active_days_30d": stats[3]
            }
        }

    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "logs": [],
            "pagination": {"total": 0, "limit": limit, "offset": offset, "has_more": False}
        }

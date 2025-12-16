#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - httpx

"""
Fetch usage analytics and statistics for the Archevi dashboard.

Windmill Script Configuration:
- Path: f/chatbot/get_analytics
- Trigger: Called by dashboard

Updated for multi-tenant schema - works with both old and new tables.
"""

import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
from typing import Optional
import wmill


def main(period: str = "week", tenant_id: Optional[str] = None) -> dict:
    """
    Fetch comprehensive analytics for the dashboard.

    Args:
        period: Time period - 'day', 'week', 'month', 'all'
        tenant_id: Optional tenant UUID to filter by (None = all tenants)
    """
    # Calculate date range
    now = datetime.now()
    if period == "day":
        start_date = now - timedelta(days=1)
    elif period == "week":
        start_date = now - timedelta(weeks=1)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:  # 'all'
        start_date = datetime(2020, 1, 1)

    # Connect to database - try new resource first
    try:
        db_resource = wmill.get_resource("u/admin/archevi_postgres")
        conn = psycopg2.connect(db_resource["connection_string"])
    except:
        postgres_db = wmill.get_resource("f/chatbot/postgres_db")
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )

    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        # Build tenant filter for new schema tables
        tenant_filter = ""
        tenant_params = []
        if tenant_id:
            tenant_filter = " AND tenant_id = %s"
            tenant_params = [tenant_id]

        # 1. API Usage Summary - try new ai_usage table first, fall back to api_usage_log
        usage_by_operation = []
        usage_totals = {"requests": 0, "tokens": 0, "cost": 0.0}

        # Try new ai_usage table
        try:
            cursor.execute(f"""
                SELECT
                    operation,
                    COUNT(*) as count,
                    COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens,
                    COALESCE(SUM(cost_usd), 0) as total_cost
                FROM ai_usage
                WHERE created_at >= %s {tenant_filter}
                GROUP BY operation
                ORDER BY total_cost DESC
            """, [start_date] + tenant_params)

            rows = cursor.fetchall()
            if rows:
                for row in rows:
                    usage_by_operation.append({
                        "operation": row["operation"],
                        "count": row["count"],
                        "tokens": int(row["total_tokens"]) if row["total_tokens"] else 0,
                        "cost": float(row["total_cost"]) if row["total_cost"] else 0
                    })

            cursor.execute(f"""
                SELECT
                    COUNT(*) as total_requests,
                    COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens,
                    COALESCE(SUM(cost_usd), 0) as total_cost
                FROM ai_usage
                WHERE created_at >= %s {tenant_filter}
            """, [start_date] + tenant_params)

            totals = cursor.fetchone()
            if totals:
                usage_totals = {
                    "requests": totals["total_requests"] or 0,
                    "tokens": int(totals["total_tokens"]) if totals["total_tokens"] else 0,
                    "cost": float(totals["total_cost"]) if totals["total_cost"] else 0
                }
        except psycopg2.Error:
            pass

        # Fall back to old api_usage_log if no data from new table
        if usage_totals["requests"] == 0:
            try:
                cursor.execute("""
                    SELECT
                        operation,
                        COUNT(*) as count,
                        COALESCE(SUM(tokens_used), 0) as total_tokens,
                        COALESCE(SUM(cost_usd), 0) as total_cost
                    FROM api_usage_log
                    WHERE created_at >= %s
                    GROUP BY operation
                    ORDER BY total_cost DESC
                """, [start_date])

                rows = cursor.fetchall()
                for row in rows:
                    usage_by_operation.append({
                        "operation": row["operation"],
                        "count": row["count"],
                        "tokens": int(row["total_tokens"]) if row["total_tokens"] else 0,
                        "cost": float(row["total_cost"]) if row["total_cost"] else 0
                    })

                cursor.execute("""
                    SELECT
                        COUNT(*) as total_requests,
                        COALESCE(SUM(tokens_used), 0) as total_tokens,
                        COALESCE(SUM(cost_usd), 0) as total_cost
                    FROM api_usage_log
                    WHERE created_at >= %s
                """, [start_date])

                totals = cursor.fetchone()
                if totals:
                    usage_totals = {
                        "requests": totals["total_requests"] or 0,
                        "tokens": int(totals["total_tokens"]) if totals["total_tokens"] else 0,
                        "cost": float(totals["total_cost"]) if totals["total_cost"] else 0
                    }
            except psycopg2.Error:
                pass

        # 2. Document Statistics - try new documents table first
        documents_by_category = []
        total_documents = 0

        # Try new documents table
        try:
            if tenant_id:
                cursor.execute("""
                    SELECT category, COUNT(*) as count
                    FROM documents
                    WHERE tenant_id = %s
                    GROUP BY category
                    ORDER BY count DESC
                """, [tenant_id])
            else:
                cursor.execute("""
                    SELECT category, COUNT(*) as count
                    FROM documents
                    GROUP BY category
                    ORDER BY count DESC
                """)

            rows = cursor.fetchall()
            if rows:
                for row in rows:
                    documents_by_category.append({
                        "category": row["category"],
                        "count": row["count"]
                    })

            if tenant_id:
                cursor.execute("SELECT COUNT(*) as total FROM documents WHERE tenant_id = %s", [tenant_id])
            else:
                cursor.execute("SELECT COUNT(*) as total FROM documents")

            result = cursor.fetchone()
            total_documents = result["total"] if result else 0
        except psycopg2.Error:
            pass

        # Fall back to old family_documents if no data
        if total_documents == 0:
            try:
                cursor.execute("""
                    SELECT category, COUNT(*) as count
                    FROM family_documents
                    GROUP BY category
                    ORDER BY count DESC
                """)

                rows = cursor.fetchall()
                for row in rows:
                    documents_by_category.append({
                        "category": row["category"],
                        "count": row["count"]
                    })

                cursor.execute("SELECT COUNT(*) as total FROM family_documents")
                result = cursor.fetchone()
                total_documents = result["total"] if result else 0
            except psycopg2.Error:
                pass

        # 3. Tenant statistics (new schema only)
        tenant_stats = []
        try:
            cursor.execute("""
                SELECT
                    t.name,
                    t.slug,
                    t.plan,
                    t.ai_allowance_usd,
                    (SELECT COUNT(*) FROM tenant_memberships
                     WHERE tenant_id = t.id AND status = 'active') as member_count,
                    (SELECT COUNT(*) FROM documents WHERE tenant_id = t.id) as doc_count,
                    (SELECT COALESCE(SUM(cost_usd), 0) FROM ai_usage
                     WHERE tenant_id = t.id AND created_at >= %s) as period_cost
                FROM tenants t
                WHERE t.status = 'active'
                ORDER BY doc_count DESC
                LIMIT 10
            """, [start_date])

            for row in cursor.fetchall():
                tenant_stats.append({
                    "name": row["name"],
                    "slug": row["slug"],
                    "plan": row["plan"],
                    "allowance": float(row["ai_allowance_usd"]) if row["ai_allowance_usd"] else 0,
                    "members": row["member_count"] or 0,
                    "documents": row["doc_count"] or 0,
                    "period_cost": float(row["period_cost"]) if row["period_cost"] else 0
                })
        except psycopg2.Error:
            pass

        # 4. User statistics
        user_stats = {"total_users": 0, "active_users": 0}
        try:
            cursor.execute("SELECT COUNT(*) as total FROM users")
            result = cursor.fetchone()
            user_stats["total_users"] = result["total"] if result else 0

            cursor.execute("""
                SELECT COUNT(DISTINCT user_id) as active
                FROM tenant_memberships
                WHERE status = 'active' AND last_active >= %s
            """, [start_date])
            result = cursor.fetchone()
            user_stats["active_users"] = result["active"] if result else 0
        except psycopg2.Error:
            pass

        # 5. Daily activity
        daily_activity = []
        recent_activity = []

        # 6. Cost projection
        days_in_period = max((now - start_date).days, 1)
        daily_avg_cost = usage_totals["cost"] / days_in_period
        monthly_projection = daily_avg_cost * 30

        # 7. Health summary
        health_summary = {"services": {}, "recent_issues": []}
        try:
            cursor.execute("""
                SELECT DISTINCT ON (service)
                    service, status, response_time_ms, created_at
                FROM health_checks
                ORDER BY service, created_at DESC
            """)

            for row in cursor.fetchall():
                health_summary["services"][row["service"]] = {
                    "status": row["status"],
                    "response_time_ms": row["response_time_ms"],
                    "last_check": row["created_at"].isoformat() if row["created_at"] else None
                }
        except psycopg2.Error:
            pass

        # 8. Log summary
        log_summary = {"errors": 0, "warnings": 0, "by_category": []}
        try:
            cursor.execute("""
                SELECT
                    COUNT(*) FILTER (WHERE level = 'error') as errors,
                    COUNT(*) FILTER (WHERE level = 'warn') as warnings
                FROM system_logs
                WHERE created_at >= %s
            """, [start_date])

            log_row = cursor.fetchone()
            if log_row:
                log_summary["errors"] = log_row["errors"] or 0
                log_summary["warnings"] = log_row["warnings"] or 0
        except psycopg2.Error:
            pass

        return {
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": now.isoformat(),
            "usage": {
                "totals": usage_totals,
                "by_operation": usage_by_operation
            },
            "documents": {
                "total": total_documents,
                "by_category": documents_by_category
            },
            "tenants": tenant_stats,
            "users": user_stats,
            "activity": {
                "daily": daily_activity,
                "recent": recent_activity
            },
            "projections": {
                "daily_avg_cost": round(daily_avg_cost, 6),
                "monthly_estimate": round(monthly_projection, 4)
            },
            "health": health_summary,
            "logs": log_summary
        }

    except psycopg2.Error as e:
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        cursor.close()
        conn.close()

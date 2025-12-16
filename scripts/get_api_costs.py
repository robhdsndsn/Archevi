# get_api_costs.py
# Windmill Python script - Get API costs for admin dashboard
# Path: f/chatbot/get_api_costs
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Get API usage costs for the admin dashboard.

Returns aggregated cost data by provider, tenant, and time period.

Args:
    period: Time period - 'today', 'week', 'month', 'all' (default: 'month')
    tenant_id: Optional - filter by specific tenant
    group_by: How to group - 'provider', 'tenant', 'day', 'operation' (default: 'provider')

Returns:
    dict: {
        summary: {total_cost_usd, total_requests, period},
        by_provider: [{provider, endpoint, requests, cost_usd}],
        by_tenant: [{tenant_id, tenant_name, requests, cost_usd}],
        by_day: [{date, requests, cost_usd}],
        projections: {mtd_cost, projected_monthly}
    }
"""

from datetime import datetime, timedelta
from typing import Optional
import wmill
import psycopg2


def main(
    period: str = "month",
    tenant_id: Optional[str] = None,
    group_by: str = "provider"
) -> dict:
    """Get API costs with various aggregations."""

    # Calculate date range
    now = datetime.utcnow()
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # 'all'
        start_date = datetime(2020, 1, 1)

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

        # Check if api_usage table exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'api_usage'
            )
        """)
        table_exists = cursor.fetchone()[0]

        if not table_exists:
            cursor.close()
            conn.close()
            # Return empty data structure if table doesn't exist yet
            return {
                "summary": {
                    "total_cost_usd": 0,
                    "total_requests": 0,
                    "period": period,
                    "start_date": start_date.isoformat(),
                    "end_date": now.isoformat()
                },
                "by_provider": [],
                "by_tenant": [],
                "by_day": [],
                "projections": {
                    "mtd_cost_usd": 0,
                    "projected_monthly_usd": 0,
                    "days_elapsed": now.day,
                    "days_in_month": 30
                },
                "message": "API usage tracking table not yet created. Run migration 005."
            }

        # Build tenant filter
        tenant_filter = ""
        params = [start_date]
        if tenant_id:
            tenant_filter = "AND tenant_id = %s::uuid"
            params.append(tenant_id)

        # Get summary totals
        cursor.execute(f"""
            SELECT
                COUNT(*) as total_requests,
                COALESCE(SUM(cost_cents), 0) as total_cost_cents,
                COALESCE(SUM(input_tokens), 0) as total_input_tokens,
                COALESCE(SUM(output_tokens), 0) as total_output_tokens
            FROM api_usage
            WHERE created_at >= %s {tenant_filter}
        """, params)
        summary_row = cursor.fetchone()

        summary = {
            "total_cost_usd": round(summary_row[1] / 100, 4) if summary_row[1] else 0,
            "total_requests": summary_row[0] or 0,
            "total_input_tokens": summary_row[2] or 0,
            "total_output_tokens": summary_row[3] or 0,
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": now.isoformat()
        }

        # By provider breakdown
        cursor.execute(f"""
            SELECT
                provider,
                endpoint,
                model,
                COUNT(*) as requests,
                COALESCE(SUM(cost_cents), 0) as cost_cents,
                COALESCE(SUM(input_tokens), 0) as input_tokens,
                COALESCE(SUM(output_tokens), 0) as output_tokens,
                AVG(latency_ms)::INTEGER as avg_latency_ms
            FROM api_usage
            WHERE created_at >= %s {tenant_filter}
            GROUP BY provider, endpoint, model
            ORDER BY cost_cents DESC
        """, params)

        by_provider = []
        for row in cursor.fetchall():
            by_provider.append({
                "provider": row[0],
                "endpoint": row[1],
                "model": row[2],
                "requests": row[3],
                "cost_usd": round(row[4] / 100, 4),
                "input_tokens": row[5],
                "output_tokens": row[6],
                "avg_latency_ms": row[7]
            })

        # By tenant breakdown (admin view)
        cursor.execute(f"""
            SELECT
                u.tenant_id,
                t.name as tenant_name,
                COUNT(*) as requests,
                COALESCE(SUM(u.cost_cents), 0) as cost_cents
            FROM api_usage u
            LEFT JOIN tenants t ON u.tenant_id = t.id
            WHERE u.created_at >= %s
            GROUP BY u.tenant_id, t.name
            ORDER BY cost_cents DESC
        """, [start_date])

        by_tenant = []
        for row in cursor.fetchall():
            by_tenant.append({
                "tenant_id": str(row[0]),
                "tenant_name": row[1] or "Unknown",
                "requests": row[2],
                "cost_usd": round(row[3] / 100, 4)
            })

        # By day breakdown (last 30 days)
        cursor.execute(f"""
            SELECT
                DATE(created_at) as date,
                COUNT(*) as requests,
                COALESCE(SUM(cost_cents), 0) as cost_cents
            FROM api_usage
            WHERE created_at >= %s - INTERVAL '30 days' {tenant_filter}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        """, params)

        by_day = []
        for row in cursor.fetchall():
            by_day.append({
                "date": row[0].isoformat(),
                "requests": row[1],
                "cost_usd": round(row[2] / 100, 4)
            })

        # Calculate projections
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        cursor.execute(f"""
            SELECT COALESCE(SUM(cost_cents), 0) as mtd_cost_cents
            FROM api_usage
            WHERE created_at >= %s {tenant_filter}
        """, [month_start] + (params[1:] if tenant_id else []))
        mtd_row = cursor.fetchone()
        mtd_cost_cents = mtd_row[0] or 0

        days_elapsed = now.day
        days_in_month = 30  # Approximate
        if mtd_cost_cents > 0 and days_elapsed > 0:
            daily_avg = mtd_cost_cents / days_elapsed
            projected_monthly = daily_avg * days_in_month
        else:
            projected_monthly = 0

        projections = {
            "mtd_cost_usd": round(mtd_cost_cents / 100, 4),
            "projected_monthly_usd": round(projected_monthly / 100, 2),
            "days_elapsed": days_elapsed,
            "days_in_month": days_in_month
        }

        cursor.close()
        conn.close()

        return {
            "summary": summary,
            "by_provider": by_provider,
            "by_tenant": by_tenant,
            "by_day": by_day,
            "projections": projections
        }

    except psycopg2.Error as e:
        return {
            "error": f"Database error: {str(e)}",
            "summary": {"total_cost_usd": 0, "total_requests": 0, "period": period},
            "by_provider": [],
            "by_tenant": [],
            "by_day": [],
            "projections": {}
        }

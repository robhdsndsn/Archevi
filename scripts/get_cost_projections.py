"""
Get cost projections and forecasting for admin dashboard.

Analyzes historical usage data to project future costs and identify trends.
"""

import wmill
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional
from datetime import datetime, timedelta
from decimal import Decimal


def main(tenant_id: Optional[str] = None):
    """
    Get cost projections based on historical usage.

    Args:
        tenant_id: Optional tenant to filter by

    Returns:
        dict: Cost projections and forecasts
    """
    pg_resource = wmill.get_resource("f/chatbot/postgres_db")

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    days_elapsed = (now - month_start).days + 1
    days_in_month = 30  # Simplified

    projections = {
        "current_month": {
            "month": now.strftime("%B %Y"),
            "days_elapsed": days_elapsed,
            "days_remaining": days_in_month - days_elapsed,
            "mtd_cost_usd": 0.0,
            "mtd_tokens": 0,
            "mtd_operations": 0,
            "projected_cost_usd": 0.0,
            "projected_tokens": 0,
            "budget_status": "on_track",  # on_track, warning, over_budget
        },
        "by_tenant": [],
        "historical": [],
        "trends": {
            "cost_trend": "stable",  # increasing, decreasing, stable
            "cost_change_pct": 0.0,
            "token_trend": "stable",
            "token_change_pct": 0.0,
        },
        "forecasts": {
            "next_month_cost_usd": 0.0,
            "next_month_tokens": 0,
            "quarterly_cost_usd": 0.0,
            "annual_cost_usd": 0.0,
        },
        "budget_alerts": [],
        "cost_breakdown": {
            "by_operation": [],
            "by_model": [],
        },
    }

    conn = psycopg2.connect(
        host=pg_resource.get("host", "localhost"),
        port=pg_resource.get("port", 5432),
        dbname=pg_resource.get("dbname", "windmill"),
        user=pg_resource.get("user", "postgres"),
        password=pg_resource.get("password", ""),
        sslmode=pg_resource.get("sslmode", "prefer"),
    )

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            tenant_filter = f"AND au.tenant_id = '{tenant_id}'" if tenant_id else ""
            tenant_filter_t = f"AND t.id = '{tenant_id}'" if tenant_id else ""

            # Current month stats
            cur.execute(f"""
                SELECT
                    COALESCE(SUM(cost_usd), 0) as mtd_cost,
                    COALESCE(SUM(input_tokens + output_tokens), 0) as mtd_tokens,
                    COUNT(*) as mtd_operations
                FROM ai_usage au
                WHERE au.created_at >= %s {tenant_filter}
            """, (month_start,))
            mtd = cur.fetchone()
            mtd_cost = float(mtd["mtd_cost"] or 0)
            mtd_tokens = int(mtd["mtd_tokens"] or 0)
            mtd_operations = int(mtd["mtd_operations"] or 0)

            projections["current_month"]["mtd_cost_usd"] = round(mtd_cost, 4)
            projections["current_month"]["mtd_tokens"] = mtd_tokens
            projections["current_month"]["mtd_operations"] = mtd_operations

            # Project to end of month
            if days_elapsed > 0:
                daily_avg_cost = mtd_cost / days_elapsed
                daily_avg_tokens = mtd_tokens / days_elapsed
                projected_cost = daily_avg_cost * days_in_month
                projected_tokens = int(daily_avg_tokens * days_in_month)
            else:
                projected_cost = 0
                projected_tokens = 0

            projections["current_month"]["projected_cost_usd"] = round(projected_cost, 2)
            projections["current_month"]["projected_tokens"] = projected_tokens

            # Per-tenant projections
            cur.execute(f"""
                SELECT
                    t.id as tenant_id,
                    t.name as tenant_name,
                    t.ai_allowance_usd,
                    COALESCE(SUM(au.cost_usd), 0) as mtd_cost,
                    COALESCE(SUM(au.input_tokens + au.output_tokens), 0) as mtd_tokens,
                    COUNT(au.id) as mtd_operations
                FROM tenants t
                LEFT JOIN ai_usage au ON au.tenant_id = t.id AND au.created_at >= %s
                WHERE t.status = 'active' {tenant_filter_t}
                GROUP BY t.id, t.name, t.ai_allowance_usd
                ORDER BY mtd_cost DESC
            """, (month_start,))

            tenant_projections = []
            for row in cur.fetchall():
                tenant_mtd = float(row["mtd_cost"] or 0)
                allowance = float(row["ai_allowance_usd"] or 0)

                if days_elapsed > 0:
                    projected = (tenant_mtd / days_elapsed) * days_in_month
                else:
                    projected = 0

                usage_pct = (tenant_mtd / allowance * 100) if allowance > 0 else 0
                projected_pct = (projected / allowance * 100) if allowance > 0 else 0

                status = "on_track"
                if projected_pct >= 100:
                    status = "over_budget"
                elif projected_pct >= 80:
                    status = "warning"

                tenant_projections.append({
                    "tenant_id": row["tenant_id"],
                    "tenant_name": row["tenant_name"],
                    "budget_usd": allowance,
                    "mtd_cost_usd": round(tenant_mtd, 4),
                    "mtd_tokens": int(row["mtd_tokens"] or 0),
                    "mtd_operations": int(row["mtd_operations"] or 0),
                    "projected_cost_usd": round(projected, 2),
                    "budget_usage_pct": round(usage_pct, 1),
                    "projected_usage_pct": round(projected_pct, 1),
                    "status": status,
                })

                # Add budget alerts
                if status in ["warning", "over_budget"]:
                    projections["budget_alerts"].append({
                        "tenant_id": row["tenant_id"],
                        "tenant_name": row["tenant_name"],
                        "status": status,
                        "current_pct": round(usage_pct, 1),
                        "projected_pct": round(projected_pct, 1),
                        "budget_usd": allowance,
                    })

            projections["by_tenant"] = tenant_projections

            # Historical monthly data (last 6 months)
            cur.execute(f"""
                SELECT
                    DATE_TRUNC('month', au.created_at) as month,
                    SUM(au.cost_usd) as cost,
                    SUM(au.input_tokens + au.output_tokens) as tokens,
                    COUNT(*) as operations
                FROM ai_usage au
                WHERE au.created_at >= %s {tenant_filter}
                GROUP BY DATE_TRUNC('month', au.created_at)
                ORDER BY month
            """, (now - timedelta(days=180),))

            historical = []
            for row in cur.fetchall():
                historical.append({
                    "month": row["month"].strftime("%Y-%m") if row["month"] else None,
                    "cost_usd": round(float(row["cost"] or 0), 2),
                    "tokens": int(row["tokens"] or 0),
                    "operations": int(row["operations"] or 0),
                })
            projections["historical"] = historical

            # Calculate trends (compare last 2 months)
            if len(historical) >= 2:
                prev_month = historical[-2]["cost_usd"] if historical[-2]["cost_usd"] > 0 else 1
                curr_month = historical[-1]["cost_usd"]
                cost_change = ((curr_month - prev_month) / prev_month) * 100

                projections["trends"]["cost_change_pct"] = round(cost_change, 1)
                if cost_change > 10:
                    projections["trends"]["cost_trend"] = "increasing"
                elif cost_change < -10:
                    projections["trends"]["cost_trend"] = "decreasing"
                else:
                    projections["trends"]["cost_trend"] = "stable"

                prev_tokens = historical[-2]["tokens"] if historical[-2]["tokens"] > 0 else 1
                curr_tokens = historical[-1]["tokens"]
                token_change = ((curr_tokens - prev_tokens) / prev_tokens) * 100

                projections["trends"]["token_change_pct"] = round(token_change, 1)
                if token_change > 10:
                    projections["trends"]["token_trend"] = "increasing"
                elif token_change < -10:
                    projections["trends"]["token_trend"] = "decreasing"

            # Forecasts based on trend
            avg_monthly_cost = sum(h["cost_usd"] for h in historical) / len(historical) if historical else projected_cost
            trend_multiplier = 1 + (projections["trends"]["cost_change_pct"] / 100)

            projections["forecasts"]["next_month_cost_usd"] = round(avg_monthly_cost * trend_multiplier, 2)
            projections["forecasts"]["next_month_tokens"] = int(
                (sum(h["tokens"] for h in historical) / len(historical) if historical else projected_tokens) * trend_multiplier
            )
            projections["forecasts"]["quarterly_cost_usd"] = round(avg_monthly_cost * 3, 2)
            projections["forecasts"]["annual_cost_usd"] = round(avg_monthly_cost * 12, 2)

            # Cost breakdown by operation
            cur.execute(f"""
                SELECT
                    operation,
                    SUM(cost_usd) as cost,
                    SUM(input_tokens + output_tokens) as tokens,
                    COUNT(*) as count
                FROM ai_usage au
                WHERE au.created_at >= %s {tenant_filter}
                GROUP BY operation
                ORDER BY cost DESC
            """, (month_start,))
            projections["cost_breakdown"]["by_operation"] = [
                {
                    "operation": row["operation"],
                    "cost_usd": round(float(row["cost"] or 0), 4),
                    "tokens": int(row["tokens"] or 0),
                    "count": int(row["count"] or 0),
                }
                for row in cur.fetchall()
            ]

            # Cost breakdown by model
            cur.execute(f"""
                SELECT
                    model,
                    SUM(cost_usd) as cost,
                    SUM(input_tokens + output_tokens) as tokens,
                    COUNT(*) as count
                FROM ai_usage au
                WHERE au.created_at >= %s {tenant_filter}
                GROUP BY model
                ORDER BY cost DESC
            """, (month_start,))
            projections["cost_breakdown"]["by_model"] = [
                {
                    "model": row["model"],
                    "cost_usd": round(float(row["cost"] or 0), 4),
                    "tokens": int(row["tokens"] or 0),
                    "count": int(row["count"] or 0),
                }
                for row in cur.fetchall()
            ]

            # Overall budget status
            total_budget = sum(t["budget_usd"] for t in tenant_projections)
            if total_budget > 0:
                overall_projected_pct = (projected_cost / total_budget) * 100
                if overall_projected_pct >= 100:
                    projections["current_month"]["budget_status"] = "over_budget"
                elif overall_projected_pct >= 80:
                    projections["current_month"]["budget_status"] = "warning"

    finally:
        conn.close()

    return projections


if __name__ == "__main__":
    import json
    print(json.dumps(main(), indent=2, default=str))

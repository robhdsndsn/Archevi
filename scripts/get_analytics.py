# get_analytics.py
# Windmill Python script for fetching usage analytics
# Path: f/chatbot/get_analytics
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Fetch usage analytics and statistics for the Archevi dashboard.

Returns aggregated data about:
- API usage (tokens, costs by operation)
- Document statistics (count by category)
- Conversation activity (queries over time)
- Cost projections
- Model usage stats (command-r vs command-a selection)
- System health summary
- Error/warning counts

Args:
    period (str): Time period - 'day', 'week', 'month', 'all' (default: 'week')

Returns:
    dict: Analytics data with sections for usage, documents, activity, costs, model_stats, health
"""

import psycopg2
from datetime import datetime, timedelta
from typing import Optional
import wmill


def main(period: str = "week") -> dict:
    """
    Fetch comprehensive analytics for the dashboard.
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
        start_date = datetime(2020, 1, 1)  # Effectively all time

    # Fetch database resource
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

        # 1. API Usage Summary
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
        """, (start_date,))

        usage_rows = cursor.fetchall()
        usage_by_operation = [
            {
                "operation": row[0],
                "count": row[1],
                "tokens": row[2],
                "cost": float(row[3])
            }
            for row in usage_rows
        ]

        # 2. Total usage stats
        cursor.execute("""
            SELECT
                COUNT(*) as total_requests,
                COALESCE(SUM(tokens_used), 0) as total_tokens,
                COALESCE(SUM(cost_usd), 0) as total_cost
            FROM api_usage_log
            WHERE created_at >= %s
        """, (start_date,))

        totals = cursor.fetchone()
        usage_totals = {
            "requests": totals[0],
            "tokens": totals[1],
            "cost": float(totals[2])
        }

        # 3. Document Statistics
        cursor.execute("""
            SELECT
                category,
                COUNT(*) as count
            FROM family_documents
            GROUP BY category
            ORDER BY count DESC
        """)

        doc_rows = cursor.fetchall()
        documents_by_category = [
            {"category": row[0], "count": row[1]}
            for row in doc_rows
        ]

        cursor.execute("SELECT COUNT(*) FROM family_documents")
        total_documents = cursor.fetchone()[0]

        # 4. Activity over time (daily for the period)
        cursor.execute("""
            SELECT
                DATE(created_at) as date,
                COUNT(*) as queries
            FROM api_usage_log
            WHERE created_at >= %s AND operation = 'rag_query'
            GROUP BY DATE(created_at)
            ORDER BY date
        """, (start_date,))

        activity_rows = cursor.fetchall()
        daily_activity = [
            {"date": row[0].isoformat(), "queries": row[1]}
            for row in activity_rows
        ]

        # 5. Recent activity (last 10 operations)
        cursor.execute("""
            SELECT operation, tokens_used, cost_usd, created_at
            FROM api_usage_log
            ORDER BY created_at DESC
            LIMIT 10
        """)

        recent_rows = cursor.fetchall()
        recent_activity = [
            {
                "operation": row[0],
                "tokens": row[1],
                "cost": float(row[2]) if row[2] else 0,
                "timestamp": row[3].isoformat()
            }
            for row in recent_rows
        ]

        # 6. Cost projection (based on current period's usage)
        days_in_period = (now - start_date).days or 1
        daily_avg_cost = usage_totals["cost"] / days_in_period
        monthly_projection = daily_avg_cost * 30

        # 7. Model usage stats (for cost optimization insights)
        model_stats = {"by_model": [], "savings_estimate": 0, "threshold_analysis": {}}
        try:
            cursor.execute("""
                SELECT
                    model_selected,
                    COUNT(*) as count,
                    AVG(top_relevance)::NUMERIC(4,3) as avg_relevance,
                    AVG(latency_ms)::INTEGER as avg_latency,
                    AVG(response_tokens)::INTEGER as avg_tokens
                FROM model_usage
                WHERE created_at >= %s
                GROUP BY model_selected
            """, (start_date,))

            model_rows = cursor.fetchall()
            for row in model_rows:
                model_stats["by_model"].append({
                    "model": row[0],
                    "count": row[1],
                    "avg_relevance": float(row[2]) if row[2] else 0,
                    "avg_latency_ms": row[3] or 0,
                    "avg_tokens": row[4] or 0
                })

            # Calculate estimated savings from adaptive model selection
            # Compare actual cost vs if all queries used command-a
            cursor.execute("""
                SELECT
                    COUNT(*) FILTER (WHERE model_selected LIKE 'command-r%') as cheap_count,
                    COUNT(*) FILTER (WHERE model_selected LIKE 'command-a%') as expensive_count,
                    AVG(response_tokens) as avg_tokens
                FROM model_usage
                WHERE created_at >= %s
            """, (start_date,))

            savings_row = cursor.fetchone()
            if savings_row and savings_row[0]:
                cheap_count = savings_row[0] or 0
                avg_tokens = savings_row[2] or 200
                # Estimate: command-r saves ~$0.01 per query vs command-a
                model_stats["savings_estimate"] = round(cheap_count * 0.01, 2)

            # Threshold analysis - help tune the 0.7 threshold
            cursor.execute("""
                SELECT
                    CASE
                        WHEN top_relevance > 0.8 THEN 'high (>0.8)'
                        WHEN top_relevance > 0.7 THEN 'medium (0.7-0.8)'
                        WHEN top_relevance > 0.5 THEN 'low (0.5-0.7)'
                        ELSE 'very_low (<0.5)'
                    END as relevance_bucket,
                    COUNT(*) as count,
                    model_selected
                FROM model_usage
                WHERE created_at >= %s
                GROUP BY relevance_bucket, model_selected
                ORDER BY relevance_bucket
            """, (start_date,))

            threshold_rows = cursor.fetchall()
            for row in threshold_rows:
                bucket = row[0]
                if bucket not in model_stats["threshold_analysis"]:
                    model_stats["threshold_analysis"][bucket] = {}
                model_stats["threshold_analysis"][bucket][row[2]] = row[1]

        except psycopg2.Error:
            # Table might not exist yet
            pass

        # 8. System health summary
        health_summary = {"services": {}, "recent_issues": []}
        try:
            # Get latest status for each service
            cursor.execute("""
                SELECT DISTINCT ON (service)
                    service, status, response_time_ms, created_at
                FROM health_checks
                ORDER BY service, created_at DESC
            """)

            health_rows = cursor.fetchall()
            for row in health_rows:
                health_summary["services"][row[0]] = {
                    "status": row[1],
                    "response_time_ms": row[2],
                    "last_check": row[3].isoformat() if row[3] else None
                }

            # Get recent issues (down or degraded in last 24h)
            cursor.execute("""
                SELECT service, status, error_message, created_at
                FROM health_checks
                WHERE status != 'up' AND created_at >= NOW() - INTERVAL '24 hours'
                ORDER BY created_at DESC
                LIMIT 10
            """)

            issue_rows = cursor.fetchall()
            health_summary["recent_issues"] = [
                {
                    "service": row[0],
                    "status": row[1],
                    "error": row[2],
                    "timestamp": row[3].isoformat() if row[3] else None
                }
                for row in issue_rows
            ]

        except psycopg2.Error:
            # Table might not exist yet
            pass

        # 9. Error/warning counts from system_logs
        log_summary = {"errors": 0, "warnings": 0, "by_category": []}
        try:
            cursor.execute("""
                SELECT
                    COUNT(*) FILTER (WHERE level = 'error') as errors,
                    COUNT(*) FILTER (WHERE level = 'warn') as warnings
                FROM system_logs
                WHERE created_at >= %s
            """, (start_date,))

            log_row = cursor.fetchone()
            if log_row:
                log_summary["errors"] = log_row[0] or 0
                log_summary["warnings"] = log_row[1] or 0

            cursor.execute("""
                SELECT category, level, COUNT(*) as count
                FROM system_logs
                WHERE created_at >= %s AND level IN ('error', 'warn')
                GROUP BY category, level
                ORDER BY count DESC
                LIMIT 10
            """, (start_date,))

            cat_rows = cursor.fetchall()
            log_summary["by_category"] = [
                {"category": row[0], "level": row[1], "count": row[2]}
                for row in cat_rows
            ]

        except psycopg2.Error:
            # Table might not exist yet
            pass

        cursor.close()
        conn.close()

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
            "activity": {
                "daily": daily_activity,
                "recent": recent_activity
            },
            "projections": {
                "daily_avg_cost": round(daily_avg_cost, 6),
                "monthly_estimate": round(monthly_projection, 4)
            },
            "model_stats": model_stats,
            "health": health_summary,
            "logs": log_summary
        }

    except psycopg2.Error as e:
        raise RuntimeError(f"Database error: {str(e)}")

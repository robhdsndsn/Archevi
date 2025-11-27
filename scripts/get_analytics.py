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

Args:
    period (str): Time period - 'day', 'week', 'month', 'all' (default: 'week')

Returns:
    dict: Analytics data with sections for usage, documents, activity, costs
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
            }
        }

    except psycopg2.Error as e:
        raise RuntimeError(f"Database error: {str(e)}")

"""
Get RAG query statistics.

Returns query performance metrics, popular queries, and usage patterns.
"""

import wmill
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional
from datetime import datetime, timedelta


def main(
    tenant_id: Optional[str] = None,
    period: str = "week"  # today, week, month
):
    """
    Get RAG query statistics.

    Args:
        tenant_id: Optional tenant to filter by
        period: Time period (today, week, month)

    Returns:
        dict: Query statistics
    """
    pg_resource = wmill.get_resource("f/chatbot/postgres_db")

    # Calculate date range
    now = datetime.utcnow()
    if period == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start_date = now - timedelta(days=7)
    else:  # month
        start_date = now - timedelta(days=30)

    stats = {
        "summary": {
            "total_queries": 0,
            "avg_response_time_ms": 0,
            "avg_documents_retrieved": 0,
            "successful_queries": 0,
            "failed_queries": 0,
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": now.isoformat(),
        },
        "by_tenant": [],
        "by_hour": [],
        "by_day": [],
        "top_categories": [],
        "performance": {
            "p50_latency_ms": 0,
            "p90_latency_ms": 0,
            "p99_latency_ms": 0,
        },
        "recent_queries": [],
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
            # Check if chat_messages table exists
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'chat_messages'
                )
            """)
            if not cur.fetchone()["exists"]:
                return {
                    **stats,
                    "message": "Query tracking not yet configured. Chat messages table does not exist."
                }

            # Build tenant filter - tenant_id is on chat_sessions, not chat_messages
            tenant_filter = f"AND cs.tenant_id = '{tenant_id}'" if tenant_id else ""

            # Total queries (messages via sessions)
            cur.execute(f"""
                SELECT
                    COUNT(*) as total,
                    COUNT(CASE WHEN cm.role = 'assistant' THEN 1 END) as responses
                FROM chat_messages cm
                JOIN chat_sessions cs ON cs.id = cm.session_id
                WHERE cm.created_at >= %s {tenant_filter}
            """, (start_date,))
            result = cur.fetchone()
            stats["summary"]["total_queries"] = result["total"] if result else 0

            # Queries by tenant
            cur.execute(f"""
                SELECT
                    t.id as tenant_id,
                    t.name as tenant_name,
                    COUNT(*) as query_count,
                    COUNT(DISTINCT cm.session_id) as conversations
                FROM chat_messages cm
                JOIN chat_sessions cs ON cs.id = cm.session_id
                JOIN tenants t ON t.id = cs.tenant_id
                WHERE cm.created_at >= %s AND cm.role = 'user' {tenant_filter}
                GROUP BY t.id, t.name
                ORDER BY query_count DESC
            """, (start_date,))
            stats["by_tenant"] = [dict(row) for row in cur.fetchall()]

            # Queries by day
            cur.execute(f"""
                SELECT
                    DATE(cm.created_at) as date,
                    COUNT(*) as queries
                FROM chat_messages cm
                JOIN chat_sessions cs ON cs.id = cm.session_id
                WHERE cm.created_at >= %s AND cm.role = 'user' {tenant_filter}
                GROUP BY DATE(cm.created_at)
                ORDER BY date
            """, (start_date,))
            stats["by_day"] = [{"date": str(row["date"]), "queries": row["queries"]} for row in cur.fetchall()]

            # Queries by hour (for today)
            if period == "today":
                cur.execute(f"""
                    SELECT
                        EXTRACT(HOUR FROM cm.created_at)::int as hour,
                        COUNT(*) as queries
                    FROM chat_messages cm
                    JOIN chat_sessions cs ON cs.id = cm.session_id
                    WHERE cm.created_at >= %s AND cm.role = 'user' {tenant_filter}
                    GROUP BY EXTRACT(HOUR FROM cm.created_at)
                    ORDER BY hour
                """, (start_date,))
                stats["by_hour"] = [dict(row) for row in cur.fetchall()]

            # Recent queries
            cur.execute(f"""
                SELECT
                    cm.id,
                    LEFT(cm.content, 100) as query_preview,
                    t.name as tenant_name,
                    cm.created_at
                FROM chat_messages cm
                JOIN chat_sessions cs ON cs.id = cm.session_id
                JOIN tenants t ON t.id = cs.tenant_id
                WHERE cm.role = 'user' {tenant_filter}
                ORDER BY cm.created_at DESC
                LIMIT 20
            """, ())
            stats["recent_queries"] = [dict(row) for row in cur.fetchall()]

    except Exception as e:
        return {
            **stats,
            "error": str(e)
        }
    finally:
        conn.close()

    return stats


if __name__ == "__main__":
    import json
    print(json.dumps(main(), indent=2, default=str))

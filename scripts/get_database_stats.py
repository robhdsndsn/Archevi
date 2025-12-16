"""
Get database statistics for PostgreSQL with pgvector.

Returns database health, table sizes, connection info, and performance metrics.
"""

import wmill
import psycopg2
from psycopg2.extras import RealDictCursor


def main():
    """
    Get database statistics.

    Returns:
        dict: Database statistics for PostgreSQL
    """
    pg_resource = wmill.get_resource("f/chatbot/postgres_db")

    stats = {
        "postgres": {
            "status": "unknown",
            "version": None,
            "database": pg_resource.get("dbname", "windmill"),
            "host": pg_resource.get("host", "localhost"),
            "size_mb": 0,
            "tables": [],
            "connections": {
                "active": 0,
                "idle": 0,
                "max": 100,
            },
            "extensions": [],
            "recent_migrations": [],
        },
        "pgvector": {
            "status": "unknown",
            "total_vectors": 0,
            "vector_dimensions": 1024,
            "index_info": [],
        },
    }

    # PostgreSQL stats
    try:
        conn = psycopg2.connect(
            host=pg_resource.get("host", "localhost"),
            port=pg_resource.get("port", 5432),
            dbname=pg_resource.get("dbname", "windmill"),
            user=pg_resource.get("user", "postgres"),
            password=pg_resource.get("password", ""),
            sslmode=pg_resource.get("sslmode", "prefer"),
        )

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Version
            cur.execute("SELECT version()")
            stats["postgres"]["version"] = cur.fetchone()["version"].split(",")[0]

            # Database size
            cur.execute("""
                SELECT pg_database_size(current_database()) / 1024 / 1024 as size_mb
            """)
            stats["postgres"]["size_mb"] = round(cur.fetchone()["size_mb"], 2)

            # Extensions
            cur.execute("""
                SELECT extname, extversion
                FROM pg_extension
                WHERE extname IN ('vector', 'uuid-ossp', 'pg_trgm')
            """)
            stats["postgres"]["extensions"] = [dict(row) for row in cur.fetchall()]

            # Table sizes (app tables only)
            cur.execute("""
                SELECT
                    relname as table_name,
                    n_live_tup as row_count,
                    pg_total_relation_size(relid) / 1024 as size_kb
                FROM pg_stat_user_tables
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(relid) DESC
                LIMIT 20
            """)
            stats["postgres"]["tables"] = [dict(row) for row in cur.fetchall()]

            # Connection stats
            cur.execute("""
                SELECT
                    COUNT(*) FILTER (WHERE state = 'active') as active,
                    COUNT(*) FILTER (WHERE state = 'idle') as idle,
                    COUNT(*) as total
                FROM pg_stat_activity
                WHERE datname = current_database()
            """)
            conn_stats = cur.fetchone()
            stats["postgres"]["connections"]["active"] = conn_stats["active"]
            stats["postgres"]["connections"]["idle"] = conn_stats["idle"]

            # Get max connections
            cur.execute("SHOW max_connections")
            stats["postgres"]["connections"]["max"] = int(cur.fetchone()["max_connections"])

            # Recent migrations (if schema_migrations table exists)
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'schema_migrations'
                )
            """)
            if cur.fetchone()["exists"]:
                cur.execute("""
                    SELECT version, applied_at
                    FROM schema_migrations
                    ORDER BY applied_at DESC
                    LIMIT 5
                """)
                stats["postgres"]["recent_migrations"] = [dict(row) for row in cur.fetchall()]

            stats["postgres"]["status"] = "healthy"

            # pgvector stats
            cur.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM pg_extension WHERE extname = 'vector'
                ) as has_pgvector
            """)
            has_pgvector = cur.fetchone()["has_pgvector"]

            if has_pgvector:
                stats["pgvector"]["status"] = "healthy"

                # Count vectors
                cur.execute("""
                    SELECT COUNT(*) as total
                    FROM family_documents
                    WHERE embedding IS NOT NULL
                """)
                stats["pgvector"]["total_vectors"] = cur.fetchone()["total"]

                # Vector index info
                cur.execute("""
                    SELECT
                        indexname,
                        indexdef
                    FROM pg_indexes
                    WHERE indexdef LIKE '%vector%' OR indexdef LIKE '%ivfflat%' OR indexdef LIKE '%hnsw%'
                """)
                stats["pgvector"]["index_info"] = [dict(row) for row in cur.fetchall()]
            else:
                stats["pgvector"]["status"] = "not_installed"

        conn.close()
    except Exception as e:
        stats["postgres"]["status"] = "error"
        stats["postgres"]["error"] = str(e)

    return stats


if __name__ == "__main__":
    import json
    print(json.dumps(main(), indent=2, default=str))

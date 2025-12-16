"""
Get embedding statistics from PostgreSQL with pgvector.

Returns vector database statistics including document counts,
embedding coverage per tenant, and health metrics.
"""

import wmill
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional


def main(tenant_id: Optional[str] = None):
    """
    Get embedding statistics.

    Args:
        tenant_id: Optional tenant to filter by

    Returns:
        dict: Embedding statistics
    """
    pg_resource = wmill.get_resource("f/chatbot/postgres_db")

    stats = {
        "pgvector": {
            "status": "unknown",
            "total_vectors": 0,
            "vector_dimensions": 1024,
            "index_type": "ivfflat",
        },
        "by_tenant": [],
        "by_category": [],
        "embedding_health": {
            "documents_with_embeddings": 0,
            "documents_without_embeddings": 0,
            "embedding_coverage_pct": 0,
        },
        "recent_embeddings": [],
    }

    # Connect to PostgreSQL
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
            # Check pgvector extension
            cur.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM pg_extension WHERE extname = 'vector'
                ) as has_pgvector
            """)
            has_pgvector = cur.fetchone()["has_pgvector"]
            stats["pgvector"]["status"] = "healthy" if has_pgvector else "not_installed"

            # Total vectors (documents with embeddings)
            cur.execute("""
                SELECT COUNT(*) as total
                FROM family_documents
                WHERE embedding IS NOT NULL
            """)
            stats["pgvector"]["total_vectors"] = cur.fetchone()["total"]

            # Documents per tenant
            tenant_filter = f"WHERE t.id = '{tenant_id}'" if tenant_id else ""
            cur.execute(f"""
                SELECT
                    t.id as tenant_id,
                    t.name as tenant_name,
                    COUNT(d.id) as document_count,
                    COALESCE(SUM(CASE WHEN d.embedding IS NOT NULL THEN 1 ELSE 0 END), 0) as embedded_count
                FROM tenants t
                LEFT JOIN family_documents d ON d.tenant_id = t.id
                {tenant_filter}
                GROUP BY t.id, t.name
                ORDER BY document_count DESC
            """)
            stats["by_tenant"] = [dict(row) for row in cur.fetchall()]

            # Documents per category
            cur.execute("""
                SELECT
                    COALESCE(category, 'uncategorized') as category,
                    COUNT(*) as count,
                    SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as embedded_count
                FROM family_documents
                GROUP BY category
                ORDER BY count DESC
                LIMIT 20
            """)
            stats["by_category"] = [dict(row) for row in cur.fetchall()]

            # Embedding health stats
            cur.execute("""
                SELECT
                    COUNT(*) as total,
                    SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as with_embedding,
                    SUM(CASE WHEN embedding IS NULL THEN 1 ELSE 0 END) as without_embedding
                FROM family_documents
            """)
            health = cur.fetchone()
            stats["embedding_health"]["documents_with_embeddings"] = health["with_embedding"] or 0
            stats["embedding_health"]["documents_without_embeddings"] = health["without_embedding"] or 0
            total = health["total"] or 0
            if total > 0:
                stats["embedding_health"]["embedding_coverage_pct"] = round(
                    (health["with_embedding"] or 0) / total * 100, 1
                )

            # Recent documents with embeddings
            cur.execute("""
                SELECT
                    d.id,
                    d.title,
                    d.category,
                    t.name as tenant_name,
                    d.created_at
                FROM family_documents d
                JOIN tenants t ON t.id = d.tenant_id
                WHERE d.embedding IS NOT NULL
                ORDER BY d.created_at DESC
                LIMIT 10
            """)
            stats["recent_embeddings"] = [dict(row) for row in cur.fetchall()]

    finally:
        conn.close()

    return stats


if __name__ == "__main__":
    import json
    print(json.dumps(main(), indent=2, default=str))

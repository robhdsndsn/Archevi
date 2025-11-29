# list_tenants.py
# Windmill Python script for listing all tenants (admin only)
# Path: f/admin/list_tenants
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
List all tenants with summary statistics.

This is an admin-only endpoint that returns all tenants
with document counts and member counts.

Returns:
    list: List of tenants with stats
"""

import psycopg2
from typing import List
import wmill


def main() -> List[dict]:
    """List all tenants with summary statistics."""
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

    # Get tenants with member and document counts
    cursor.execute("""
        SELECT
            t.id,
            t.name,
            t.slug,
            t.plan,
            t.status,
            t.ai_allowance_usd,
            t.max_members,
            t.created_at,
            COUNT(DISTINCT tm.user_id) as member_count,
            COUNT(DISTINCT d.id) as document_count
        FROM tenants t
        LEFT JOIN tenant_memberships tm ON t.id = tm.tenant_id
        LEFT JOIN documents d ON t.id = d.tenant_id
        GROUP BY t.id, t.name, t.slug, t.plan, t.status, t.ai_allowance_usd, t.max_members, t.created_at
        ORDER BY t.created_at DESC
    """)

    results = cursor.fetchall()
    cursor.close()
    conn.close()

    tenants = []
    for row in results:
        tenants.append({
            "id": str(row[0]),
            "name": row[1],
            "slug": row[2],
            "plan": row[3],
            "status": row[4],
            "ai_allowance_usd": float(row[5]) if row[5] else 0,
            "max_members": row[6],
            "created_at": row[7].isoformat() if row[7] else None,
            "member_count": row[8],
            "document_count": row[9]
        })

    return tenants

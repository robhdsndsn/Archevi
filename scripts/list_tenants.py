# list_tenants.py
# Windmill Python script for listing all tenants (admin only)
# Path: f/admin/list_tenants
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - httpx

"""
List all tenants with summary statistics.

This is an admin-only endpoint that returns all tenants
with document counts, family member counts, and owner info.

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

    # Get tenants with family member counts, user counts, document counts, and owner info
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
            -- Count family member profiles
            COALESCE(fm_count.count, 0) as family_member_count,
            -- Count users with login access
            COALESCE(user_count.count, 0) as user_count,
            -- Document count
            COALESCE(doc_count.count, 0) as document_count,
            -- Owner info (first user with 'owner' role, or first admin, or first member)
            owner_info.user_id as owner_id,
            owner_info.user_name as owner_name,
            owner_info.user_email as owner_email
        FROM tenants t
        -- Family members count
        LEFT JOIN (
            SELECT tenant_id, COUNT(*) as count
            FROM family_members
            WHERE tenant_id IS NOT NULL
            GROUP BY tenant_id
        ) fm_count ON fm_count.tenant_id = t.id
        -- Users with access count
        LEFT JOIN (
            SELECT tenant_id, COUNT(DISTINCT user_id) as count
            FROM tenant_memberships
            WHERE status = 'active'
            GROUP BY tenant_id
        ) user_count ON user_count.tenant_id = t.id
        -- Document count
        LEFT JOIN (
            SELECT tenant_id, COUNT(*) as count
            FROM documents
            GROUP BY tenant_id
        ) doc_count ON doc_count.tenant_id = t.id
        -- Owner info (prioritize owner > admin > member)
        LEFT JOIN LATERAL (
            SELECT
                tm.user_id,
                u.name as user_name,
                u.email as user_email,
                tm.role,
                CASE tm.role
                    WHEN 'owner' THEN 1
                    WHEN 'admin' THEN 2
                    ELSE 3
                END as role_priority
            FROM tenant_memberships tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.tenant_id = t.id AND tm.status = 'active'
            ORDER BY role_priority, tm.created_at
            LIMIT 1
        ) owner_info ON true
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
            "family_member_count": row[8],
            "user_count": row[9],
            "document_count": row[10],
            # For backwards compatibility, keep member_count as family_member_count
            "member_count": row[8],
            "owner": {
                "id": str(row[11]) if row[11] else None,
                "name": row[12],
                "email": row[13]
            } if row[11] else None
        })

    return tenants

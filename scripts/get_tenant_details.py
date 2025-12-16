# get_tenant_details.py
# Windmill Python script for getting detailed tenant info (admin only)
# Path: f/admin/get_tenant_details
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - httpx

"""
Get detailed information about a specific tenant.

Returns comprehensive tenant details including:
- Basic tenant info (name, plan, status, limits)
- Family members (profiles, relationships)
- Users with login access (with their roles)
- Document statistics by category
- AI usage stats (30 days)
- Recent chat sessions
- Storage usage

Args:
    tenant_id (str): UUID of the tenant

Returns:
    dict: Tenant details with family_members, users, stats
"""

import psycopg2
from typing import Optional
import wmill


def main(tenant_id: str) -> dict:
    """Get detailed tenant information."""
    if not tenant_id:
        raise ValueError("tenant_id is required")

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

    # Get tenant info
    cursor.execute("""
        SELECT id, name, slug, plan, status, ai_allowance_usd, max_members, max_storage_gb, api_mode, created_at, updated_at
        FROM tenants
        WHERE id = %s::uuid
    """, (tenant_id,))

    tenant_row = cursor.fetchone()
    if not tenant_row:
        raise ValueError(f"Tenant not found: {tenant_id}")

    tenant = {
        "id": str(tenant_row[0]),
        "name": tenant_row[1],
        "slug": tenant_row[2],
        "plan": tenant_row[3],
        "status": tenant_row[4],
        "ai_allowance_usd": float(tenant_row[5]) if tenant_row[5] else 0,
        "max_members": tenant_row[6],
        "max_storage_gb": tenant_row[7],
        "api_mode": tenant_row[8],
        "created_at": tenant_row[9].isoformat() if tenant_row[9] else None,
        "updated_at": tenant_row[10].isoformat() if tenant_row[10] else None
    }

    # Get family members (profiles in the family)
    # Note: family_members is a legacy table with its own auth (email/password_hash)
    # It doesn't link to the users table via user_id - it has its own login system
    cursor.execute("""
        SELECT
            fm.id,
            fm.name,
            fm.email,
            fm.role,
            fm.member_type,
            fm.avatar_url,
            fm.created_at,
            fm.is_active,
            fm.last_login,
            fm.email_verified
        FROM family_members fm
        WHERE fm.tenant_id = %s::uuid
        ORDER BY fm.role = 'admin' DESC, fm.name
    """, (tenant_id,))

    family_members = []
    for row in cursor.fetchall():
        family_members.append({
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "role": row[3],
            "member_type": row[4],
            "avatar_url": row[5],
            "created_at": row[6].isoformat() if row[6] else None,
            "is_active": row[7],
            "last_login": row[8].isoformat() if row[8] else None,
            "email_verified": row[9]
        })

    # Get users with login access (from tenant_memberships)
    # These are users in the newer multi-tenant auth system
    cursor.execute("""
        SELECT
            u.id,
            u.email,
            u.name,
            tm.role,
            tm.status,
            tm.created_at,
            u.last_login,
            u.email_verified
        FROM tenant_memberships tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.tenant_id = %s::uuid
        ORDER BY
            CASE tm.role
                WHEN 'owner' THEN 1
                WHEN 'admin' THEN 2
                ELSE 3
            END,
            tm.created_at
    """, (tenant_id,))

    users = []
    owner = None
    for row in cursor.fetchall():
        user_data = {
            "id": str(row[0]),
            "email": row[1],
            "name": row[2],
            "role": row[3],
            "status": row[4],
            "joined_at": row[5].isoformat() if row[5] else None,
            "last_login": row[6].isoformat() if row[6] else None,
            "email_verified": row[7]
        }
        users.append(user_data)
        # First user with owner/admin role is the owner
        if owner is None and row[3] in ('owner', 'admin'):
            owner = {
                "id": str(row[0]),
                "name": row[2],
                "email": row[1],
                "role": row[3]
            }

    # Get document stats by category
    cursor.execute("""
        SELECT category, COUNT(*) as count
        FROM documents
        WHERE tenant_id = %s::uuid
        GROUP BY category
        ORDER BY count DESC
    """, (tenant_id,))

    doc_stats = {}
    total_docs = 0
    for row in cursor.fetchall():
        doc_stats[row[0]] = row[1]
        total_docs += row[1]

    # Get storage usage (sum of document sizes)
    cursor.execute("""
        SELECT COALESCE(SUM(file_size_bytes), 0) as total_bytes
        FROM documents
        WHERE tenant_id = %s::uuid
    """, (tenant_id,))
    storage_row = cursor.fetchone()
    storage_bytes = int(storage_row[0] or 0)
    storage_gb = storage_bytes / (1024 * 1024 * 1024)

    # Get AI usage stats (last 30 days)
    cursor.execute("""
        SELECT
            SUM(input_tokens) as total_input,
            SUM(output_tokens) as total_output,
            SUM(cost_usd) as total_cost,
            COUNT(*) as total_operations
        FROM ai_usage
        WHERE tenant_id = %s::uuid
          AND created_at > NOW() - INTERVAL '30 days'
    """, (tenant_id,))

    usage_row = cursor.fetchone()
    usage = {
        "input_tokens_30d": int(usage_row[0] or 0),
        "output_tokens_30d": int(usage_row[1] or 0),
        "cost_usd_30d": float(usage_row[2] or 0),
        "operations_30d": int(usage_row[3] or 0)
    }

    # Get recent chat sessions
    cursor.execute("""
        SELECT id, title, created_at
        FROM chat_sessions
        WHERE tenant_id = %s::uuid
        ORDER BY created_at DESC
        LIMIT 5
    """, (tenant_id,))

    recent_chats = []
    for row in cursor.fetchall():
        recent_chats.append({
            "id": str(row[0]),
            "title": row[1],
            "created_at": row[2].isoformat() if row[2] else None
        })

    cursor.close()
    conn.close()

    return {
        "tenant": tenant,
        "owner": owner,
        "family_members": family_members,
        "users": users,
        # Backwards compatibility
        "members": users,
        "document_stats": {
            "total": total_docs,
            "by_category": doc_stats
        },
        "storage": {
            "used_bytes": storage_bytes,
            "used_gb": round(storage_gb, 3),
            "limit_gb": tenant.get("max_storage_gb", 10),
            "percent_used": round((storage_gb / tenant.get("max_storage_gb", 10)) * 100, 1) if tenant.get("max_storage_gb") else 0
        },
        "usage": usage,
        "recent_chats": recent_chats
    }

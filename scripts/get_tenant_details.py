# get_tenant_details.py
# Windmill Python script for getting detailed tenant info (admin only)
# Path: f/admin/get_tenant_details
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Get detailed information about a specific tenant.

Args:
    tenant_id (str): UUID of the tenant

Returns:
    dict: Tenant details including members, document stats, usage
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

    # Get members
    cursor.execute("""
        SELECT u.id, u.email, u.name, tm.role, tm.created_at
        FROM tenant_memberships tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.tenant_id = %s::uuid
        ORDER BY tm.created_at
    """, (tenant_id,))

    members = []
    for row in cursor.fetchall():
        members.append({
            "id": str(row[0]),
            "email": row[1],
            "name": row[2],
            "role": row[3],
            "joined_at": row[4].isoformat() if row[4] else None
        })

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
        "members": members,
        "document_stats": {
            "total": total_docs,
            "by_category": doc_stats
        },
        "usage": usage,
        "recent_chats": recent_chats
    }

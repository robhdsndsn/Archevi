"""
Get User Tenants
Returns all tenants (families) a user has access to.

Windmill Script Configuration:
- Path: f/tenant/get_user_tenants
- Trigger: Called on login and when showing family switcher
"""

import wmill


def main(user_id: str) -> dict:
    """
    Get all tenants the user has access to.

    Args:
        user_id: UUID of the user

    Returns:
        dict with user info and list of accessible tenants
    """

    import psycopg2
    import psycopg2.extras

    # Try new resource first, fall back to old
    try:
        db_resource = wmill.get_resource("u/admin/archevi_postgres")
        conn = psycopg2.connect(db_resource["connection_string"])
    except:
        postgres_db = wmill.get_resource("f/chatbot/postgres_db")
        conn = psycopg2.connect(
            host=postgres_db["host"],
            port=postgres_db["port"],
            dbname=postgres_db["dbname"],
            user=postgres_db["user"],
            password=postgres_db["password"],
            sslmode=postgres_db.get("sslmode", "disable")
        )

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Get user info
            cur.execute("""
                SELECT id, email, name, default_tenant_id, avatar_url
                FROM users
                WHERE id = %s
            """, [user_id])
            user = cur.fetchone()

            if not user:
                return {
                    "success": False,
                    "error": "User not found"
                }

            # Get user's tenants with membership info
            cur.execute("""
                SELECT
                    t.id as tenant_id,
                    t.name as family_name,
                    t.slug,
                    tm.role,
                    t.plan,
                    t.status as tenant_status,
                    t.trial_ends_at,
                    (SELECT COUNT(*) FROM tenant_memberships
                     WHERE tenant_id = t.id AND status = 'active') as member_count,
                    (SELECT COUNT(*) FROM documents
                     WHERE tenant_id = t.id) as document_count,
                    tm.last_active,
                    CASE WHEN t.id = %s THEN true ELSE false END as is_default
                FROM tenants t
                JOIN tenant_memberships tm ON t.id = tm.tenant_id
                WHERE tm.user_id = %s
                  AND tm.status = 'active'
                  AND t.status IN ('active', 'pending')
                ORDER BY
                    CASE WHEN t.id = %s THEN 0 ELSE 1 END,
                    tm.last_active DESC NULLS LAST
            """, [user["default_tenant_id"], user_id, user["default_tenant_id"]])

            tenants = cur.fetchall()

            # Format response
            formatted_tenants = []
            for t in tenants:
                formatted_tenants.append({
                    "id": str(t["tenant_id"]),
                    "name": t["family_name"],
                    "slug": t["slug"],
                    "subdomain": f"{t['slug']}.archevi.ca",
                    "role": t["role"],
                    "plan": t["plan"],
                    "status": t["tenant_status"],
                    "trialEndsAt": t["trial_ends_at"].isoformat() if t["trial_ends_at"] else None,
                    "memberCount": t["member_count"],
                    "documentCount": t["document_count"],
                    "lastActive": t["last_active"].isoformat() if t["last_active"] else None,
                    "isDefault": t["is_default"]
                })

            return {
                "success": True,
                "user": {
                    "id": str(user["id"]),
                    "email": user["email"],
                    "name": user["name"],
                    "avatarUrl": user["avatar_url"],
                    "defaultTenantId": str(user["default_tenant_id"]) if user["default_tenant_id"] else None
                },
                "tenants": formatted_tenants,
                "tenantCount": len(formatted_tenants)
            }

    finally:
        conn.close()

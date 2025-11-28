"""
Switch Tenant Context
Updates user's active tenant and returns new JWT token.

Windmill Script Configuration:
- Path: f/tenant/switch_tenant
- Trigger: Called when user switches families in UI
"""

import wmill
import jwt
from datetime import datetime, timedelta


def main(user_id: str, tenant_id: str) -> dict:
    """
    Switch user's active tenant context.

    Args:
        user_id: UUID of the user
        tenant_id: UUID of the tenant to switch to

    Returns:
        dict with new JWT token and tenant info
    """

    db_resource = wmill.get_resource("u/admin/archevi_postgres")
    jwt_secret = wmill.get_variable("u/admin/jwt_secret")

    import psycopg2
    import psycopg2.extras

    conn = psycopg2.connect(db_resource["connection_string"])

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Verify user has access to this tenant
            cur.execute("""
                SELECT
                    tm.role,
                    t.id as tenant_id,
                    t.name as tenant_name,
                    t.slug,
                    t.plan,
                    t.status,
                    u.email,
                    u.name as user_name
                FROM tenant_memberships tm
                JOIN tenants t ON tm.tenant_id = t.id
                JOIN users u ON tm.user_id = u.id
                WHERE tm.user_id = %s
                  AND tm.tenant_id = %s
                  AND tm.status = 'active'
                  AND t.status IN ('active', 'pending')
            """, [user_id, tenant_id])

            membership = cur.fetchone()

            if not membership:
                return {
                    "success": False,
                    "error": "Access denied or tenant not found"
                }

            # Update last_active on membership
            cur.execute("""
                UPDATE tenant_memberships
                SET last_active = NOW()
                WHERE user_id = %s AND tenant_id = %s
            """, [user_id, tenant_id])

            # Update user's default tenant
            cur.execute("""
                UPDATE users
                SET default_tenant_id = %s
                WHERE id = %s
            """, [tenant_id, user_id])

            conn.commit()

            # Generate new JWT with tenant context
            token_payload = {
                "sub": user_id,
                "email": membership["email"],
                "name": membership["user_name"],
                "tenant_id": str(membership["tenant_id"]),
                "tenant_name": membership["tenant_name"],
                "tenant_slug": membership["slug"],
                "role": membership["role"],
                "plan": membership["plan"],
                "iat": datetime.utcnow(),
                "exp": datetime.utcnow() + timedelta(hours=24)
            }

            access_token = jwt.encode(token_payload, jwt_secret, algorithm="HS256")

            return {
                "success": True,
                "accessToken": access_token,
                "tenant": {
                    "id": str(membership["tenant_id"]),
                    "name": membership["tenant_name"],
                    "slug": membership["slug"],
                    "subdomain": f"{membership['slug']}.archevi.ca",
                    "plan": membership["plan"],
                    "status": membership["status"]
                },
                "role": membership["role"]
            }

    finally:
        conn.close()

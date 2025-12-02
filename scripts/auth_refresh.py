# auth_refresh.py
# Windmill Python script for refreshing JWT tokens
# Path: f/chatbot/auth_refresh
#
# requirements:
#   - psycopg2-binary
#   - PyJWT
#   - wmill

"""
Refresh access token using refresh token.

Args:
    refresh_token (str): Refresh token from login

Returns:
    dict: {
        success: bool,
        access_token: str (new access token),
        user: { id, email, name, role },
        error: str (if failed)
    }
"""

import psycopg2
import jwt
from datetime import datetime, timedelta
import wmill


# Must match auth_login.py
JWT_SECRET = "archevi-jwt-secret-2026-change-in-production"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRY = 15  # minutes


def main(refresh_token: str) -> dict:
    """Refresh access token using refresh token."""

    if not refresh_token:
        return {"success": False, "error": "No refresh token provided"}

    # Get database connection
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

        # Find session by refresh token
        cursor.execute("""
            SELECT s.member_id, s.expires_at, s.revoked,
                   m.email, m.name, m.role, m.is_active
            FROM user_sessions s
            JOIN family_members m ON s.member_id = m.id
            WHERE s.refresh_token = %s
        """, (refresh_token,))

        session = cursor.fetchone()

        if not session:
            return {"success": False, "error": "Invalid refresh token"}

        member_id, expires_at, revoked, email, name, role, is_active = session

        # Check if session is revoked
        if revoked:
            return {"success": False, "error": "Session has been revoked"}

        # Check if session is expired
        if expires_at < datetime.now():
            # Clean up expired session
            cursor.execute("DELETE FROM user_sessions WHERE refresh_token = %s", (refresh_token,))
            conn.commit()
            return {"success": False, "error": "Refresh token expired. Please login again"}

        # Check if user is still active
        if not is_active:
            return {"success": False, "error": "Account is deactivated"}

        # Get user's tenant information (same logic as auth_login)
        tenant_id = None
        tenant_name = None
        tenant_role = role

        # Try to get from users table (multi-tenant system)
        cursor.execute("""
            SELECT u.default_tenant_id, t.name, tm.role
            FROM users u
            LEFT JOIN tenants t ON u.default_tenant_id = t.id
            LEFT JOIN tenant_memberships tm ON u.id = tm.user_id AND tm.tenant_id = u.default_tenant_id
            WHERE u.email = %s
        """, (email,))
        tenant_result = cursor.fetchone()

        if tenant_result and tenant_result[0]:
            tenant_id = str(tenant_result[0])
            tenant_name = tenant_result[1]
            if tenant_result[2]:
                tenant_role = tenant_result[2]
        else:
            # Fall back: get first active tenant membership
            cursor.execute("""
                SELECT tm.tenant_id, t.name, tm.role
                FROM tenant_memberships tm
                JOIN tenants t ON tm.tenant_id = t.id
                JOIN users u ON tm.user_id = u.id
                WHERE u.email = %s AND tm.status = 'active' AND t.status = 'active'
                ORDER BY tm.created_at ASC NULLS LAST
                LIMIT 1
            """, (email,))
            fallback_result = cursor.fetchone()
            if fallback_result:
                tenant_id = str(fallback_result[0])
                tenant_name = fallback_result[1]
                tenant_role = fallback_result[2]

        # Generate new access token with tenant context
        now = datetime.utcnow()
        access_payload = {
            "sub": member_id,
            "email": email,
            "name": name,
            "role": tenant_role,
            "tenant_id": tenant_id,
            "type": "access",
            "iat": now,
            "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRY)
        }
        access_token = jwt.encode(access_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

        # Update last_active
        cursor.execute("""
            UPDATE family_members SET last_active = %s WHERE id = %s
        """, (datetime.now(), member_id))
        conn.commit()

        cursor.close()
        conn.close()

        return {
            "success": True,
            "access_token": access_token,
            "expires_in": ACCESS_TOKEN_EXPIRY * 60,  # seconds
            "user": {
                "id": member_id,
                "email": email,
                "name": name,
                "role": tenant_role,
                "tenant_id": tenant_id,
                "tenant_name": tenant_name
            }
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Token refresh failed: {str(e)}"}

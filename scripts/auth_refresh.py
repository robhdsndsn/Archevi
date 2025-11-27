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

        # Generate new access token
        now = datetime.utcnow()
        access_payload = {
            "sub": member_id,
            "email": email,
            "name": name,
            "role": role,
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
                "role": role
            }
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Token refresh failed: {str(e)}"}

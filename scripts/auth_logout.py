# auth_logout.py
# Windmill Python script for user logout
# Path: f/chatbot/auth_logout
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - httpx

"""
Logout user by revoking refresh token.

Args:
    refresh_token (str): Refresh token to revoke
    revoke_all (bool): Revoke all sessions for this user

Returns:
    dict: {
        success: bool,
        message: str,
        error: str (if failed)
    }
"""

import psycopg2
from typing import Optional
import wmill


def main(
    refresh_token: str,
    revoke_all: bool = False,
) -> dict:
    """Logout user by revoking refresh token."""

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

        if revoke_all:
            # Find user by refresh token first
            cursor.execute("""
                SELECT member_id FROM user_sessions WHERE refresh_token = %s
            """, (refresh_token,))
            result = cursor.fetchone()

            if result:
                member_id = result[0]
                # Revoke all sessions for this user
                cursor.execute("""
                    UPDATE user_sessions SET revoked = true WHERE member_id = %s
                """, (member_id,))
                message = "All sessions revoked"
            else:
                return {"success": False, "error": "Session not found"}
        else:
            # Revoke only this session
            cursor.execute("""
                UPDATE user_sessions SET revoked = true WHERE refresh_token = %s
            """, (refresh_token,))
            message = "Session revoked"

        conn.commit()
        cursor.close()
        conn.close()

        return {"success": True, "message": message}

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Logout failed: {str(e)}"}

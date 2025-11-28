# auth_request_password_reset.py
# Windmill Python script for requesting a password reset
# Path: f/chatbot/auth_request_password_reset
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Request a password reset token for a user.

Args:
    email (str): User's email address

Returns:
    dict: {
        success: bool,
        reset_token: str (if success - for generating reset link),
        expires_at: str (ISO format),
        message: str,
        error: str (if failed)
    }

Note: In production, you would send this token via email instead of returning it.
For this family app, the admin can generate and share the link manually.
"""

import psycopg2
import secrets
from datetime import datetime, timedelta
import wmill


def main(email: str) -> dict:
    """Request a password reset token."""

    if not email:
        return {"success": False, "error": "Email is required"}

    email = email.strip().lower()

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

        # Find user
        cursor.execute("""
            SELECT id, name, is_active, password_hash
            FROM family_members
            WHERE email = %s
        """, (email,))

        user = cursor.fetchone()

        if not user:
            # Don't reveal if user exists or not (security)
            return {
                "success": True,
                "message": "If an account exists with this email, a reset link will be generated."
            }

        user_id, name, is_active, has_password = user

        if not is_active:
            return {
                "success": True,
                "message": "If an account exists with this email, a reset link will be generated."
            }

        # Generate reset token (32 bytes = 64 hex chars, URL-safe)
        reset_token = secrets.token_urlsafe(32)
        # Token expires in 1 hour (shorter than invite for security)
        expires_at = datetime.utcnow() + timedelta(hours=1)

        # Store reset token (reuse invite_token fields)
        cursor.execute("""
            UPDATE family_members
            SET invite_token = %s,
                invite_expires = %s
            WHERE id = %s
        """, (reset_token, expires_at, user_id))

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "reset_token": reset_token,
            "email": email,
            "name": name,
            "expires_at": expires_at.isoformat(),
            "message": f"Password reset token generated for {name}. Valid for 1 hour."
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to generate reset token: {str(e)}"}

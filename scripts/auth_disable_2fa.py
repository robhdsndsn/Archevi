# auth_disable_2fa.py
# Windmill Python script for disabling 2FA
# Path: f/chatbot/auth_disable_2fa
#
# requirements:
#   - psycopg2-binary
#   - bcrypt
#   - wmill

"""
Disable 2FA for a user (requires password confirmation).

Args:
    user_id (int): User's ID
    password (str): User's current password for confirmation

Returns:
    dict: {
        success: bool,
        message: str,
        error: str (if failed)
    }
"""

import psycopg2
import bcrypt
from datetime import datetime
import wmill


def main(
    user_id: int,
    password: str,
) -> dict:
    """Disable 2FA after password confirmation."""

    if not user_id or not password:
        return {"success": False, "error": "User ID and password are required"}

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

        # Get user and verify password
        cursor.execute("""
            SELECT id, email, password_hash, totp_enabled
            FROM family_members
            WHERE id = %s
        """, (user_id,))

        user = cursor.fetchone()

        if not user:
            return {"success": False, "error": "User not found"}

        _, email, password_hash, totp_enabled = user

        if not totp_enabled:
            return {"success": False, "error": "2FA is not enabled for this account"}

        if not password_hash:
            return {"success": False, "error": "Password not set for this account"}

        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
            return {"success": False, "error": "Invalid password"}

        # Disable 2FA and clear all related data
        cursor.execute("""
            UPDATE family_members
            SET totp_enabled = FALSE,
                totp_secret = NULL,
                totp_enabled_at = NULL,
                backup_codes = '[]'::jsonb
            WHERE id = %s
        """, (user_id,))

        # Delete any pending 2FA sessions for this user
        cursor.execute("""
            DELETE FROM two_factor_sessions
            WHERE user_id = %s
        """, (user_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "message": "Two-factor authentication has been disabled"
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to disable 2FA: {str(e)}"}

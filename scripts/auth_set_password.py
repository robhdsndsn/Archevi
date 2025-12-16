# auth_set_password.py
# Windmill Python script for setting/resetting password
# Path: f/chatbot/auth_set_password
#
# requirements:
#   - psycopg2-binary
#   - bcrypt
#   - wmill
#   - httpx

"""
Set password for a user (via invite token or admin action).

Args:
    email (str): User's email (for initial admin setup)
    password (str): New password
    invite_token (str, optional): Invite token (for invited users)
    admin_override (bool): Allow admin to set password without token

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
from typing import Optional
import wmill


def main(
    email: str,
    password: str,
    invite_token: Optional[str] = None,
    admin_override: bool = False,
) -> dict:
    """Set password for a user."""

    # Validate input
    if not email or not password:
        return {"success": False, "error": "Email and password are required"}

    email = email.strip().lower()

    # Password requirements
    if len(password) < 8:
        return {"success": False, "error": "Password must be at least 8 characters"}

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
            SELECT id, name, role, password_hash, invite_token, invite_expires, is_active
            FROM family_members
            WHERE email = %s
        """, (email,))

        user = cursor.fetchone()

        if not user:
            return {"success": False, "error": "User not found"}

        user_id, name, role, existing_hash, stored_token, token_expires, is_active = user

        if not is_active:
            return {"success": False, "error": "Account is deactivated"}

        # Validate access
        if invite_token:
            # Invited user setting password
            if stored_token != invite_token:
                return {"success": False, "error": "Invalid invite token"}
            if token_expires and token_expires < datetime.now():
                return {"success": False, "error": "Invite token has expired"}
        elif admin_override:
            # Admin setting password - allowed
            pass
        elif not existing_hash:
            # First-time setup for existing user without password
            # Allow if it's the initial admin
            if role != 'admin':
                return {"success": False, "error": "Invite token required"}
        else:
            return {"success": False, "error": "Cannot change password without proper authorization"}

        # Hash new password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Update user
        cursor.execute("""
            UPDATE family_members
            SET password_hash = %s,
                invite_token = NULL,
                invite_expires = NULL,
                email_verified = true,
                failed_attempts = 0,
                locked_until = NULL
            WHERE id = %s
        """, (password_hash, user_id))

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "message": f"Password set successfully for {name}"
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to set password: {str(e)}"}

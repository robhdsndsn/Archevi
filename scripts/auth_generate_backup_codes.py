# auth_generate_backup_codes.py
# Windmill Python script for generating 2FA backup codes
# Path: f/chatbot/auth_generate_backup_codes
#
# requirements:
#   - psycopg2-binary
#   - bcrypt
#   - wmill

"""
Generate new backup codes for 2FA recovery.

This replaces any existing backup codes. User must have 2FA enabled.

Args:
    user_id (int): User's ID
    password (str): User's current password for confirmation

Returns:
    dict: {
        success: bool,
        codes: list[str] (10 backup codes - SHOW ONCE, user must save them),
        message: str,
        error: str (if failed)
    }
"""

import psycopg2
import bcrypt
import secrets
import hashlib
import json
from datetime import datetime
import wmill


# Number of backup codes to generate
NUM_BACKUP_CODES = 10


def generate_backup_code() -> str:
    """Generate a single backup code (8 characters, alphanumeric)."""
    # Use uppercase letters and digits, avoid confusing characters (0/O, 1/I/L)
    alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    return ''.join(secrets.choice(alphabet) for _ in range(8))


def hash_code(code: str) -> str:
    """Hash a backup code using SHA-256."""
    return hashlib.sha256(code.encode('utf-8')).hexdigest()


def main(
    user_id: int,
    password: str,
) -> dict:
    """Generate new backup codes after password confirmation."""

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
            return {"success": False, "error": "2FA must be enabled before generating backup codes"}

        if not password_hash:
            return {"success": False, "error": "Password not set for this account"}

        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
            return {"success": False, "error": "Invalid password"}

        # Generate new backup codes
        plain_codes = [generate_backup_code() for _ in range(NUM_BACKUP_CODES)]

        # Hash the codes for storage
        hashed_codes = [
            {"code_hash": hash_code(code), "used_at": None}
            for code in plain_codes
        ]

        # Store hashed codes in database
        cursor.execute("""
            UPDATE family_members
            SET backup_codes = %s::jsonb
            WHERE id = %s
        """, (json.dumps(hashed_codes), user_id))

        conn.commit()
        cursor.close()
        conn.close()

        # Format codes for display (add dashes for readability: XXXX-XXXX)
        formatted_codes = [f"{code[:4]}-{code[4:]}" for code in plain_codes]

        return {
            "success": True,
            "codes": formatted_codes,
            "message": "New backup codes generated. Save these in a secure location - they won't be shown again!"
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to generate backup codes: {str(e)}"}

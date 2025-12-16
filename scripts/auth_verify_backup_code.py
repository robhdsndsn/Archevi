# auth_verify_backup_code.py
# Windmill Python script for verifying 2FA backup codes
# Path: f/chatbot/auth_verify_backup_code
#
# requirements:
#   - psycopg2-binary
#   - PyJWT
#   - wmill

"""
Verify a backup code during 2FA login (when user doesn't have access to authenticator).

Args:
    session_token (str): Temporary token from login
    backup_code (str): One of the user's backup codes (format: XXXX-XXXX)

Returns:
    dict: {
        success: bool,
        access_token: str,
        refresh_token: str,
        user: dict,
        remaining_codes: int (number of unused backup codes left),
        warning: str (if low on codes),
        error: str (if failed)
    }
"""

import psycopg2
import jwt
import secrets
import hashlib
import json
from datetime import datetime, timedelta
import wmill
from config import get_jwt_secret


# JWT Configuration
JWT_SECRET = get_jwt_secret()
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRY = 15  # minutes
REFRESH_TOKEN_EXPIRY = 7  # days


def hash_code(code: str) -> str:
    """Hash a backup code using SHA-256."""
    # Remove dashes and uppercase for consistent hashing
    clean_code = code.replace("-", "").upper()
    return hashlib.sha256(clean_code.encode('utf-8')).hexdigest()


def main(
    session_token: str,
    backup_code: str,
) -> dict:
    """Verify backup code and complete 2FA login."""

    if not session_token or not backup_code:
        return {"success": False, "error": "Session token and backup code are required"}

    # Clean the backup code
    backup_code = backup_code.strip().upper()

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

        # Find the 2FA session
        cursor.execute("""
            SELECT tfs.id, tfs.user_id, tfs.expires_at, tfs.verified,
                   fm.email, fm.name, fm.role, fm.backup_codes, fm.member_type
            FROM two_factor_sessions tfs
            JOIN family_members fm ON tfs.user_id = fm.id
            WHERE tfs.session_token = %s
        """, (session_token,))

        session = cursor.fetchone()

        if not session:
            return {"success": False, "error": "Invalid or expired session"}

        session_id, user_id, expires_at, verified, email, name, role, backup_codes, member_type = session

        # Check if session is expired
        if expires_at < datetime.now():
            cursor.execute("DELETE FROM two_factor_sessions WHERE id = %s", (session_id,))
            conn.commit()
            return {"success": False, "error": "Session expired. Please login again"}

        if verified:
            return {"success": False, "error": "Session already verified"}

        # Parse backup codes
        if not backup_codes:
            return {"success": False, "error": "No backup codes available for this account"}

        codes_list = backup_codes if isinstance(backup_codes, list) else json.loads(backup_codes)

        # Hash the provided code and check against stored hashes
        provided_hash = hash_code(backup_code)
        code_found = False
        remaining_codes = 0

        for code_entry in codes_list:
            if code_entry.get('used_at') is None:
                if code_entry.get('code_hash') == provided_hash and not code_found:
                    # Mark this code as used
                    code_entry['used_at'] = datetime.now().isoformat()
                    code_found = True
                else:
                    remaining_codes += 1

        if not code_found:
            return {"success": False, "error": "Invalid backup code"}

        # Update backup codes in database
        cursor.execute("""
            UPDATE family_members
            SET backup_codes = %s::jsonb
            WHERE id = %s
        """, (json.dumps(codes_list), user_id))

        # Mark session as verified
        cursor.execute("""
            UPDATE two_factor_sessions
            SET verified = TRUE, verified_at = %s
            WHERE id = %s
        """, (datetime.now(), session_id))

        # Get tenant information
        tenant_id = None
        tenant_name = None
        tenant_role = role

        cursor.execute("""
            SELECT u.id, u.default_tenant_id, t.name, tm.role
            FROM users u
            LEFT JOIN tenants t ON u.default_tenant_id = t.id
            LEFT JOIN tenant_memberships tm ON u.id = tm.user_id AND tm.tenant_id = u.default_tenant_id
            WHERE u.email = %s
        """, (email,))
        tenant_result = cursor.fetchone()

        users_table_id = None
        if tenant_result:
            users_table_id = str(tenant_result[0]) if tenant_result[0] else None
            if tenant_result[1]:
                tenant_id = str(tenant_result[1])
                tenant_name = tenant_result[2]
            if tenant_result[3]:
                tenant_role = tenant_result[3]

        # Generate JWT tokens
        now = datetime.utcnow()

        access_payload = {
            "sub": user_id,
            "email": email,
            "name": name,
            "role": tenant_role,
            "tenant_id": tenant_id,
            "member_type": member_type or "adult",
            "member_id": user_id,
            "type": "access",
            "iat": now,
            "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRY)
        }
        access_token = jwt.encode(access_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

        # Refresh token
        refresh_token = secrets.token_urlsafe(32)
        refresh_expires = datetime.now() + timedelta(days=REFRESH_TOKEN_EXPIRY)

        # Store refresh token
        cursor.execute("""
            INSERT INTO user_sessions (member_id, refresh_token, device_info, expires_at)
            VALUES (%s, %s, %s, %s)
        """, (user_id, refresh_token, "2FA backup code login", refresh_expires))

        # Update last login
        cursor.execute("""
            UPDATE family_members
            SET last_login = %s, last_active = %s
            WHERE id = %s
        """, (datetime.now(), datetime.now(), user_id))

        conn.commit()
        cursor.close()
        conn.close()

        # Build response
        response = {
            "success": True,
            "message": "Backup code verified successfully",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": ACCESS_TOKEN_EXPIRY * 60,
            "user": {
                "id": users_table_id or str(user_id),
                "email": email,
                "name": name,
                "role": tenant_role,
                "tenant_id": tenant_id,
                "tenant_name": tenant_name,
                "member_type": member_type or "adult",
                "member_id": user_id
            },
            "remaining_codes": remaining_codes
        }

        # Add warning if low on backup codes
        if remaining_codes <= 2:
            response["warning"] = f"Only {remaining_codes} backup codes remaining. Consider generating new ones."

        return response

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Verification failed: {str(e)}"}

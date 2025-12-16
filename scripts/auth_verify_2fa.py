# auth_verify_2fa.py
# Windmill Python script for verifying 2FA codes
# Path: f/chatbot/auth_verify_2fa
#
# requirements:
#   - psycopg2-binary
#   - pyotp
#   - bcrypt
#   - PyJWT
#   - wmill

"""
Verify TOTP code during login or 2FA setup.

Two modes:
1. Setup mode (enable_2fa=True): Verifies code and enables 2FA for user
2. Login mode (session_token provided): Completes 2FA login and returns JWT

Args:
    user_id (int): User's ID (for setup mode)
    code (str): 6-digit TOTP code from authenticator
    enable_2fa (bool): If True, enable 2FA after successful verification
    session_token (str): Temporary token from login (for login mode)

Returns:
    dict: {
        success: bool,
        message: str,
        # For login mode:
        access_token: str,
        refresh_token: str,
        user: dict,
        error: str (if failed)
    }
"""

import psycopg2
import pyotp
import jwt
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
import wmill
from config import get_jwt_secret


# JWT Configuration
JWT_SECRET = get_jwt_secret()
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRY = 15  # minutes
REFRESH_TOKEN_EXPIRY = 7  # days


def main(
    code: str,
    user_id: Optional[int] = None,
    enable_2fa: bool = False,
    session_token: Optional[str] = None,
) -> dict:
    """Verify TOTP code for 2FA setup or login."""

    if not code:
        return {"success": False, "error": "Verification code is required"}

    # Clean the code (remove spaces, ensure 6 digits)
    code = code.strip().replace(" ", "")
    if not code.isdigit() or len(code) != 6:
        return {"success": False, "error": "Code must be 6 digits"}

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

        # Determine mode: login (session_token) or setup (user_id + enable_2fa)
        if session_token:
            return _verify_login(cursor, conn, code, session_token)
        elif user_id:
            return _verify_setup(cursor, conn, code, user_id, enable_2fa)
        else:
            return {"success": False, "error": "Either user_id or session_token is required"}

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Verification failed: {str(e)}"}


def _verify_setup(cursor, conn, code: str, user_id: int, enable_2fa: bool) -> dict:
    """Verify code during 2FA setup."""

    # Get user's TOTP secret
    cursor.execute("""
        SELECT totp_secret, totp_enabled
        FROM family_members
        WHERE id = %s
    """, (user_id,))

    user = cursor.fetchone()

    if not user:
        return {"success": False, "error": "User not found"}

    secret, is_enabled = user

    if not secret:
        return {"success": False, "error": "2FA setup not started. Call auth_setup_2fa first"}

    if is_enabled and not enable_2fa:
        return {"success": False, "error": "2FA is already enabled"}

    # Verify the code
    totp = pyotp.TOTP(secret)
    if not totp.verify(code, valid_window=1):  # Allow 1 period tolerance (30 sec)
        return {"success": False, "error": "Invalid code. Please try again"}

    # If enabling 2FA, update the database
    if enable_2fa:
        cursor.execute("""
            UPDATE family_members
            SET totp_enabled = TRUE, totp_enabled_at = %s
            WHERE id = %s
        """, (datetime.now(), user_id))
        conn.commit()

        cursor.close()
        conn.close()

        return {
            "success": True,
            "message": "2FA has been enabled successfully",
            "totp_enabled": True
        }
    else:
        cursor.close()
        conn.close()

        return {
            "success": True,
            "message": "Code verified successfully",
            "totp_enabled": False
        }


def _verify_login(cursor, conn, code: str, session_token: str) -> dict:
    """Verify code during login (complete 2FA challenge)."""

    # Find the 2FA session
    cursor.execute("""
        SELECT tfs.id, tfs.user_id, tfs.expires_at, tfs.verified,
               fm.email, fm.name, fm.role, fm.totp_secret, fm.member_type
        FROM two_factor_sessions tfs
        JOIN family_members fm ON tfs.user_id = fm.id
        WHERE tfs.session_token = %s
    """, (session_token,))

    session = cursor.fetchone()

    if not session:
        return {"success": False, "error": "Invalid or expired session"}

    session_id, user_id, expires_at, verified, email, name, role, secret, member_type = session

    # Check if session is expired
    if expires_at < datetime.now():
        # Clean up expired session
        cursor.execute("DELETE FROM two_factor_sessions WHERE id = %s", (session_id,))
        conn.commit()
        return {"success": False, "error": "Session expired. Please login again"}

    # Check if already verified
    if verified:
        return {"success": False, "error": "Session already verified"}

    # Verify the TOTP code
    totp = pyotp.TOTP(secret)
    if not totp.verify(code, valid_window=1):
        return {"success": False, "error": "Invalid code. Please try again"}

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
    """, (user_id, refresh_token, "2FA login", refresh_expires))

    # Update last login
    cursor.execute("""
        UPDATE family_members
        SET last_login = %s, last_active = %s
        WHERE id = %s
    """, (datetime.now(), datetime.now(), user_id))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "success": True,
        "message": "2FA verification successful",
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
        }
    }

# auth_login.py
# Windmill Python script for user authentication
# Path: f/chatbot/auth_login
#
# requirements:
#   - psycopg2-binary
#   - bcrypt
#   - PyJWT
#   - wmill
#   - httpx

"""
Authenticate user with email and password, return JWT tokens.

Args:
    email (str): User's email address
    password (str): User's password

Returns:
    dict: {
        success: bool,
        access_token: str (15 min expiry),
        refresh_token: str (7 day expiry),
        user: { id, email, name, role },
        error: str (if failed)
    }
"""

import psycopg2
import bcrypt
import jwt
import secrets
from datetime import datetime, timedelta
from typing import Optional
import wmill
from config import get_jwt_secret


# JWT Configuration
JWT_SECRET = get_jwt_secret()
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRY = 15  # minutes
REFRESH_TOKEN_EXPIRY = 7  # days
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION = 15  # minutes


def main(
    email: str,
    password: str,
    device_info: Optional[str] = None,
) -> dict:
    """Authenticate user and return JWT tokens."""

    # Validate input
    if not email or not password:
        return {"success": False, "error": "Email and password are required"}

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

        # Find user by email (including 2FA status)
        cursor.execute("""
            SELECT id, email, name, role, password_hash, is_active,
                   failed_attempts, locked_until, email_verified, member_type,
                   totp_enabled, totp_secret
            FROM family_members
            WHERE email = %s
        """, (email,))

        user = cursor.fetchone()

        if not user:
            return {"success": False, "error": "Invalid email or password"}

        user_id, user_email, name, role, password_hash, is_active, \
            failed_attempts, locked_until, email_verified, member_type, \
            totp_enabled, totp_secret = user

        # Check if account is active
        if not is_active:
            return {"success": False, "error": "Account is deactivated"}

        # Check if account is locked
        if locked_until and locked_until > datetime.now():
            minutes_left = int((locked_until - datetime.now()).total_seconds() / 60) + 1
            return {
                "success": False,
                "error": f"Account locked. Try again in {minutes_left} minutes"
            }

        # Check if password is set
        if not password_hash:
            return {
                "success": False,
                "error": "Password not set. Please use your invite link or contact admin"
            }

        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
            # Increment failed attempts
            new_attempts = (failed_attempts or 0) + 1

            if new_attempts >= MAX_FAILED_ATTEMPTS:
                # Lock account
                lock_until = datetime.now() + timedelta(minutes=LOCKOUT_DURATION)
                cursor.execute("""
                    UPDATE family_members
                    SET failed_attempts = %s, locked_until = %s
                    WHERE id = %s
                """, (new_attempts, lock_until, user_id))
                conn.commit()
                return {
                    "success": False,
                    "error": f"Too many failed attempts. Account locked for {LOCKOUT_DURATION} minutes"
                }
            else:
                cursor.execute("""
                    UPDATE family_members
                    SET failed_attempts = %s
                    WHERE id = %s
                """, (new_attempts, user_id))
                conn.commit()

            return {"success": False, "error": "Invalid email or password"}

        # Password correct - reset failed attempts
        cursor.execute("""
            UPDATE family_members
            SET failed_attempts = 0, locked_until = NULL
            WHERE id = %s
        """, (user_id,))

        # Check if 2FA is enabled - if so, create 2FA session instead of issuing tokens
        if totp_enabled:
            session_token = secrets.token_urlsafe(32)
            session_expires = datetime.now() + timedelta(minutes=5)  # 5 min to complete 2FA

            cursor.execute("""
                INSERT INTO two_factor_sessions (user_id, session_token, expires_at)
                VALUES (%s, %s, %s)
            """, (user_id, session_token, session_expires))

            conn.commit()
            cursor.close()
            conn.close()

            return {
                "success": True,
                "requires_2fa": True,
                "session_token": session_token,
                "expires_in": 300,  # 5 minutes in seconds
                "user": {
                    "email": user_email,
                    "name": name
                }
            }

        # No 2FA - proceed with normal login, update last login
        cursor.execute("""
            UPDATE family_members
            SET last_login = %s, last_active = %s
            WHERE id = %s
        """, (datetime.now(), datetime.now(), user_id))

        # Get user's UUID and tenant information from users table
        # The users table is the authoritative source for multi-tenant system
        tenant_id = None
        tenant_name = None
        tenant_role = role  # Default to family_members role
        users_table_id = None  # UUID from users table

        # Try to get user info from users table (multi-tenant system)
        cursor.execute("""
            SELECT u.id, u.default_tenant_id, t.name, tm.role
            FROM users u
            LEFT JOIN tenants t ON u.default_tenant_id = t.id
            LEFT JOIN tenant_memberships tm ON u.id = tm.user_id AND tm.tenant_id = u.default_tenant_id
            WHERE u.email = %s
        """, (user_email,))
        tenant_result = cursor.fetchone()

        if tenant_result:
            users_table_id = str(tenant_result[0]) if tenant_result[0] else None
            if tenant_result[1]:
                tenant_id = str(tenant_result[1])
                tenant_name = tenant_result[2]
            if tenant_result[3]:
                tenant_role = tenant_result[3]

        if not tenant_id:
            # Fall back: get first active tenant membership
            cursor.execute("""
                SELECT tm.tenant_id, t.name, tm.role
                FROM tenant_memberships tm
                JOIN tenants t ON tm.tenant_id = t.id
                JOIN users u ON tm.user_id = u.id
                WHERE u.email = %s AND tm.status = 'active' AND t.status = 'active'
                ORDER BY tm.created_at ASC NULLS LAST
                LIMIT 1
            """, (user_email,))
            fallback_result = cursor.fetchone()
            if fallback_result:
                tenant_id = str(fallback_result[0])
                tenant_name = fallback_result[1]
                tenant_role = fallback_result[2]

        # Generate tokens
        now = datetime.utcnow()

        # Access token (short-lived) - include tenant_id for multi-tenant support
        access_payload = {
            "sub": user_id,
            "email": user_email,
            "name": name,
            "role": tenant_role,
            "tenant_id": tenant_id,
            "member_type": member_type or "adult",  # For visibility filtering
            "member_id": user_id,  # family_members.id for private doc access
            "type": "access",
            "iat": now,
            "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRY)
        }
        access_token = jwt.encode(access_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

        # Refresh token (long-lived)
        refresh_token = secrets.token_urlsafe(32)
        refresh_expires = datetime.now() + timedelta(days=REFRESH_TOKEN_EXPIRY)

        # Store refresh token in database
        cursor.execute("""
            INSERT INTO user_sessions (member_id, refresh_token, device_info, expires_at)
            VALUES (%s, %s, %s, %s)
        """, (user_id, refresh_token, device_info, refresh_expires))

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_in": ACCESS_TOKEN_EXPIRY * 60,  # seconds
            "user": {
                "id": users_table_id or str(user_id),  # Prefer UUID from users table, fall back to family_members id
                "email": user_email,
                "name": name,
                "role": tenant_role,
                "tenant_id": tenant_id,
                "tenant_name": tenant_name,
                "member_type": member_type or "adult",  # Default to adult if not set
                "member_id": user_id  # family_members.id for visibility filtering
            }
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Authentication failed: {str(e)}"}

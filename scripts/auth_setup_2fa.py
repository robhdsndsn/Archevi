# auth_setup_2fa.py
# Windmill Python script for setting up 2FA
# Path: f/chatbot/auth_setup_2fa
#
# requirements:
#   - psycopg2-binary
#   - pyotp
#   - qrcode
#   - Pillow
#   - wmill

"""
Generate TOTP secret and QR code for 2FA setup.

Args:
    user_id (int): User's ID from family_members table
    user_email (str): User's email for QR code label

Returns:
    dict: {
        success: bool,
        secret: str (base32 TOTP secret - show to user for manual entry),
        qr_code_base64: str (PNG image as base64 for scanning),
        provisioning_uri: str (otpauth:// URI),
        error: str (if failed)
    }
"""

import psycopg2
import pyotp
import qrcode
import io
import base64
from typing import Optional
import wmill


# App name shown in authenticator
APP_NAME = "Archevi"


def main(
    user_id: int,
    user_email: str,
) -> dict:
    """Generate TOTP secret and QR code for 2FA setup."""

    if not user_id or not user_email:
        return {"success": False, "error": "User ID and email are required"}

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

        # Check if user exists and doesn't already have 2FA enabled
        cursor.execute("""
            SELECT id, email, totp_enabled
            FROM family_members
            WHERE id = %s
        """, (user_id,))

        user = cursor.fetchone()

        if not user:
            return {"success": False, "error": "User not found"}

        if user[2]:  # totp_enabled
            return {"success": False, "error": "2FA is already enabled for this account"}

        # Generate a new TOTP secret (32 characters, base32)
        secret = pyotp.random_base32()

        # Create TOTP object
        totp = pyotp.TOTP(secret)

        # Generate provisioning URI for QR code
        provisioning_uri = totp.provisioning_uri(
            name=user_email,
            issuer_name=APP_NAME
        )

        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)

        # Create image
        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        # Store the secret temporarily (not enabled yet)
        # User must verify with a code before 2FA is activated
        cursor.execute("""
            UPDATE family_members
            SET totp_secret = %s, totp_enabled = FALSE
            WHERE id = %s
        """, (secret, user_id))

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "secret": secret,  # For manual entry in authenticator
            "qr_code_base64": qr_code_base64,
            "provisioning_uri": provisioning_uri,
            "message": "Scan the QR code with your authenticator app, then verify with a code"
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Setup failed: {str(e)}"}

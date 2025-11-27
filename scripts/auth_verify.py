# auth_verify.py
# Windmill Python script for JWT token verification
# Path: f/chatbot/auth_verify
#
# requirements:
#   - PyJWT
#   - wmill

"""
Verify JWT access token and return user info.

Args:
    token (str): JWT access token

Returns:
    dict: {
        valid: bool,
        user: { id, email, name, role } (if valid),
        error: str (if invalid)
    }
"""

import jwt
from datetime import datetime


# Must match auth_login.py
JWT_SECRET = "archevi-jwt-secret-2026-change-in-production"
JWT_ALGORITHM = "HS256"


def main(token: str) -> dict:
    """Verify JWT access token."""

    if not token:
        return {"valid": False, "error": "No token provided"}

    # Remove "Bearer " prefix if present
    if token.startswith("Bearer "):
        token = token[7:]

    try:
        # Decode and verify token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])

        # Check token type
        if payload.get("type") != "access":
            return {"valid": False, "error": "Invalid token type"}

        return {
            "valid": True,
            "user": {
                "id": payload.get("sub"),
                "email": payload.get("email"),
                "name": payload.get("name"),
                "role": payload.get("role")
            }
        }

    except jwt.ExpiredSignatureError:
        return {"valid": False, "error": "Token expired"}
    except jwt.InvalidTokenError as e:
        return {"valid": False, "error": f"Invalid token: {str(e)}"}
    except Exception as e:
        return {"valid": False, "error": f"Verification failed: {str(e)}"}

"""
Central configuration for FamilySecondBrain scripts.
Loads sensitive values from environment variables.

Usage:
    from config import WINDMILL_TOKEN, WINDMILL_URL, JWT_SECRET
"""
import os
from pathlib import Path

# Load .env file if python-dotenv is available
try:
    from dotenv import load_dotenv
    # Look for .env in scripts folder or parent folder
    env_paths = [
        Path(__file__).parent / '.env',
        Path(__file__).parent.parent / '.env',
        Path(__file__).parent.parent / 'Infrastructure' / '.env',
    ]
    for env_path in env_paths:
        if env_path.exists():
            load_dotenv(env_path)
            break
except ImportError:
    pass  # dotenv not installed, rely on system env vars

# Windmill Configuration
WINDMILL_URL = os.getenv('WINDMILL_URL', 'http://localhost')
WINDMILL_TOKEN = os.getenv('WINDMILL_TOKEN', '')
WINDMILL_WORKSPACE = os.getenv('WINDMILL_WORKSPACE', 'family-brain')

# JWT Configuration (for auth scripts deployed to Windmill)
JWT_SECRET = os.getenv('JWT_SECRET', '')

# Tenant Configuration
DEFAULT_TENANT_ID = os.getenv('DEFAULT_TENANT_ID', '')

# Derived values
WINDMILL_BASE_URL = f"{WINDMILL_URL}/api/w/{WINDMILL_WORKSPACE}"


def require_env(name: str) -> str:
    """Get required environment variable or raise error."""
    value = os.getenv(name)
    if not value:
        raise EnvironmentError(
            f"Required environment variable '{name}' is not set.\n"
            f"Please set it in your .env file or environment."
        )
    return value


def get_windmill_token() -> str:
    """Get Windmill token, raising error if not set."""
    # Read dynamically to support late-binding of env vars
    token = os.getenv('WINDMILL_TOKEN', '') or WINDMILL_TOKEN
    if not token:
        raise EnvironmentError(
            "WINDMILL_TOKEN is not set.\n"
            "Please set it in your .env file or environment.\n"
            "You can get a token from Windmill UI > Settings > Tokens"
        )
    return token


def get_jwt_secret() -> str:
    """Get JWT secret, raising error if not set."""
    # Read dynamically to support late-binding of env vars
    secret = os.getenv('JWT_SECRET', '') or JWT_SECRET
    if not secret:
        raise EnvironmentError(
            "JWT_SECRET is not set.\n"
            "Please set it in your .env file or environment."
        )
    return secret

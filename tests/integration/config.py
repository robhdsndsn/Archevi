"""
Configuration for integration tests.
Re-exports from the scripts config module.
"""
import sys
from pathlib import Path

# Add scripts directory to path so we can import the config module
scripts_dir = Path(__file__).parent.parent.parent / 'scripts'
sys.path.insert(0, str(scripts_dir))

# Re-export everything from the main config
from config import (
    WINDMILL_URL,
    WINDMILL_TOKEN,
    WINDMILL_WORKSPACE,
    WINDMILL_BASE_URL,
    JWT_SECRET,
    DEFAULT_TENANT_ID,
    require_env,
    get_windmill_token,
    get_jwt_secret,
)

__all__ = [
    'WINDMILL_URL',
    'WINDMILL_TOKEN',
    'WINDMILL_WORKSPACE',
    'WINDMILL_BASE_URL',
    'JWT_SECRET',
    'DEFAULT_TENANT_ID',
    'require_env',
    'get_windmill_token',
    'get_jwt_secret',
]

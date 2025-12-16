# create_secure_link.py
# Windmill Python script for generating secure document sharing links
# Path: f/chatbot/create_secure_link
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - bcrypt

"""
Create a secure, expiring link for sharing a document externally.

Args:
    document_id (int): ID of the document to share
    tenant_id (str): UUID of the tenant
    user_id (str): UUID of the user creating the link
    expires_in (str): Expiration period - '1h', '1d', '7d', '30d', or ISO datetime
    password (str, optional): Password to protect the link
    max_views (int, optional): Maximum number of views allowed
    label (str, optional): Friendly label like "For accountant"

Returns:
    dict: {
        success: bool,
        link_id: str,
        token: str,
        url: str,
        expires_at: str,
        requires_password: bool,
        max_views: int | null,
        error: str (if failed)
    }
"""

import psycopg2
import psycopg2.extras
import wmill
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional

# Try to import bcrypt, fall back to no password support if not available
try:
    import bcrypt
    BCRYPT_AVAILABLE = True
except ImportError:
    BCRYPT_AVAILABLE = False


def generate_token(length: int = 32) -> str:
    """Generate a URL-safe random token."""
    # Exclude confusing characters (0, O, l, 1, I)
    alphabet = string.ascii_letters + string.digits
    alphabet = alphabet.replace('0', '').replace('O', '').replace('l', '').replace('1', '').replace('I', '')
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def parse_expiration(expires_in: str) -> datetime:
    """Parse expiration string to datetime."""
    now = datetime.utcnow()

    if expires_in == '1h':
        return now + timedelta(hours=1)
    elif expires_in == '1d':
        return now + timedelta(days=1)
    elif expires_in == '7d':
        return now + timedelta(days=7)
    elif expires_in == '30d':
        return now + timedelta(days=30)
    elif expires_in == '90d':
        return now + timedelta(days=90)
    else:
        # Try to parse as ISO datetime
        try:
            return datetime.fromisoformat(expires_in.replace('Z', '+00:00'))
        except ValueError:
            # Default to 7 days
            return now + timedelta(days=7)


def hash_password(password: str) -> Optional[str]:
    """Hash password using bcrypt."""
    if not BCRYPT_AVAILABLE or not password:
        return None
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def main(
    document_id: int,
    tenant_id: str,
    user_id: str,
    expires_in: str = '7d',
    password: str = None,
    max_views: int = None,
    label: str = None
) -> dict:
    """Create a secure sharing link for a document."""

    # Validate inputs
    if not document_id or not tenant_id or not user_id:
        return {"success": False, "error": "document_id, tenant_id, and user_id are required"}

    # Generate token and parse expiration
    token = generate_token(32)
    expires_at = parse_expiration(expires_in)

    # Hash password if provided
    password_hash = hash_password(password) if password else None

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
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Verify document exists and belongs to tenant
        cursor.execute("""
            SELECT id, title FROM family_documents
            WHERE id = %s AND tenant_id = %s
        """, (document_id, tenant_id))

        doc = cursor.fetchone()
        if not doc:
            return {"success": False, "error": "Document not found or access denied"}

        # Create the secure link
        cursor.execute("""
            INSERT INTO secure_links (
                document_id, tenant_id, created_by, token,
                expires_at, password_hash, max_views, label
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            document_id, tenant_id, user_id, token,
            expires_at, password_hash, max_views, label
        ))

        result = cursor.fetchone()
        conn.commit()

        # Build the share URL (frontend will construct full URL)
        share_url = f"/share/{token}"

        cursor.close()
        conn.close()

        return {
            "success": True,
            "link_id": str(result['id']),
            "token": token,
            "url": share_url,
            "document_title": doc['title'],
            "expires_at": expires_at.isoformat(),
            "requires_password": password_hash is not None,
            "max_views": max_views,
            "label": label
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to create secure link: {str(e)}"}

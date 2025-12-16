# access_secure_link.py
# Windmill Python script for validating and accessing secure document links
# Path: f/chatbot/access_secure_link
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - bcrypt

"""
Validate a secure link and return the document if valid.

This endpoint is used by the public /share/:token route.
No authentication required - the token IS the authentication.

Args:
    token (str): The secure link token from the URL
    password (str, optional): Password if the link is protected
    ip_address (str, optional): Client IP for audit logging
    user_agent (str, optional): Client user agent for audit logging

Returns:
    dict: {
        success: bool,
        requires_password: bool (if password needed but not provided),
        document: {
            id: int,
            title: str,
            content: str,
            category: str,
            source_file: str,
            created_at: str
        } (if valid),
        views_remaining: int | null,
        expires_at: str,
        error: str (if failed)
    }
"""

import psycopg2
import psycopg2.extras
import wmill
from datetime import datetime, timezone
from typing import Optional

# Try to import bcrypt for password verification
try:
    import bcrypt
    BCRYPT_AVAILABLE = True
except ImportError:
    BCRYPT_AVAILABLE = False


def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against bcrypt hash."""
    if not BCRYPT_AVAILABLE:
        return False
    try:
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    except Exception:
        return False


def main(
    token: str,
    password: str = None,
    ip_address: str = None,
    user_agent: str = None
) -> dict:
    """Access a document via secure link."""

    if not token:
        return {"success": False, "error": "Token is required"}

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

        # Get the secure link
        cursor.execute("""
            SELECT
                sl.id,
                sl.document_id,
                sl.expires_at,
                sl.password_hash,
                sl.max_views,
                sl.view_count,
                sl.is_revoked,
                sl.label
            FROM secure_links sl
            WHERE sl.token = %s
        """, (token,))

        link = cursor.fetchone()

        if not link:
            log_access(cursor, None, ip_address, user_agent, False, 'not_found')
            conn.commit()
            cursor.close()
            conn.close()
            return {"success": False, "error": "Link not found"}

        link_id = link['id']

        # Check if revoked
        if link['is_revoked']:
            log_access(cursor, link_id, ip_address, user_agent, False, 'revoked')
            conn.commit()
            cursor.close()
            conn.close()
            return {"success": False, "error": "This link has been revoked"}

        # Check if expired (use timezone-aware comparison)
        if link['expires_at'] < datetime.now(timezone.utc):
            log_access(cursor, link_id, ip_address, user_agent, False, 'expired')
            conn.commit()
            cursor.close()
            conn.close()
            return {"success": False, "error": "This link has expired"}

        # Check max views
        if link['max_views'] is not None and link['view_count'] >= link['max_views']:
            log_access(cursor, link_id, ip_address, user_agent, False, 'max_views')
            conn.commit()
            cursor.close()
            conn.close()
            return {"success": False, "error": "This link has reached its maximum views"}

        # Check password if required
        if link['password_hash']:
            if not password:
                # Don't log as failure - just needs password
                cursor.close()
                conn.close()
                return {
                    "success": False,
                    "requires_password": True,
                    "error": "Password required"
                }

            if not verify_password(password, link['password_hash']):
                log_access(cursor, link_id, ip_address, user_agent, False, 'wrong_password')
                conn.commit()
                cursor.close()
                conn.close()
                return {"success": False, "error": "Incorrect password"}

        # All checks passed - get the document
        cursor.execute("""
            SELECT
                id,
                title,
                content,
                category,
                source_file,
                created_at,
                metadata
            FROM family_documents
            WHERE id = %s
        """, (link['document_id'],))

        doc = cursor.fetchone()

        if not doc:
            log_access(cursor, link_id, ip_address, user_agent, False, 'document_deleted')
            conn.commit()
            cursor.close()
            conn.close()
            return {"success": False, "error": "Document no longer exists"}

        # Log successful access and increment view count
        log_access(cursor, link_id, ip_address, user_agent, True, None)

        cursor.execute("""
            UPDATE secure_links
            SET view_count = view_count + 1
            WHERE id = %s
        """, (link_id,))

        conn.commit()

        # Calculate views remaining
        views_remaining = None
        if link['max_views'] is not None:
            views_remaining = link['max_views'] - link['view_count'] - 1

        cursor.close()
        conn.close()

        # Extract expiry_date from metadata if present
        expiry_date = None
        if doc['metadata'] and isinstance(doc['metadata'], dict):
            expiry_dates = doc['metadata'].get('expiry_dates', [])
            if expiry_dates:
                expiry_date = expiry_dates[0] if isinstance(expiry_dates, list) else expiry_dates

        return {
            "success": True,
            "document": {
                "id": doc['id'],
                "title": doc['title'],
                "content": doc['content'],
                "category": doc['category'],
                "source_file": doc['source_file'],
                "created_at": doc['created_at'].isoformat() if doc['created_at'] else None,
                "expiry_date": expiry_date,
                "metadata": doc['metadata']
            },
            "link_label": link['label'],
            "views_remaining": views_remaining,
            "expires_at": link['expires_at'].isoformat()
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to access document: {str(e)}"}


def log_access(cursor, link_id, ip_address, user_agent, success, failure_reason):
    """Log an access attempt to the audit table."""
    if link_id is None:
        return

    try:
        cursor.execute("""
            INSERT INTO secure_link_access (link_id, ip_address, user_agent, success, failure_reason)
            VALUES (%s, %s::inet, %s, %s, %s)
        """, (link_id, ip_address, user_agent, success, failure_reason))
    except Exception:
        # Don't fail the main operation if logging fails
        pass

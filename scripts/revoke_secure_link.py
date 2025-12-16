# revoke_secure_link.py
# Windmill Python script for revoking secure document links
# Path: f/chatbot/revoke_secure_link
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Revoke a secure link so it can no longer be used.

Args:
    link_id (str): UUID of the secure link to revoke
    tenant_id (str): UUID of the tenant (for authorization)
    user_id (str): UUID of the user revoking the link

Returns:
    dict: {
        success: bool,
        message: str,
        error: str (if failed)
    }
"""

import psycopg2
import psycopg2.extras
import wmill
from datetime import datetime


def main(
    link_id: str,
    tenant_id: str,
    user_id: str
) -> dict:
    """Revoke a secure sharing link."""

    if not link_id or not tenant_id or not user_id:
        return {"success": False, "error": "link_id, tenant_id, and user_id are required"}

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

        # Verify the link exists and belongs to the tenant
        cursor.execute("""
            SELECT id, is_revoked, document_id
            FROM secure_links
            WHERE id = %s AND tenant_id = %s
        """, (link_id, tenant_id))

        link = cursor.fetchone()

        if not link:
            return {"success": False, "error": "Link not found or access denied"}

        if link['is_revoked']:
            return {"success": False, "error": "Link is already revoked"}

        # Revoke the link
        cursor.execute("""
            UPDATE secure_links
            SET is_revoked = TRUE,
                revoked_at = NOW(),
                revoked_by = %s
            WHERE id = %s
        """, (user_id, link_id))

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "message": "Link has been revoked and can no longer be used"
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to revoke link: {str(e)}"}

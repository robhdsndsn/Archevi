# list_secure_links.py
# Windmill Python script for listing secure document links
# Path: f/chatbot/list_secure_links
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
List all secure links for a tenant or specific document.

Args:
    tenant_id (str): UUID of the tenant
    document_id (int, optional): Filter by specific document
    include_revoked (bool): Include revoked links (default: False)
    include_expired (bool): Include expired links (default: False)

Returns:
    dict: {
        success: bool,
        links: [
            {
                id: str,
                document_id: int,
                document_title: str,
                token: str,
                url: str,
                label: str,
                expires_at: str,
                is_expired: bool,
                is_revoked: bool,
                requires_password: bool,
                max_views: int | null,
                view_count: int,
                created_by_name: str,
                created_at: str,
                last_accessed: str | null
            }
        ],
        count: int,
        error: str (if failed)
    }
"""

import psycopg2
import psycopg2.extras
import wmill
from datetime import datetime, timezone


def main(
    tenant_id: str,
    document_id: int = None,
    include_revoked: bool = False,
    include_expired: bool = False
) -> dict:
    """List secure links for a tenant."""

    if not tenant_id:
        return {"success": False, "error": "tenant_id is required"}

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

        # Build query with filters
        query = """
            SELECT
                sl.id,
                sl.document_id,
                fd.title as document_title,
                sl.token,
                sl.label,
                sl.expires_at,
                sl.is_revoked,
                sl.password_hash IS NOT NULL as requires_password,
                sl.max_views,
                sl.view_count,
                sl.created_at,
                u.name as created_by_name,
                (SELECT MAX(accessed_at) FROM secure_link_access WHERE link_id = sl.id AND success = TRUE) as last_accessed
            FROM secure_links sl
            JOIN family_documents fd ON sl.document_id = fd.id
            LEFT JOIN users u ON sl.created_by = u.id
            WHERE sl.tenant_id = %s
        """
        params = [tenant_id]

        if document_id:
            query += " AND sl.document_id = %s"
            params.append(document_id)

        if not include_revoked:
            query += " AND sl.is_revoked = FALSE"

        if not include_expired:
            query += " AND sl.expires_at > NOW()"

        query += " ORDER BY sl.created_at DESC"

        cursor.execute(query, params)
        rows = cursor.fetchall()

        now = datetime.now(timezone.utc)
        links = []

        for row in rows:
            links.append({
                "id": str(row['id']),
                "document_id": row['document_id'],
                "document_title": row['document_title'],
                "token": row['token'],
                "url": f"/share/{row['token']}",
                "label": row['label'],
                "expires_at": row['expires_at'].isoformat() if row['expires_at'] else None,
                "is_expired": row['expires_at'] < now if row['expires_at'] else False,
                "is_revoked": row['is_revoked'],
                "requires_password": row['requires_password'],
                "max_views": row['max_views'],
                "view_count": row['view_count'],
                "created_by_name": row['created_by_name'],
                "created_at": row['created_at'].isoformat() if row['created_at'] else None,
                "last_accessed": row['last_accessed'].isoformat() if row['last_accessed'] else None
            })

        cursor.close()
        conn.close()

        return {
            "success": True,
            "links": links,
            "count": len(links)
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to list links: {str(e)}"}

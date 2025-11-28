# get_document.py
# Windmill Python script for fetching a single document
# Path: f/chatbot/get_document
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Get a single document from the Family Second Brain knowledge base.

Args:
    document_id (int): ID of the document to fetch

Returns:
    dict: {
        success: bool,
        document: {
            id: int,
            title: str,
            content: str,
            category: str,
            source_file: str | null,
            created_by: str | null,
            created_at: str (ISO format),
            updated_at: str (ISO format)
        } | null,
        error: str (if failed)
    }
"""

import psycopg2
import wmill


def main(document_id: int) -> dict:
    """
    Get a single document from the knowledge base.
    """
    if not document_id:
        return {"success": False, "error": "Document ID is required", "document": None}

    # Fetch database resource
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

        cursor.execute("""
            SELECT id, title, content, category, source_file, created_by, created_at, updated_at
            FROM family_documents
            WHERE id = %s
        """, (document_id,))

        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            return {"success": False, "error": "Document not found", "document": None}

        document = {
            "id": row[0],
            "title": row[1],
            "content": row[2],
            "category": row[3],
            "source_file": row[4],
            "created_by": row[5],
            "created_at": row[6].isoformat() if row[6] else None,
            "updated_at": row[7].isoformat() if row[7] else None,
        }

        return {
            "success": True,
            "document": document
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}", "document": None}
    except Exception as e:
        return {"success": False, "error": f"Failed to fetch document: {str(e)}", "document": None}

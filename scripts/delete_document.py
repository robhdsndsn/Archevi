# delete_document.py
# Windmill Python script for deleting documents
# Path: f/chatbot/delete_document
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Delete a document from the Family Second Brain knowledge base.

Args:
    document_id (int): ID of the document to delete

Returns:
    dict: {
        success: bool,
        message: str,
        deleted_title: str (if success)
    }
"""

import psycopg2
import wmill


def main(document_id: int) -> dict:
    """
    Delete a document from the knowledge base.
    """
    if not document_id:
        return {"success": False, "error": "Document ID is required"}

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

        # Get document title before deleting (for confirmation message)
        cursor.execute("""
            SELECT title FROM family_documents WHERE id = %s
        """, (document_id,))

        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return {"success": False, "error": "Document not found"}

        title = row[0]

        # Delete the document (cascades to document_metadata via FK)
        cursor.execute("""
            DELETE FROM family_documents WHERE id = %s
        """, (document_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "message": f"Document '{title}' has been deleted",
            "deleted_title": title,
            "deleted_id": document_id
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to delete document: {str(e)}"}

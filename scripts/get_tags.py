# get_tags.py
# Windmill Python script for retrieving all document tags
# Path: f/chatbot/get_tags
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - httpx

"""
Get all unique tags used across documents.

Returns:
    dict: {
        success: bool,
        tags: list[{tag: str, document_count: int}],
        total_tags: int
    }
"""

import psycopg2
import wmill


def main() -> dict:
    """Get all tags with document counts."""
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

        # Get tags from family_documents metadata
        cursor.execute("""
            SELECT
                tag,
                COUNT(*) as document_count
            FROM (
                SELECT jsonb_array_elements_text(metadata->'tags') as tag
                FROM family_documents
                WHERE metadata->'tags' IS NOT NULL
                  AND jsonb_array_length(metadata->'tags') > 0
            ) t
            GROUP BY tag
            ORDER BY document_count DESC, tag
        """)

        rows = cursor.fetchall()
        tags = [{"tag": row[0], "document_count": row[1]} for row in rows]

        cursor.close()
        conn.close()

        return {
            "success": True,
            "tags": tags,
            "total_tags": len(tags)
        }

    except psycopg2.Error as e:
        return {
            "success": False,
            "tags": [],
            "total_tags": 0,
            "error": str(e)
        }

# update_document.py
# Windmill Python script for updating documents
# Path: f/chatbot/update_document
#
# requirements:
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - wmill

"""
Update a document in the Family Second Brain knowledge base.

If content is changed, the embedding will be regenerated.

Args:
    document_id (int): ID of the document to update
    title (str, optional): New title
    content (str, optional): New content (triggers re-embedding)
    category (str, optional): New category

Returns:
    dict: {
        success: bool,
        message: str,
        document_id: int,
        re_embedded: bool (true if content was changed)
    }
"""

import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
from typing import Optional
import wmill


def main(
    document_id: int,
    title: Optional[str] = None,
    content: Optional[str] = None,
    category: Optional[str] = None,
    assigned_to: Optional[int] = None,
    clear_assigned_to: bool = False,
    visibility: Optional[str] = None,
) -> dict:
    """
    Update a document in the knowledge base.

    Args:
        assigned_to: Family member ID to assign document to
        clear_assigned_to: Set to True to unassign the document (set assigned_to to NULL)
        visibility: Document visibility level (everyone, adults_only, admins_only, private)
    """
    if not document_id:
        return {"success": False, "error": "Document ID is required"}

    if not title and not content and not category and assigned_to is None and not clear_assigned_to and not visibility:
        return {"success": False, "error": "At least one field to update is required"}

    valid_categories = ['recipes', 'medical', 'financial', 'family_history', 'general', 'insurance', 'invoices']
    if category and category not in valid_categories:
        return {"success": False, "error": f"Category must be one of: {valid_categories}"}

    valid_visibility = ['everyone', 'adults_only', 'admins_only', 'private']
    if visibility and visibility not in valid_visibility:
        return {"success": False, "error": f"Visibility must be one of: {valid_visibility}"}

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
        register_vector(conn)
        cursor = conn.cursor()

        # Check document exists
        cursor.execute("""
            SELECT id, title FROM family_documents WHERE id = %s
        """, (document_id,))

        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return {"success": False, "error": "Document not found"}

        old_title = row[1]
        re_embedded = False
        tokens_used = 0

        # Build update query dynamically
        updates = []
        values = []

        if title:
            updates.append("title = %s")
            values.append(title.strip())

        if category:
            updates.append("category = %s")
            values.append(category)

        # Handle assigned_to update
        if clear_assigned_to:
            updates.append("assigned_to = NULL")
        elif assigned_to is not None:
            updates.append("assigned_to = %s")
            values.append(assigned_to)

        # Handle visibility update
        if visibility:
            updates.append("visibility = %s")
            values.append(visibility)

        if content:
            # Need to regenerate embedding
            cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")
            co = cohere.ClientV2(api_key=cohere_api_key)

            try:
                response = co.embed(
                    texts=[content],
                    model="embed-v4.0",
                    input_type="search_document",
                    embedding_types=["float"],
                    output_dimension=1024  # Match document embedding dimensions
                )
                embedding = response.embeddings.float_[0]
                tokens_used = response.meta.billed_units.input_tokens if response.meta and response.meta.billed_units else len(content.split())
                re_embedded = True

                updates.append("content = %s")
                values.append(content.strip())
                updates.append("embedding = %s")
                values.append(embedding)

            except cohere.errors.CohereAPIError as e:
                cursor.close()
                conn.close()
                return {"success": False, "error": f"Cohere API error: {str(e)}"}

        # Always update updated_at
        updates.append("updated_at = NOW()")

        # Execute update
        values.append(document_id)
        cursor.execute(f"""
            UPDATE family_documents
            SET {', '.join(updates)}
            WHERE id = %s
            RETURNING title
        """, values)

        new_title = cursor.fetchone()[0]

        # Log API usage if re-embedded
        if re_embedded and tokens_used > 0:
            estimated_cost = tokens_used * 0.0000001
            cursor.execute("""
                INSERT INTO api_usage_log (operation, tokens_used, cost_usd)
                VALUES ('embed', %s, %s)
            """, (tokens_used, estimated_cost))

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "message": f"Document '{new_title}' has been updated",
            "document_id": document_id,
            "re_embedded": re_embedded,
            "tokens_used": tokens_used if re_embedded else 0
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to update document: {str(e)}"}

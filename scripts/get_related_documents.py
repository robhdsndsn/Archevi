# get_related_documents.py
# Windmill Python script for finding related documents
# Path: f/chatbot/get_related_documents
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Find documents similar to a given document using vector similarity.

This endpoint finds semantically related documents by comparing embeddings.
Useful for "You might also want to see..." suggestions.

Args:
    document_id: ID of the source document
    tenant_id: UUID for data isolation
    limit: Max number of related documents (default 5)
    user_member_type: For visibility filtering ('admin', 'adult', 'teen', 'child')
    user_member_id: Current user's family_member.id for private doc access

Returns:
    dict: {related_documents: [...], source_document: {...}}
"""

import psycopg2
from typing import TypedDict, List
import wmill


class RelatedDocument(TypedDict):
    id: int
    title: str
    category: str | None
    similarity: float
    created_at: str
    tags: List[str] | None


class SourceDocument(TypedDict):
    id: int
    title: str
    category: str | None


class RelatedDocumentsResult(TypedDict):
    related_documents: List[RelatedDocument]
    source_document: SourceDocument | None
    error: str | None


def build_visibility_filter(user_member_type: str | None, user_member_id: int | None) -> tuple[str, list]:
    """Build SQL WHERE clause for visibility filtering."""
    if not user_member_type or user_member_type == 'admin':
        return "", []

    elif user_member_type == 'adult':
        return """
            AND (
                d2.visibility IN ('everyone', 'adults_only')
                OR (d2.visibility = 'private' AND d2.assigned_to = %s)
            )
        """, [user_member_id] if user_member_id else []

    else:  # teen, child
        return """
            AND (
                d2.visibility = 'everyone'
                OR (d2.visibility = 'private' AND d2.assigned_to = %s)
            )
        """, [user_member_id] if user_member_id else []


def main(
    document_id: int,
    tenant_id: str,
    limit: int = 5,
    user_member_type: str | None = None,
    user_member_id: int | None = None,
) -> RelatedDocumentsResult:
    """Find documents similar to the given document."""

    if not document_id or not tenant_id:
        return {
            "success": False,
            "related": [],
            "related_documents": [],
            "source_document": None,
            "error": "document_id and tenant_id are required"
        }

    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    conn = psycopg2.connect(
        host=postgres_db['host'],
        port=postgres_db['port'],
        dbname=postgres_db['dbname'],
        user=postgres_db['user'],
        password=postgres_db['password'],
        sslmode=postgres_db.get('sslmode', 'disable')
    )
    cursor = conn.cursor()

    try:
        # First, get the source document to verify it exists and get its title
        # Note: Uses family_documents table (legacy) which has tenant_id column added
        cursor.execute("""
            SELECT id, title, category, embedding IS NOT NULL as has_embedding
            FROM family_documents
            WHERE id = %s AND tenant_id = %s::uuid
        """, (document_id, tenant_id))

        source_row = cursor.fetchone()
        if not source_row:
            conn.close()
            return {
                "success": False,
                "related": [],
                "related_documents": [],
                "source_document": None,
                "error": f"Document {document_id} not found"
            }

        source_document = {
            "id": source_row[0],
            "title": source_row[1],
            "category": source_row[2]
        }

        if not source_row[3]:  # No embedding
            conn.close()
            return {
                "success": False,
                "related": [],
                "related_documents": [],
                "source_document": source_document,
                "error": "Source document has no embedding for similarity search"
            }

        # Build visibility filter
        visibility_clause, visibility_params = build_visibility_filter(
            user_member_type, user_member_id
        )

        # Find similar documents using vector similarity
        # Uses pgvector's <=> operator for cosine distance
        # Note: Uses family_documents table (legacy) which has tenant_id column added
        query = f"""
            SELECT
                d2.id,
                d2.title,
                d2.category,
                1 - (d2.embedding <=> d1.embedding) as similarity,
                d2.created_at,
                COALESCE((SELECT array_agg(t) FROM jsonb_array_elements_text(d2.metadata->'tags') t), ARRAY[]::text[]) as tags
            FROM family_documents d1
            JOIN family_documents d2 ON d1.tenant_id = d2.tenant_id AND d1.id != d2.id
            WHERE d1.id = %s
              AND d1.tenant_id = %s::uuid
              AND d2.embedding IS NOT NULL
              {visibility_clause}
            ORDER BY d2.embedding <=> d1.embedding
            LIMIT %s
        """

        params = [document_id, tenant_id] + visibility_params + [limit]
        cursor.execute(query, params)

        results = cursor.fetchall()

        related_documents = []
        for row in results:
            related_documents.append({
                "id": row[0],
                "title": row[1],
                "category": row[2],
                "similarity": round(float(row[3]) * 100, 1),  # Convert to percentage
                "created_at": row[4].isoformat() if row[4] else None,
                "tags": row[5] if row[5] else []
            })

        cursor.close()
        conn.close()

        return {
            "success": True,
            "related": related_documents,  # Alias for path_test.py compatibility
            "related_documents": related_documents,
            "source_document": source_document,
            "error": None
        }

    except Exception as e:
        cursor.close()
        conn.close()
        return {
            "success": False,
            "related": [],
            "related_documents": [],
            "source_document": None,
            "error": str(e)
        }

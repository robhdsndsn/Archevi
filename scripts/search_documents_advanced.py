# search_documents_advanced.py
# Windmill Python script for advanced document search
# Path: f/chatbot/search_documents_advanced
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - cohere

"""
Search documents with advanced filtering options.

Supports semantic search combined with:
- Date range filtering
- Category filtering
- Tag filtering
- Person/family member filtering
- Pagination

Args:
    search_term: Optional text search query
    category: Optional category filter
    date_from: Optional start date (ISO format)
    date_to: Optional end date (ISO format)
    tags: Optional list of tags to filter by
    assigned_to: Optional family member ID to filter by
    limit: Max results (default 20)
    offset: Pagination offset (default 0)
    tenant_id: Tenant ID for multi-tenant isolation

Returns:
    dict: Documents, total count, and pagination info
"""

import psycopg2
import cohere
from datetime import datetime
from typing import TypedDict, List
import wmill


class Document(TypedDict):
    id: int
    title: str
    content_preview: str
    category: str
    relevance_score: float
    created_at: str
    tags: List[str]


class SearchResult(TypedDict):
    documents: List[Document]
    total: int
    has_more: bool


def main(
    search_term: str | None = None,
    category: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    tags: List[str] | None = None,
    assigned_to: int | None = None,
    limit: int = 20,
    offset: int = 0,
    tenant_id: str | None = None,
    # Visibility filtering parameters
    user_member_type: str | None = None,  # 'admin', 'adult', 'teen', 'child'
    user_member_id: int | None = None,    # Current user's family_member.id for private doc access
) -> SearchResult:
    """Search documents with advanced filters."""

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

    # Build query with filters
    conditions = []
    params = []

    # Tenant isolation (if multi-tenant)
    if tenant_id:
        conditions.append("d.tenant_id = %s")
        params.append(tenant_id)

    # Category filter
    if category:
        conditions.append("d.category = %s")
        params.append(category)

    # Date range filters
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            conditions.append("d.created_at >= %s")
            params.append(from_date)
        except ValueError:
            pass

    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            conditions.append("d.created_at <= %s")
            params.append(to_date)
        except ValueError:
            pass

    # Tag filtering - tags are stored in metadata JSONB
    if tags and len(tags) > 0:
        # Filter documents that have ANY of the specified tags in metadata->'tags'
        conditions.append("d.metadata->'tags' ?| %s")
        params.append(tags)

    # Family member (person) filter
    if assigned_to is not None:
        conditions.append("d.assigned_to = %s")
        params.append(assigned_to)

    # Visibility filtering based on user's member_type
    # If no user_member_type provided, default to showing only 'everyone' (most restrictive)
    if user_member_type:
        if user_member_type == 'admin':
            # Admins see everything - no visibility filter needed
            pass
        elif user_member_type == 'adult':
            # Adults see: everyone, adults_only, and private docs assigned to them
            if user_member_id is not None:
                conditions.append("""
                    (d.visibility IN ('everyone', 'adults_only')
                     OR (d.visibility = 'private' AND d.assigned_to = %s))
                """)
                params.append(user_member_id)
            else:
                conditions.append("d.visibility IN ('everyone', 'adults_only')")
        else:
            # teen/child see: everyone, and private docs assigned to them
            if user_member_id is not None:
                conditions.append("""
                    (d.visibility = 'everyone'
                     OR (d.visibility = 'private' AND d.assigned_to = %s))
                """)
                params.append(user_member_id)
            else:
                conditions.append("d.visibility = 'everyone'")
    else:
        # No user_member_type provided - show only 'everyone' visibility (safest default)
        conditions.append("COALESCE(d.visibility, 'everyone') = 'everyone'")

    # If we have a search term, use vector similarity
    if search_term and search_term.strip():
        # Get embedding for search term
        cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")
        co = cohere.ClientV2(api_key=cohere_api_key)

        response = co.embed(
            texts=[search_term],
            model="embed-v4.0",
            input_type="search_query",
            embedding_types=["float"],
            output_dimension=1024  # Match document embedding dimensions
        )
        query_embedding = response.embeddings.float_[0]

        # Build the query with vector similarity
        where_clause = " AND ".join(conditions) if conditions else "1=1"

        # First get total count
        # Note: Uses family_documents table (legacy) which has tenant_id column added
        count_query = f"""
            SELECT COUNT(*)
            FROM family_documents d
            WHERE {where_clause}
              AND d.embedding IS NOT NULL
        """
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]

        # Then get paginated results with similarity
        search_query = f"""
            SELECT
                d.id,
                d.title,
                LEFT(d.content, 200) as content_preview,
                d.category,
                1 - (d.embedding <=> %s::vector) as similarity,
                d.created_at,
                COALESCE((SELECT array_agg(t) FROM jsonb_array_elements_text(d.metadata->'tags') t), ARRAY[]::text[]) as tags,
                d.assigned_to,
                fm.name as assigned_to_name,
                d.visibility
            FROM family_documents d
            LEFT JOIN family_members fm ON d.assigned_to = fm.id
            WHERE {where_clause}
              AND d.embedding IS NOT NULL
            ORDER BY d.embedding <=> %s::vector
            LIMIT %s OFFSET %s
        """
        cursor.execute(
            search_query,
            [query_embedding] + params + [query_embedding, limit, offset]
        )

    else:
        # No search term - just filter and order by date
        where_clause = " AND ".join(conditions) if conditions else "1=1"

        # Get total count
        count_query = f"SELECT COUNT(*) FROM family_documents d WHERE {where_clause}"
        cursor.execute(count_query, params)
        total = cursor.fetchone()[0]

        # Get paginated results
        search_query = f"""
            SELECT
                d.id,
                d.title,
                LEFT(d.content, 200) as content_preview,
                d.category,
                0 as similarity,
                d.created_at,
                COALESCE((SELECT array_agg(t) FROM jsonb_array_elements_text(d.metadata->'tags') t), ARRAY[]::text[]) as tags,
                d.assigned_to,
                fm.name as assigned_to_name,
                d.visibility
            FROM family_documents d
            LEFT JOIN family_members fm ON d.assigned_to = fm.id
            WHERE {where_clause}
            ORDER BY d.created_at DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(search_query, params + [limit, offset])

    results = cursor.fetchall()
    cursor.close()
    conn.close()

    documents = []
    for row in results:
        documents.append({
            "id": row[0],
            "title": row[1],
            "content_preview": row[2] or "",
            "category": row[3],
            "relevance_score": float(row[4]) if row[4] else 0,
            "created_at": row[5].isoformat() if row[5] else "",
            "tags": list(row[6]) if row[6] else [],
            "assigned_to": row[7],
            "assigned_to_name": row[8],
            "visibility": row[9] or "everyone"
        })

    return {
        "documents": documents,
        "total": total,
        "has_more": offset + len(documents) < total
    }

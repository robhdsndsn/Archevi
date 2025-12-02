# admin_list_documents.py
# Windmill Python script for admin document listing
# Path: f/chatbot/admin_list_documents
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
List all documents across all tenants for admin view.

This is an admin-only endpoint that returns documents with tenant information.

Args:
    search_term: Optional text search query
    category: Optional category filter
    tenant_id: Optional tenant filter (to view single tenant)
    date_from: Optional start date (ISO format)
    date_to: Optional end date (ISO format)
    limit: Max results (default 50)
    offset: Pagination offset (default 0)
    sort_by: Sort field ('created_at', 'title', 'tenant') (default 'created_at')
    sort_order: Sort order ('asc', 'desc') (default 'desc')

Returns:
    dict: Documents with tenant info, total count, and pagination info
"""

import psycopg2
from datetime import datetime
from typing import TypedDict, List
import wmill


class AdminDocument(TypedDict):
    id: int
    title: str
    content_preview: str
    category: str
    tenant_id: str
    tenant_name: str
    created_at: str
    created_by: str | None


class AdminListResult(TypedDict):
    documents: List[AdminDocument]
    total: int
    has_more: bool
    tenants: List[dict]  # List of {id, name} for filter dropdown


def main(
    search_term: str | None = None,
    category: str | None = None,
    tenant_id: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = 50,
    offset: int = 0,
    sort_by: str = "created_at",
    sort_order: str = "desc",
) -> AdminListResult:
    """List all documents for admin view."""

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

    # Tenant filter (optional - if not provided, show all tenants)
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

    # Text search (simple ILIKE for now - not vector search for admin list)
    if search_term and search_term.strip():
        conditions.append("(d.title ILIKE %s OR d.content ILIKE %s)")
        search_pattern = f"%{search_term}%"
        params.extend([search_pattern, search_pattern])

    where_clause = " AND ".join(conditions) if conditions else "1=1"

    # Validate sort options
    valid_sort_fields = {
        "created_at": "d.created_at",
        "title": "d.title",
        "tenant": "t.name",
        "category": "d.category"
    }
    sort_field = valid_sort_fields.get(sort_by, "d.created_at")
    sort_direction = "ASC" if sort_order.lower() == "asc" else "DESC"

    # Get total count
    count_query = f"""
        SELECT COUNT(*)
        FROM family_documents d
        JOIN tenants t ON d.tenant_id = t.id
        WHERE {where_clause}
    """
    cursor.execute(count_query, params)
    total = cursor.fetchone()[0]

    # Get paginated results with tenant info
    list_query = f"""
        SELECT
            d.id,
            d.title,
            LEFT(d.content, 200) as content_preview,
            d.category,
            d.tenant_id,
            t.name as tenant_name,
            d.created_at,
            d.created_by
        FROM family_documents d
        JOIN tenants t ON d.tenant_id = t.id
        WHERE {where_clause}
        ORDER BY {sort_field} {sort_direction}
        LIMIT %s OFFSET %s
    """
    cursor.execute(list_query, params + [limit, offset])
    results = cursor.fetchall()

    # Get list of all tenants for filter dropdown
    cursor.execute("""
        SELECT id, name FROM tenants
        WHERE status = 'active'
        ORDER BY name
    """)
    tenants_list = [{"id": row[0], "name": row[1]} for row in cursor.fetchall()]

    cursor.close()
    conn.close()

    documents = []
    for row in results:
        documents.append({
            "id": row[0],
            "title": row[1],
            "content_preview": row[2] or "",
            "category": row[3],
            "tenant_id": row[4],
            "tenant_name": row[5],
            "created_at": row[6].isoformat() if row[6] else "",
            "created_by": row[7]
        })

    return {
        "documents": documents,
        "total": total,
        "has_more": offset + len(documents) < total,
        "tenants": tenants_list
    }

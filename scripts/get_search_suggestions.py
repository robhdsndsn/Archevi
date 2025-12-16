# get_search_suggestions.py
# Windmill Python script for smart search autocomplete suggestions
# Path: f/chatbot/get_search_suggestions
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Get intelligent search suggestions based on query prefix.

Searches across:
1. Document titles (prefix match)
2. Extracted entity names from extracted_data JSONB
3. Recent user queries from conversations
4. Tags from document metadata
5. Person names from family_members

Args:
    query_prefix (str): The partial search query (minimum 2 chars)
    tenant_id (str): UUID of the tenant for filtering
    user_email (str): Email of current user for recent queries
    limit (int): Maximum suggestions to return (default 10)

Returns:
    dict: {
        success: bool,
        suggestions: [
            {
                type: 'document' | 'person' | 'tag' | 'recent' | 'entity',
                value: str,
                label: str,
                document_id: int | null,
                score: float
            }
        ],
        error: str (if failed)
    }
"""

import psycopg2
import psycopg2.extras
import wmill
from typing import TypedDict, Optional
import re


class Suggestion(TypedDict):
    type: str
    value: str
    label: str
    document_id: Optional[int]
    score: float


def main(
    query_prefix: str,
    tenant_id: str = None,
    user_email: str = None,
    limit: int = 10
) -> dict:
    """
    Get search suggestions for autocomplete.
    """
    if not query_prefix or len(query_prefix) < 2:
        return {"success": True, "suggestions": []}

    if not tenant_id:
        return {"success": False, "suggestions": [], "error": "tenant_id is required"}

    # Normalize query for matching
    query_lower = query_prefix.lower().strip()
    query_pattern = f"%{query_lower}%"

    # Fetch database resource
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    suggestions: list[Suggestion] = []

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

        # 1. Document titles (highest priority - direct matches)
        cursor.execute("""
            SELECT d.id, d.title, d.category
            FROM family_documents d
            WHERE d.tenant_id = %s
              AND LOWER(d.title) LIKE %s
            ORDER BY
                CASE WHEN LOWER(d.title) LIKE %s THEN 0 ELSE 1 END,
                d.created_at DESC
            LIMIT 5
        """, (tenant_id, query_pattern, f"{query_lower}%"))

        for row in cursor.fetchall():
            suggestions.append({
                "type": "document",
                "value": row['title'],
                "label": f"{row['title']} ({row['category']})",
                "document_id": row['id'],
                "score": 1.0 if row['title'].lower().startswith(query_lower) else 0.8
            })

        # 2. Person names from family_members
        cursor.execute("""
            SELECT id, name, email
            FROM family_members
            WHERE tenant_id = %s
              AND LOWER(name) LIKE %s
            ORDER BY
                CASE WHEN LOWER(name) LIKE %s THEN 0 ELSE 1 END,
                name
            LIMIT 3
        """, (tenant_id, query_pattern, f"{query_lower}%"))

        for row in cursor.fetchall():
            suggestions.append({
                "type": "person",
                "value": row['name'],
                "label": f"Person: {row['name']}",
                "document_id": None,
                "score": 0.9 if row['name'].lower().startswith(query_lower) else 0.7
            })

        # 3. Tags from metadata
        cursor.execute("""
            SELECT tag, COUNT(*) as doc_count
            FROM family_documents d,
            LATERAL jsonb_array_elements_text(COALESCE(d.metadata->'tags', '[]'::jsonb)) as tag
            WHERE d.tenant_id = %s
              AND LOWER(tag) LIKE %s
            GROUP BY tag
            ORDER BY doc_count DESC
            LIMIT 4
        """, (tenant_id, query_pattern))

        for row in cursor.fetchall():
            suggestions.append({
                "type": "tag",
                "value": row['tag'],
                "label": f"Tag: {row['tag']} ({row['doc_count']} docs)",
                "document_id": None,
                "score": 0.75
            })

        # 4. Recent user queries from conversations
        # Note: conversations table doesn't have tenant_id, but user_email already
        # ensures we only get the current user's own queries (which is sufficient isolation)
        if user_email:
            cursor.execute("""
                SELECT content, MAX(created_at) as last_used
                FROM conversations
                WHERE user_email = %s
                  AND role = 'user'
                  AND LOWER(content) LIKE %s
                GROUP BY content
                ORDER BY last_used DESC
                LIMIT 3
            """, (user_email, query_pattern))

            for row in cursor.fetchall():
                # Truncate long queries
                query_text = row['content'][:50] + "..." if len(row['content']) > 50 else row['content']
                suggestions.append({
                    "type": "recent",
                    "value": row['content'],
                    "label": f"Recent: {query_text}",
                    "document_id": None,
                    "score": 0.65
                })

        # 5. Extracted entities from extracted_data JSONB
        # Look for common fields like policy_number, provider, patient_name, etc.
        cursor.execute("""
            SELECT
                d.id,
                d.title,
                ed.key as entity_type,
                ed.value as entity_value,
                d.created_at
            FROM family_documents d,
            LATERAL jsonb_each_text(COALESCE(d.extracted_data, '{}'::jsonb)) as ed(key, value)
            WHERE d.tenant_id = %s
              AND ed.value IS NOT NULL
              AND LENGTH(ed.value) > 2
              AND LOWER(ed.value) LIKE %s
              AND ed.key NOT IN ('extraction_date', 'confidence', 'raw_response')
            ORDER BY d.created_at DESC
            LIMIT 3
        """, (tenant_id, query_pattern))

        for row in cursor.fetchall():
            entity_label = row['entity_type'].replace('_', ' ').title()
            suggestions.append({
                "type": "entity",
                "value": row['entity_value'],
                "label": f"{entity_label}: {row['entity_value']}",
                "document_id": row['id'],
                "score": 0.7
            })

        # 6. Categories as suggestions
        cursor.execute("""
            SELECT category, COUNT(*) as doc_count
            FROM family_documents
            WHERE tenant_id = %s
              AND LOWER(category) LIKE %s
            GROUP BY category
            ORDER BY doc_count DESC
            LIMIT 2
        """, (tenant_id, query_pattern))

        for row in cursor.fetchall():
            suggestions.append({
                "type": "category",
                "value": f"category:{row['category']}",
                "label": f"Category: {row['category']} ({row['doc_count']} docs)",
                "document_id": None,
                "score": 0.6
            })

        cursor.close()
        conn.close()

        # Sort by score and deduplicate by value
        seen_values = set()
        unique_suggestions = []
        for s in sorted(suggestions, key=lambda x: x['score'], reverse=True):
            value_key = s['value'].lower()
            if value_key not in seen_values:
                seen_values.add(value_key)
                unique_suggestions.append(s)

        return {
            "success": True,
            "suggestions": unique_suggestions[:limit]
        }

    except psycopg2.Error as e:
        return {"success": False, "suggestions": [], "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "suggestions": [], "error": f"Failed to get suggestions: {str(e)}"}

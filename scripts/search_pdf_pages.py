# search_pdf_pages.py
# Windmill Python script for visual search of PDF pages
# Path: f/chatbot/search_pdf_pages
#
# requirements:
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - wmill

"""
Search PDF pages by visual similarity using text-to-image embeddings.

This enables queries like:
- "Find the page with the pie chart"
- "Show me the signature page"
- "Find handwritten notes"
- "Locate the floor plan"

Args:
    query (str): Natural language search query
    tenant_id (str): UUID of the tenant
    document_id (int, optional): Limit search to specific document
    limit (int): Maximum results to return (default: 5)
    min_similarity (float): Minimum similarity threshold (default: 0.25)

Returns:
    dict: {
        success: bool,
        results: [
            {
                page_id: int,
                document_id: int,
                document_title: str,
                page_number: int,
                similarity: float,
                page_image: str (base64),
                ocr_text: str,
                has_images: bool
            }
        ],
        query_tokens: int,
        error: str (if failed)
    }
"""

import cohere
import psycopg2
import psycopg2.extras
from pgvector.psycopg2 import register_vector
import wmill


def main(
    query: str,
    tenant_id: str,
    document_id: int = None,
    limit: int = 5,
    min_similarity: float = 0.25
) -> dict:
    """Search PDF pages by visual similarity."""

    if not query or not tenant_id:
        return {"success": False, "error": "query and tenant_id are required"}

    # Get resources
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    # Initialize Cohere client
    co = cohere.Client(cohere_api_key)

    try:
        # Create query embedding using text input
        # Cohere Embed v4 aligns text and image embeddings in the same space
        response = co.embed(
            model="embed-v4.0",
            input_type="search_query",
            embedding_types=["float"],
            texts=[query]
        )

        query_embedding = response.embeddings.float[0]
        query_tokens = response.meta.billed_units.input_tokens if response.meta and response.meta.billed_units else 0

        # Connect to database
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        register_vector(conn)
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Build search query
        if document_id:
            # Search within specific document
            cursor.execute("""
                SELECT
                    dp.id as page_id,
                    dp.document_id,
                    fd.title as document_title,
                    dp.page_number,
                    (1 - (dp.embedding <=> %s::vector)) as similarity,
                    dp.page_image,
                    dp.ocr_text,
                    dp.has_images,
                    dp.width,
                    dp.height
                FROM document_pages dp
                JOIN family_documents fd ON dp.document_id = fd.id
                WHERE dp.tenant_id = %s
                  AND dp.document_id = %s
                  AND dp.embedding IS NOT NULL
                  AND (1 - (dp.embedding <=> %s::vector)) >= %s
                ORDER BY dp.embedding <=> %s::vector
                LIMIT %s
            """, (query_embedding, tenant_id, document_id, query_embedding, min_similarity, query_embedding, limit))
        else:
            # Search across all tenant documents
            cursor.execute("""
                SELECT
                    dp.id as page_id,
                    dp.document_id,
                    fd.title as document_title,
                    dp.page_number,
                    (1 - (dp.embedding <=> %s::vector)) as similarity,
                    dp.page_image,
                    dp.ocr_text,
                    dp.has_images,
                    dp.width,
                    dp.height
                FROM document_pages dp
                JOIN family_documents fd ON dp.document_id = fd.id
                WHERE dp.tenant_id = %s
                  AND dp.embedding IS NOT NULL
                  AND (1 - (dp.embedding <=> %s::vector)) >= %s
                ORDER BY dp.embedding <=> %s::vector
                LIMIT %s
            """, (query_embedding, tenant_id, query_embedding, min_similarity, query_embedding, limit))

        rows = cursor.fetchall()

        results = []
        for row in rows:
            results.append({
                "page_id": row['page_id'],
                "document_id": row['document_id'],
                "document_title": row['document_title'],
                "page_number": row['page_number'],
                "similarity": round(float(row['similarity']), 4),
                "page_image": row['page_image'],
                "ocr_text": row['ocr_text'][:500] if row['ocr_text'] else None,
                "has_images": row['has_images'],
                "dimensions": {"width": row['width'], "height": row['height']}
            })

        cursor.close()
        conn.close()

        return {
            "success": True,
            "results": results,
            "query_tokens": query_tokens,
            "result_count": len(results)
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Search failed: {str(e)}"}

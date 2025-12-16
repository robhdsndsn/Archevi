# search_documents_tool.py
# Windmill Python script - AI Agent Tool for document search
# Path: f/chatbot/search_documents_tool
#
# requirements:
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - wmill

"""
AI Agent Tool: Search family documents using semantic search.

This is designed to be called by a Windmill AI Agent as a tool.
It handles embedding, vector search, and reranking - returning
the most relevant documents for the AI to use as context.

Args:
    query: The search query (natural language)
    tenant_id: UUID of the tenant (family) for data isolation
    top_k: Number of results to return (default: 5)
    user_member_type: 'admin', 'adult', 'teen', 'child' for visibility filtering
    user_member_id: family_members.id for private doc access

Returns:
    dict: {
        documents: list[{id, title, content, category, relevance}],
        query: str,
        count: int
    }
"""

import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
from typing import Optional
import wmill


def main(
    query: str,
    tenant_id: str,
    top_k: int = 5,
    user_member_type: Optional[str] = None,
    user_member_id: Optional[int] = None,
) -> dict:
    """
    Search documents using Cohere Embed v4 + pgvector + Rerank v3.5
    Returns top documents for AI Agent context.
    """
    if not query or not query.strip():
        return {"documents": [], "query": query, "count": 0, "error": "Empty query"}

    if not tenant_id:
        return {"documents": [], "query": query, "count": 0, "error": "tenant_id required"}

    query = query.strip()

    # Fetch resources
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    co = cohere.ClientV2(api_key=cohere_api_key)

    # Step 1: Embed query with Cohere Embed v4
    try:
        embed_response = co.embed(
            texts=[query],
            model="embed-v4.0",
            input_type="search_query",
            embedding_types=["float"],
            output_dimension=1024
        )
        query_embedding = embed_response.embeddings.float_[0]
    except Exception as e:
        return {"documents": [], "query": query, "count": 0, "error": f"Embed error: {str(e)}"}

    # Step 2: Vector search in PostgreSQL
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

        # Build visibility filter
        visibility_filter = ""
        params = [query_embedding, tenant_id]

        if user_member_type:
            if user_member_type == 'admin':
                pass  # Admins see everything
            elif user_member_type == 'adult':
                if user_member_id is not None:
                    visibility_filter = "AND (COALESCE(visibility, 'everyone') IN ('everyone', 'adults_only') OR (visibility = 'private' AND assigned_to = %s))"
                    params.append(user_member_id)
                else:
                    visibility_filter = "AND COALESCE(visibility, 'everyone') IN ('everyone', 'adults_only')"
            else:
                if user_member_id is not None:
                    visibility_filter = "AND (COALESCE(visibility, 'everyone') = 'everyone' OR (visibility = 'private' AND assigned_to = %s))"
                    params.append(user_member_id)
                else:
                    visibility_filter = "AND COALESCE(visibility, 'everyone') = 'everyone'"
        else:
            visibility_filter = "AND COALESCE(visibility, 'everyone') = 'everyone'"

        # Get more results for reranking
        cursor.execute(f"""
            SELECT id, title, content, category, embedding <=> %s::vector AS distance
            FROM family_documents
            WHERE tenant_id = %s::uuid AND embedding IS NOT NULL
            {visibility_filter}
            ORDER BY distance
            LIMIT 15
        """, params)

        search_results = cursor.fetchall()
        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        return {"documents": [], "query": query, "count": 0, "error": f"DB error: {str(e)}"}

    if not search_results:
        return {"documents": [], "query": query, "count": 0}

    # Step 3: Rerank with Cohere Rerank v3.5
    try:
        documents_for_rerank = []
        for r in search_results:
            doc_text = f"title: {r[1]}\ncategory: {r[3]}\ncontent: {r[2][:4000]}"
            documents_for_rerank.append({
                "id": str(r[0]),
                "title": r[1],
                "content": r[2][:8000],
                "category": r[3],
                "rerank_text": doc_text
            })

        rerank_response = co.rerank(
            query=query,
            documents=[d["rerank_text"] for d in documents_for_rerank],
            top_n=top_k,
            model="rerank-v3.5",
            return_documents=False
        )

        # Get reranked results
        documents = []
        for result in rerank_response.results:
            doc = documents_for_rerank[result.index]
            documents.append({
                "id": doc["id"],
                "title": doc["title"],
                "content": doc["content"],
                "category": doc["category"],
                "relevance": round(float(result.relevance_score), 3)
            })

    except Exception as e:
        # Fallback: use vector search results
        documents = []
        for r in search_results[:top_k]:
            distance = float(r[4])
            similarity = max(0.0, min(1.0, 1.0 / (1.0 + distance)))
            documents.append({
                "id": str(r[0]),
                "title": r[1],
                "content": r[2][:8000],
                "category": r[3],
                "relevance": round(similarity, 3)
            })

    return {
        "documents": documents,
        "query": query,
        "count": len(documents)
    }

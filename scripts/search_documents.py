# search_documents.py
# Windmill Python script for semantic document search (testing/debugging)
# Path: f/chatbot/search_documents
#
# requirements:
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - wmill
#   - requests

"""
Semantic search for documents in the Family Second Brain knowledge base.

This script is primarily for testing and debugging the RAG pipeline.
It performs semantic search without the generation step.

Args:
    search_term (str): Search query text
    category (str, optional): Filter by document category
    limit (int): Maximum number of results (default: 5)

Returns:
    list: List of matching documents with:
        - id: Document ID
        - title: Document title
        - content_preview: First 200 characters of content
        - category: Document category
        - relevance_score: Similarity score (0-1, higher is better)
        - created_at: Document creation timestamp

Example:
    results = await f.chatbot.search_documents(
        search_term="apple pie ingredients",
        category="recipes",
        limit=5
    )
"""

import requests
import psycopg2
from pgvector.psycopg2 import register_vector
from typing import Optional, List
from datetime import datetime
import wmill


def main(
    search_term: str,
    category: Optional[str] = None,
    limit: int = 5,
) -> List[dict]:
    """
    Perform semantic search for documents in the knowledge base.
    """
    # Get credentials from Windmill
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    # Validate input
    if not search_term or not search_term.strip():
        raise ValueError("Search term cannot be empty")

    search_term = search_term.strip()

    # Validate category if provided
    valid_categories = ['recipes', 'medical', 'financial', 'family_history', 'general', 'insurance', 'invoices']
    if category and category not in valid_categories:
        raise ValueError(f"Category must be one of: {valid_categories}")

    # Validate limit
    if limit < 1:
        limit = 1
    elif limit > 20:
        limit = 20

    # Generate embedding using Cohere API directly (like embed_document)
    embed_url = "https://api.cohere.ai/v1/embed"
    headers = {
        "Authorization": f"Bearer {cohere_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "texts": [search_term],
        "model": "embed-english-v3.0",
        "input_type": "search_query"
    }

    try:
        response = requests.post(embed_url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        query_embedding = data["embeddings"][0]
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Cohere API error: {str(e)}")

    # Search PostgreSQL
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

        if category:
            cursor.execute("""
                SELECT id, title, content, category, created_at,
                       1 - (embedding <=> %s::vector) AS relevance_score
                FROM family_documents
                WHERE category = %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """, (query_embedding, category, query_embedding, limit))
        else:
            cursor.execute("""
                SELECT id, title, content, category, created_at,
                       1 - (embedding <=> %s::vector) AS relevance_score
                FROM family_documents
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """, (query_embedding, query_embedding, limit))

        results = cursor.fetchall()
        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        raise RuntimeError(f"Database error: {str(e)}")

    # Format results
    documents = []
    for row in results:
        doc_id, title, content, doc_category, created_at, relevance = row

        # Create content preview (first 200 chars)
        content_preview = content[:200] + "..." if len(content) > 200 else content

        # Format timestamp
        timestamp = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at)

        documents.append({
            "id": doc_id,
            "title": title,
            "content_preview": content_preview,
            "category": doc_category,
            "relevance_score": round(float(relevance), 4) if relevance else 0.0,
            "created_at": timestamp
        })

    return documents

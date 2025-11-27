# bulk_upload_documents.py
# Windmill Python script for batch document embedding and storage
# Path: f/chatbot/bulk_upload_documents
#
# requirements:
#   - cohere
#   - psycopg2-binary
#   - pgvector

"""
Bulk upload and embed multiple documents to the Family Second Brain knowledge base.

This script efficiently processes multiple documents in batches, generating
embeddings for all of them and storing them in PostgreSQL with vector embeddings.

Args:
    documents (list): List of document dicts with keys:
        - title (str): Document title
        - content (str): Document content
        - category (str): Category ('recipes', 'medical', 'financial', 'family_history', 'general')
        - source_file (str, optional): Original filename
        - created_by (str, optional): User who added it
    batch_size (int): Number of documents to process per batch (default: 10)

Returns:
    dict: {
        uploaded: int,
        failed: int,
        total_tokens: int,
        errors: list[{index, title, error}]
    }

Example:
    result = await f.chatbot.bulk_upload_documents(
        documents=[
            {"title": "Recipe 1", "content": "...", "category": "recipes"},
            {"title": "Medical Info", "content": "...", "category": "medical"},
        ],
        batch_size=10
    )
"""

import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
from typing import List, Optional


def main(
    documents: List[dict],
    batch_size: int = 10,
    postgres_db: dict = None,  # Windmill resource: f/chatbot/postgres_db
    cohere_api_key: str = None,  # Windmill variable: f/chatbot/cohere_api_key
) -> dict:
    """
    Bulk upload documents with embeddings to the knowledge base.
    """
    if not documents:
        return {
            "uploaded": 0,
            "failed": 0,
            "total_tokens": 0,
            "errors": []
        }

    valid_categories = ['recipes', 'medical', 'financial', 'family_history', 'general']

    # Validate all documents first
    validated_docs = []
    errors = []

    for i, doc in enumerate(documents):
        # Check required fields
        if not doc.get('title') or not doc.get('title', '').strip():
            errors.append({"index": i, "title": doc.get('title', 'Unknown'), "error": "Title is required"})
            continue
        if not doc.get('content') or not doc.get('content', '').strip():
            errors.append({"index": i, "title": doc.get('title', 'Unknown'), "error": "Content is required"})
            continue
        if doc.get('category') not in valid_categories:
            errors.append({"index": i, "title": doc.get('title'), "error": f"Invalid category. Must be one of: {valid_categories}"})
            continue

        validated_docs.append({
            "index": i,
            "title": doc['title'].strip(),
            "content": doc['content'].strip(),
            "category": doc['category'],
            "source_file": doc.get('source_file'),
            "created_by": doc.get('created_by')
        })

    if not validated_docs:
        return {
            "uploaded": 0,
            "failed": len(errors),
            "total_tokens": 0,
            "errors": errors
        }

    # Initialize Cohere client
    co = cohere.ClientV2(api_key=cohere_api_key)

    # Connect to PostgreSQL
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
    except psycopg2.Error as e:
        raise RuntimeError(f"Database connection error: {str(e)}")

    # Process documents in batches
    uploaded = 0
    total_tokens = 0

    for batch_start in range(0, len(validated_docs), batch_size):
        batch = validated_docs[batch_start:batch_start + batch_size]

        # Get embeddings for batch
        try:
            contents = [doc['content'] for doc in batch]
            embed_response = co.embed(
                texts=contents,
                model="embed-english-v3.0",
                input_type="search_document",
                embedding_types=["float"]
            )
            embeddings = embed_response.embeddings.float_

            # Track tokens
            batch_tokens = embed_response.meta.billed_units.input_tokens if embed_response.meta and embed_response.meta.billed_units else sum(len(c.split()) for c in contents)
            total_tokens += batch_tokens

        except cohere.errors.CohereAPIError as e:
            # Mark entire batch as failed
            for doc in batch:
                errors.append({
                    "index": doc['index'],
                    "title": doc['title'],
                    "error": f"Cohere API error: {str(e)}"
                })
            continue

        # Insert documents with embeddings
        try:
            cursor.execute("BEGIN")

            for i, doc in enumerate(batch):
                try:
                    cursor.execute("""
                        INSERT INTO family_documents (title, content, category, source_file, created_by, embedding)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (
                        doc['title'],
                        doc['content'],
                        doc['category'],
                        doc['source_file'],
                        doc['created_by'],
                        embeddings[i]
                    ))
                    uploaded += 1
                except psycopg2.Error as e:
                    errors.append({
                        "index": doc['index'],
                        "title": doc['title'],
                        "error": f"Insert error: {str(e)}"
                    })

            cursor.execute("COMMIT")

        except psycopg2.Error as e:
            cursor.execute("ROLLBACK")
            # Mark batch as failed
            for doc in batch:
                errors.append({
                    "index": doc['index'],
                    "title": doc['title'],
                    "error": f"Transaction error: {str(e)}"
                })

    # Log API usage
    try:
        estimated_cost = total_tokens * 0.0000001  # $0.10 per 1M tokens
        cursor.execute("""
            INSERT INTO api_usage_log (operation, tokens_used, cost_usd)
            VALUES ('bulk_embed', %s, %s)
        """, (total_tokens, estimated_cost))
        conn.commit()
    except psycopg2.Error:
        pass  # Non-critical

    cursor.close()
    conn.close()

    return {
        "uploaded": uploaded,
        "failed": len(errors),
        "total_tokens": total_tokens,
        "errors": errors
    }

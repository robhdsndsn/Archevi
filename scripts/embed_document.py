# embed_document.py
# Windmill Python script for document embedding and storage
# Path: f/chatbot/embed_document
#
# requirements:
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - wmill

"""
Embed and store a document in the Family Second Brain knowledge base.

This script takes document metadata and content, generates a 1024-dimensional
embedding using Cohere's embed-v4.0 model (April 2025), and stores it in PostgreSQL
with pgvector for semantic search.

Embed 4 Features:
- Multimodal support (text + images)
- 128K context window (can process 200-page documents)
- Matryoshka embeddings (variable dimensions: 256, 512, 1024, 1536)
- Improved multilingual support

Args:
    title (str): Document title
    content (str): Document text content
    category (str): Category ('recipes', 'medical', 'financial', 'family_history', 'general')
    source_file (str, optional): Original filename if uploaded
    created_by (str, optional): User who added the document

Returns:
    dict: {document_id: int, message: str, tokens_used: int}

Example:
    # In Windmill:
    result = await f.chatbot.embed_document(
        title="Grandma's Apple Pie Recipe",
        content="Ingredients: 6 apples, 1 cup sugar...",
        category="recipes",
        created_by="sarah@family.com"
    )
"""

import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
from typing import Optional
import wmill


def main(
    title: str,
    content: str,
    category: str,
    source_file: Optional[str] = None,
    created_by: Optional[str] = None,
) -> dict:
    """
    Embed and store a document in the knowledge base.

    The document content is embedded using Cohere's embed-v4.0 model
    (1024 dimensions, 128K context) and stored in PostgreSQL with pgvector
    for efficient semantic search.
    """
    # Validate inputs
    if not title or not title.strip():
        raise ValueError("Title cannot be empty")
    if not content or not content.strip():
        raise ValueError("Content cannot be empty")

    valid_categories = ['recipes', 'medical', 'financial', 'family_history', 'general', 'insurance', 'invoices']
    if category not in valid_categories:
        raise ValueError(f"Category must be one of: {valid_categories}")

    # Fetch resources from Windmill
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    # Initialize Cohere client
    co = cohere.ClientV2(api_key=cohere_api_key)

    # Generate embedding using Embed 4 (April 2025)
    # Using 1024 dimensions for balance of quality and storage efficiency
    # Embed 4 supports Matryoshka dimensions: 256, 512, 1024, 1536
    try:
        response = co.embed(
            texts=[content],
            model="embed-v4.0",
            input_type="search_document",
            embedding_types=["float"],
            output_dimension=1024  # Matryoshka: can use 256, 512, 1024, or 1536
        )
        embedding = response.embeddings.float_[0]
        tokens_used = response.meta.billed_units.input_tokens if response.meta and response.meta.billed_units else len(content.split())
    except Exception as e:
        raise RuntimeError(f"Cohere API error: {str(e)}")

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

        # Insert document with embedding
        cursor.execute("""
            INSERT INTO family_documents (title, content, category, source_file, created_by, embedding)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (title.strip(), content.strip(), category, source_file, created_by, embedding))

        document_id = cursor.fetchone()[0]

        # Log API usage
        estimated_cost = tokens_used * 0.0000001  # $0.10 per 1M tokens
        cursor.execute("""
            INSERT INTO api_usage_log (operation, tokens_used, cost_usd)
            VALUES ('embed', %s, %s)
        """, (tokens_used, estimated_cost))

        conn.commit()
        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        raise RuntimeError(f"Database error: {str(e)}")

    return {
        "document_id": document_id,
        "message": f"Document '{title}' successfully embedded and stored",
        "tokens_used": tokens_used,
        "category": category
    }

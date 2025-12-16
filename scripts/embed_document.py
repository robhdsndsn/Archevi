# embed_document.py
# Windmill Python script for document embedding and storage
# Path: f/chatbot/embed_document
#
# requirements:
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - wmill
#   - httpx

"""
Embed and store a document in the Archevi knowledge base.

Multi-Tenant Architecture:
- Each document is scoped to a specific tenant_id
- Documents are ONLY visible/searchable within their tenant
- Complete data isolation at the database level

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
    tenant_id (str): UUID of the tenant (family) - REQUIRED for isolation
    source_file (str, optional): Original filename if uploaded
    created_by (str, optional): UUID of user who added the document
    metadata (dict, optional): Additional metadata (tags, expiry_dates, etc.)

Returns:
    dict: {document_id: str, tenant_id: str, message: str, tokens_used: int}

Example:
    # In Windmill:
    result = await f.chatbot.embed_document(
        title="Grandma's Apple Pie Recipe",
        content="Ingredients: 6 apples, 1 cup sugar...",
        category="recipes",
        tenant_id="5302d94d-4c08-459d-b49f-d211abdb4047",
        created_by="a41ff201-73dc-413e-a41b-05535858a159"
    )
"""

import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
from typing import Optional
import json
import wmill


def main(
    title: str,
    content: str,
    category: str,
    tenant_id: str,
    source_file: Optional[str] = None,
    created_by: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> dict:
    """
    Embed and store a document in the knowledge base (tenant-scoped).

    The document content is embedded using Cohere's embed-v4.0 model
    (1024 dimensions, 128K context) and stored in PostgreSQL with pgvector
    for efficient semantic search. Documents are isolated by tenant_id.
    """
    # Validate inputs
    if not title or not title.strip():
        raise ValueError("Title cannot be empty")
    if not content or not content.strip():
        raise ValueError("Content cannot be empty")
    if not tenant_id or not tenant_id.strip():
        raise ValueError("tenant_id is required for data isolation")

    valid_categories = ['recipes', 'medical', 'financial', 'family_history', 'general', 'insurance', 'invoices', 'legal', 'education', 'personal']
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

        # Prepare metadata JSON
        doc_metadata = metadata or {}

        # Insert document with embedding (tenant-scoped)
        cursor.execute("""
            INSERT INTO documents (tenant_id, title, content, category, source_file, created_by, embedding, metadata)
            VALUES (%s::uuid, %s, %s, %s, %s, %s::uuid, %s, %s)
            RETURNING id
        """, (tenant_id, title.strip(), content.strip(), category, source_file, created_by, embedding, json.dumps(doc_metadata)))

        document_id = str(cursor.fetchone()[0])

        # Log API usage (tenant-scoped for billing)
        estimated_cost = tokens_used * 0.0000001  # $0.10 per 1M tokens
        cursor.execute("""
            INSERT INTO ai_usage (tenant_id, user_id, operation, model, input_tokens, output_tokens, cost_usd)
            VALUES (%s::uuid, %s::uuid, 'embed', 'embed-v4.0', %s, 0, %s)
        """, (tenant_id, created_by, tokens_used, estimated_cost))

        conn.commit()
        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        raise RuntimeError(f"Database error: {str(e)}")

    return {
        "document_id": document_id,
        "tenant_id": tenant_id,
        "message": f"Document '{title}' successfully embedded and stored",
        "tokens_used": tokens_used,
        "category": category
    }

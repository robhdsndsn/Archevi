# rag_query.py
# Windmill Python script for RAG-based question answering
# Path: f/chatbot/rag_query
#
# requirements:
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - wmill

"""
RAG (Retrieval-Augmented Generation) query pipeline for Archevi.

Multi-Tenant Architecture:
- Each query is scoped to a specific tenant_id
- Documents from other tenants are NEVER visible or searchable
- Complete data isolation at the database level

This script implements the complete RAG workflow:
1. Embed user query using Cohere Embed 4 (April 2025)
2. Vector search in PostgreSQL/pgvector for relevant documents (tenant-scoped)
3. Rerank results using Cohere Rerank v3.5 (December 2024)
4. Generate answer using Cohere Command A (March 2025) with context
5. Store conversation history (tenant-scoped)

Model Upgrades (May 2025):
- Embed v4.0: Multimodal, 128K context, Matryoshka embeddings
- Command A: 111B parameters, 256K context, 150% faster throughput
- Rerank v3.5: State-of-the-art multilingual retrieval

Cost Optimization (Adaptive Model Selection):
- High relevance scores (>0.7) → Use command-r (cheaper, docs clearly answer)
- Low relevance scores (≤0.7) → Use command-a (needs reasoning to synthesize)
- Saves ~60% on API costs at scale

Args:
    query (str): User's natural language question
    tenant_id (str): UUID of the tenant (family) - REQUIRED for isolation
    session_id (str, optional): Conversation session ID (auto-generated if not provided)
    user_id (str, optional): UUID of the user making the query

Returns:
    dict: {
        answer: str,
        sources: list[{id, title, category, relevance}],
        confidence: float,
        session_id: str,
        tenant_id: str
    }

Example:
    result = await f.chatbot.rag_query(
        query="What's the recipe for grandma's apple pie?",
        tenant_id="5302d94d-4c08-459d-b49f-d211abdb4047",
        session_id="user-123-session"
    )
"""

import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
import uuid
import json
import time
import re
from typing import Optional
import wmill

# UUID validation regex
UUID_REGEX = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)

def is_valid_uuid(value: Optional[str]) -> bool:
    """Check if a string is a valid UUID format."""
    if not value or not isinstance(value, str):
        return False
    return bool(UUID_REGEX.match(value))


def main(
    query: str,
    tenant_id: str,
    session_id: Optional[str] = None,
    user_id: Optional[str] = None,
) -> dict:
    """
    Execute RAG pipeline: embed query -> search -> rerank -> generate -> store
    All operations are scoped to the specified tenant_id for data isolation.
    """
    # Validate input
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    if not tenant_id or not tenant_id.strip():
        raise ValueError("tenant_id is required for data isolation")

    query = query.strip()
    tenant_id = tenant_id.strip()

    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid.uuid4())

    # Fetch resources from Windmill
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    # Initialize Cohere client
    co = cohere.ClientV2(api_key=cohere_api_key)

    # Track total tokens for cost logging
    total_tokens = 0
    total_cost = 0.0
    start_time = time.time()  # Track latency for analytics

    # Step 1: Embed the query using Embed 4 (April 2025)
    # Must use same model and dimensions as embed_document.py
    try:
        embed_response = co.embed(
            texts=[query],
            model="embed-v4.0",
            input_type="search_query",
            embedding_types=["float"],
            output_dimension=1024  # Match embed_document.py dimensions
        )
        query_embedding = embed_response.embeddings.float_[0]
        embed_tokens = embed_response.meta.billed_units.input_tokens if embed_response.meta and embed_response.meta.billed_units else len(query.split())
        total_tokens += embed_tokens
        total_cost += embed_tokens * 0.0000001  # $0.10/1M tokens
    except Exception as e:
        raise RuntimeError(f"Cohere embed error: {str(e)}")

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

        # Search for top 10 similar documents - TENANT ISOLATED
        # Only searches documents belonging to this specific tenant
        # Filter out documents without embeddings (NULL embedding returns NULL distance)
        # Note: Uses family_documents table (legacy) which has tenant_id column added
        cursor.execute("""
            SELECT id, title, content, category, embedding <=> %s::vector AS distance
            FROM family_documents
            WHERE tenant_id = %s::uuid AND embedding IS NOT NULL
            ORDER BY distance
            LIMIT 10
        """, (query_embedding, tenant_id))

        search_results = cursor.fetchall()

    except psycopg2.Error as e:
        raise RuntimeError(f"Database search error: {str(e)}")

    # Handle no results
    if not search_results:
        answer = "I couldn't find any relevant information in the family knowledge base. Try rephrasing your question or adding more documents."
        sources = []
        confidence = 0.0

        # Store conversation (tenant-scoped)
        _store_conversation(cursor, conn, tenant_id, session_id, user_id, query, answer, sources)

        return {
            "answer": answer,
            "sources": sources,
            "confidence": confidence,
            "session_id": session_id,
            "tenant_id": tenant_id
        }

    # Step 3: Rerank results using Cohere Rerank
    try:
        # Prepare documents with structured data for better ranking
        # Format as YAML-like strings for optimal rerank performance
        # Use larger content window (8000 chars) for reranking to capture more context
        # Command-A model supports 256K context so we can be generous
        RERANK_CONTENT_LIMIT = 8000
        GENERATION_CONTENT_LIMIT = 12000  # Even more for generation

        documents_for_rerank = []
        for r in search_results:
            doc_text = f"title: {r[1]}\ncategory: {r[3]}\ncontent: {r[2][:RERANK_CONTENT_LIMIT]}"
            documents_for_rerank.append({
                "id": str(r[0]),
                "title": r[1],
                "content": r[2][:GENERATION_CONTENT_LIMIT],  # Store more for generation
                "category": r[3],
                "rerank_text": doc_text
            })

        # Use rerank-v3.5 for best performance
        rerank_response = co.rerank(
            query=query,
            documents=[d["rerank_text"] for d in documents_for_rerank],
            top_n=5,  # Get top 5 for better coverage
            model="rerank-v3.5",
            return_documents=False  # We already have the docs
        )

        # Get top reranked results with their relevance scores
        top_docs = []
        for result in rerank_response.results[:3]:  # Take top 3 for response
            doc = documents_for_rerank[result.index]
            # Cohere rerank returns scores between 0 and 1
            # Higher is more relevant
            relevance = float(result.relevance_score)
            top_docs.append({
                "id": doc["id"],
                "title": doc["title"],
                "content": doc["content"],
                "category": doc["category"],
                "relevance_score": relevance
            })

        rerank_tokens = len(query.split()) * 10  # Estimate
        total_tokens += rerank_tokens
        total_cost += rerank_tokens * 0.000002  # $2/1M searches for rerank-v3.5

    except Exception as e:
        # Fallback: use vector search results with distance-to-similarity conversion
        # Cosine distance ranges from 0 (identical) to 2 (opposite)
        # Convert to similarity score: 1 - (distance / 2) gives 0-1 range
        GENERATION_CONTENT_LIMIT = 12000  # Match the limit above
        top_docs = []
        for r in search_results[:3]:
            distance = float(r[4])
            # More nuanced conversion: use exponential decay for better spread
            # This gives higher scores to closer matches
            similarity = max(0.0, min(1.0, 1.0 / (1.0 + distance)))
            top_docs.append({
                "id": str(r[0]),
                "title": r[1],
                "content": r[2][:GENERATION_CONTENT_LIMIT],
                "category": r[3],
                "relevance_score": similarity
            })

    # Step 4: Generate answer with adaptive model selection
    # High relevance = simple lookup (command-r), Low relevance = needs reasoning (command-a)
    try:
        # Format context for generation
        context_docs = []
        for i, doc in enumerate(top_docs):
            context_docs.append({
                "id": doc["id"],
                "data": {
                    "title": doc["title"],
                    "content": doc["content"],
                    "category": doc["category"]
                }
            })

        # Adaptive model selection based on rerank scores
        # High relevance (>0.7) = docs clearly answer the question, use cheaper model
        # Low relevance (≤0.7) = needs more reasoning to synthesize, use powerful model
        avg_relevance = sum(d["relevance_score"] for d in top_docs) / len(top_docs) if top_docs else 0
        top_relevance = top_docs[0]["relevance_score"] if top_docs else 0

        # Use top result's relevance as primary signal (most important match)
        # Threshold: 0.7 balances cost savings vs quality
        RELEVANCE_THRESHOLD = 0.7
        use_powerful_model = top_relevance <= RELEVANCE_THRESHOLD

        selected_model = "command-a-03-2025" if use_powerful_model else "command-r-08-2024"

        # Use chat with documents for RAG
        chat_response = co.chat(
            model=selected_model,
            messages=[
                {
                    "role": "user",
                    "content": query
                }
            ],
            documents=context_docs
        )

        answer = chat_response.message.content[0].text

        # Extract citations if available
        citations = []
        if hasattr(chat_response.message, 'citations') and chat_response.message.citations:
            for citation in chat_response.message.citations:
                citations.append({
                    "start": citation.start,
                    "end": citation.end,
                    "document_ids": citation.sources if hasattr(citation, 'sources') else []
                })

        # Estimate token usage - pricing varies by model
        gen_input_tokens = len(query.split()) + sum(len(d["content"].split()) for d in top_docs)
        gen_output_tokens = len(answer.split())
        total_tokens += gen_input_tokens + gen_output_tokens

        # Cost calculation based on selected model
        if selected_model == "command-a-03-2025":
            # Command A: $2.50/1M input, $10/1M output
            total_cost += gen_input_tokens * 0.0000025 + gen_output_tokens * 0.00001
        else:
            # Command R 08-2024: $0.15/1M input, $0.60/1M output (much cheaper)
            total_cost += gen_input_tokens * 0.00000015 + gen_output_tokens * 0.0000006

        # Calculate confidence based on relevance scores
        # Weight top result more heavily (50% top, 30% second, 20% third)
        if top_docs:
            weights = [0.5, 0.3, 0.2]
            weighted_sum = sum(
                d["relevance_score"] * weights[i]
                for i, d in enumerate(top_docs[:len(weights)])
            )
            # Normalize if we have fewer than 3 docs
            total_weight = sum(weights[:len(top_docs)])
            confidence = weighted_sum / total_weight if total_weight > 0 else 0.0
        else:
            confidence = 0.0

    except Exception as e:
        raise RuntimeError(f"Cohere generation error: {str(e)}")

    # Format sources for response (id is UUID string now)
    sources = [
        {
            "id": doc["id"],
            "title": doc["title"],
            "category": doc["category"],
            "relevance": round(doc["relevance_score"], 3)
        }
        for doc in top_docs
    ]

    # Step 5: Store conversation history (tenant-scoped)
    _store_conversation(cursor, conn, tenant_id, session_id, user_id, query, answer, sources)

    # Log API usage (tenant-scoped for billing)
    # Only cast user_id to UUID if it's valid, otherwise use NULL
    valid_user_id = user_id if is_valid_uuid(user_id) else None
    cursor.execute("""
        INSERT INTO ai_usage (tenant_id, user_id, operation, model, input_tokens, output_tokens, cost_usd)
        VALUES (%s::uuid, %s, 'generate', %s, %s, %s, %s)
    """, (tenant_id, valid_user_id, selected_model, gen_input_tokens, gen_output_tokens, total_cost))

    # Log model selection for analytics and threshold tuning
    latency_ms = int((time.time() - start_time) * 1000)
    selection_reason = "high_relevance" if not use_powerful_model else "low_relevance"

    try:
        cursor.execute("""
            INSERT INTO model_usage (
                session_id, query_length, model_selected, selection_reason,
                top_relevance, avg_relevance, response_tokens, latency_ms
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            session_id,
            len(query.split()),
            selected_model,
            selection_reason,
            top_relevance,
            avg_relevance,
            gen_output_tokens,
            latency_ms
        ))
    except psycopg2.Error:
        # Table might not exist yet, skip logging
        pass

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "answer": answer,
        "sources": sources,
        "confidence": round(confidence, 3),
        "session_id": session_id,
        "tenant_id": tenant_id,
        "model_used": selected_model,
        "top_relevance": round(top_relevance, 3),
        "latency_ms": latency_ms
    }


def _store_conversation(cursor, conn, tenant_id: str, session_id: str, user_id: Optional[str],
                        query: str, answer: str, sources: list):
    """Store user query and assistant response in conversation history (tenant-scoped)."""
    # Validate user_id - only use if it's a valid UUID, otherwise NULL
    # This handles legacy tokens that may have integer IDs from family_members table
    valid_user_id = user_id if is_valid_uuid(user_id) else None

    # Ensure chat session exists for this tenant
    cursor.execute("""
        INSERT INTO chat_sessions (id, tenant_id, user_id, title)
        VALUES (%s::uuid, %s::uuid, %s, %s)
        ON CONFLICT (id) DO NOTHING
    """, (session_id, tenant_id, valid_user_id, query[:100] if query else "New Chat"))

    # Store user message
    cursor.execute("""
        INSERT INTO chat_messages (session_id, role, content)
        VALUES (%s::uuid, 'user', %s)
    """, (session_id, query))

    # Store assistant response with sources
    cursor.execute("""
        INSERT INTO chat_messages (session_id, role, content, sources)
        VALUES (%s::uuid, 'assistant', %s, %s)
    """, (session_id, answer, json.dumps(sources)))

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
RAG (Retrieval-Augmented Generation) query pipeline for Family Second Brain.

This script implements the complete RAG workflow:
1. Embed user query using Cohere
2. Vector search in PostgreSQL/pgvector for relevant documents
3. Rerank results using Cohere Rerank
4. Generate answer using Cohere Command-R with context
5. Store conversation history

Args:
    query (str): User's natural language question
    session_id (str, optional): Conversation session ID (auto-generated if not provided)
    user_email (str, optional): User identifier for conversation history

Returns:
    dict: {
        answer: str,
        sources: list[{id, title, category, relevance}],
        confidence: float,
        session_id: str
    }

Example:
    result = await f.chatbot.rag_query(
        query="What's the recipe for grandma's apple pie?",
        session_id="user-123-session"
    )
"""

import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
import uuid
import json
from typing import Optional
import wmill


def main(
    query: str,
    session_id: Optional[str] = None,
    user_email: Optional[str] = None,
) -> dict:
    """
    Execute RAG pipeline: embed query -> search -> rerank -> generate -> store
    """
    # Validate input
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    query = query.strip()

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

    # Step 1: Embed the query
    try:
        embed_response = co.embed(
            texts=[query],
            model="embed-english-v3.0",
            input_type="search_query",
            embedding_types=["float"]
        )
        query_embedding = embed_response.embeddings.float_[0]
        embed_tokens = embed_response.meta.billed_units.input_tokens if embed_response.meta and embed_response.meta.billed_units else len(query.split())
        total_tokens += embed_tokens
        total_cost += embed_tokens * 0.0000001  # $0.10/1M tokens
    except cohere.errors.CohereAPIError as e:
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

        # Search for top 10 similar documents
        cursor.execute("""
            SELECT id, title, content, category, embedding <=> %s::vector AS distance
            FROM family_documents
            ORDER BY distance
            LIMIT 10
        """, (query_embedding,))

        search_results = cursor.fetchall()

    except psycopg2.Error as e:
        raise RuntimeError(f"Database search error: {str(e)}")

    # Handle no results
    if not search_results:
        answer = "I couldn't find any relevant information in the family knowledge base. Try rephrasing your question or adding more documents."
        sources = []
        confidence = 0.0

        # Store conversation
        _store_conversation(cursor, conn, session_id, user_email, query, answer, sources)

        return {
            "answer": answer,
            "sources": sources,
            "confidence": confidence,
            "session_id": session_id
        }

    # Step 3: Rerank results using Cohere Rerank
    try:
        documents_for_rerank = [
            {"id": str(r[0]), "title": r[1], "content": r[2][:2000], "category": r[3]}
            for r in search_results
        ]

        rerank_response = co.rerank(
            query=query,
            documents=[d["content"] for d in documents_for_rerank],
            top_n=3,
            model="rerank-english-v3.0"
        )

        # Get top 3 reranked results
        top_docs = []
        for result in rerank_response.results:
            doc = documents_for_rerank[result.index]
            top_docs.append({
                "id": doc["id"],
                "title": doc["title"],
                "content": doc["content"],
                "category": doc["category"],
                "relevance_score": result.relevance_score
            })

        rerank_tokens = len(query.split()) * 10  # Estimate
        total_tokens += rerank_tokens
        total_cost += rerank_tokens * 0.000001  # $1/1M tokens for rerank

    except cohere.errors.CohereAPIError as e:
        # Fallback: use top 3 from vector search without reranking
        top_docs = [
            {
                "id": str(r[0]),
                "title": r[1],
                "content": r[2][:2000],
                "category": r[3],
                "relevance_score": 1.0 - r[4]  # Convert distance to similarity
            }
            for r in search_results[:3]
        ]

    # Step 4: Generate answer using Cohere Command-R
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

        # Use chat with documents for RAG
        chat_response = co.chat(
            model="command-r",
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

        # Estimate token usage
        gen_input_tokens = len(query.split()) + sum(len(d["content"].split()) for d in top_docs)
        gen_output_tokens = len(answer.split())
        total_tokens += gen_input_tokens + gen_output_tokens
        total_cost += gen_input_tokens * 0.0000000375 + gen_output_tokens * 0.00000015  # Command-R pricing

        # Calculate confidence based on relevance scores
        confidence = sum(d["relevance_score"] for d in top_docs) / len(top_docs) if top_docs else 0.0

    except cohere.errors.CohereAPIError as e:
        raise RuntimeError(f"Cohere generation error: {str(e)}")

    # Format sources for response
    sources = [
        {
            "id": int(doc["id"]),
            "title": doc["title"],
            "category": doc["category"],
            "relevance": round(doc["relevance_score"], 3)
        }
        for doc in top_docs
    ]

    # Step 5: Store conversation history
    _store_conversation(cursor, conn, session_id, user_email, query, answer, sources)

    # Log API usage
    cursor.execute("""
        INSERT INTO api_usage_log (operation, tokens_used, cost_usd)
        VALUES ('rag_query', %s, %s)
    """, (total_tokens, total_cost))

    conn.commit()
    cursor.close()
    conn.close()

    return {
        "answer": answer,
        "sources": sources,
        "confidence": round(confidence, 3),
        "session_id": session_id
    }


def _store_conversation(cursor, conn, session_id: str, user_email: Optional[str],
                        query: str, answer: str, sources: list):
    """Store user query and assistant response in conversation history."""
    # Store user message
    cursor.execute("""
        INSERT INTO conversations (session_id, role, content, user_email)
        VALUES (%s, 'user', %s, %s)
    """, (session_id, query, user_email))

    # Store assistant response with sources
    cursor.execute("""
        INSERT INTO conversations (session_id, role, content, sources, user_email)
        VALUES (%s, 'assistant', %s, %s, %s)
    """, (session_id, answer, json.dumps(sources), user_email))

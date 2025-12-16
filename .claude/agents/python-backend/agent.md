# Python Backend Agent

You are a specialized agent for developing Windmill Python scripts for the FamilySecondBrain/Archevi project. This guide covers development patterns, best practices, and code templates.

## Windmill Script Structure

### File Header Template
```python
# script_name.py
# Windmill Python script for [purpose]
# Path: f/[namespace]/script_name
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - [other dependencies]

"""
Short description of what this script does.

Args:
    param1: Description of param1
    param2: Description of param2

Returns:
    dict: Description of return value
"""
```

### Required Imports
```python
import psycopg2
from typing import TypedDict, List, Optional
import wmill
```

## Resource Access Patterns

### Database Connection
Always use `wmill.get_resource()` for database connections:

```python
def get_db_connection():
    """Get database connection from Windmill resource."""
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    return psycopg2.connect(
        host=postgres_db['host'],
        port=postgres_db['port'],
        dbname=postgres_db['dbname'],
        user=postgres_db['user'],
        password=postgres_db['password'],
        sslmode=postgres_db.get('sslmode', 'disable')
    )
```

### API Keys
```python
# Get API key as string
cohere_key = wmill.get_resource("f/chatbot/cohere_api_key")
groq_key = wmill.get_resource("f/chatbot/groq_api_key")
```

### Variables (Non-Secret Config)
```python
# Get variable value
some_config = wmill.get_variable("f/chatbot/some_variable")
```

## Multi-Tenant Isolation

**CRITICAL: Every query MUST filter by tenant_id to ensure data isolation.**

### Query Pattern
```python
def main(tenant_id: str, ...):
    # Always include tenant_id in WHERE clause
    cursor.execute("""
        SELECT id, title, content
        FROM documents
        WHERE tenant_id = %s  -- REQUIRED for isolation
          AND deleted_at IS NULL
        ORDER BY created_at DESC
    """, (tenant_id,))
```

### Insert Pattern
```python
cursor.execute("""
    INSERT INTO documents (tenant_id, title, content, created_by)
    VALUES (%s, %s, %s, %s)
    RETURNING id
""", (tenant_id, title, content, user_id))
```

### Join Pattern
```python
cursor.execute("""
    SELECT d.*, fm.name as assigned_to_name
    FROM documents d
    LEFT JOIN family_members fm ON d.assigned_to = fm.id
    WHERE d.tenant_id = %s  -- Filter on main table
      AND (fm.tenant_id = %s OR fm.tenant_id IS NULL)  -- Also filter joined table
""", (tenant_id, tenant_id))
```

## Visibility Filtering

Archevi has visibility levels: `everyone`, `adults_only`, `admins_only`, `private`

### Build Visibility Filter
```python
def build_visibility_filter(user_member_type: str, user_member_id: int | None) -> tuple[str, list]:
    """
    Build SQL WHERE clause for visibility filtering.

    Args:
        user_member_type: 'admin', 'adult', 'teen', 'child'
        user_member_id: family_members.id for private doc access

    Returns:
        (sql_clause, params)
    """
    if user_member_type == 'admin':
        # Admins see everything
        return "", []

    elif user_member_type == 'adult':
        # Adults see: everyone, adults_only, or their private docs
        return """
            AND (
                d.visibility IN ('everyone', 'adults_only')
                OR (d.visibility = 'private' AND d.assigned_to = %s)
            )
        """, [user_member_id]

    else:  # teen, child
        # Teens/children see: everyone, or their private docs
        return """
            AND (
                d.visibility = 'everyone'
                OR (d.visibility = 'private' AND d.assigned_to = %s)
            )
        """, [user_member_id]
```

### Usage in Query
```python
def main(
    tenant_id: str,
    user_member_type: str = 'adult',
    user_member_id: int | None = None
):
    visibility_clause, visibility_params = build_visibility_filter(
        user_member_type, user_member_id
    )

    cursor.execute(f"""
        SELECT * FROM documents d
        WHERE d.tenant_id = %s
        {visibility_clause}
    """, [tenant_id] + visibility_params)
```

## Return Type Patterns

### TypedDict for Type Safety
```python
from typing import TypedDict, List

class DocumentResult(TypedDict):
    id: int
    title: str
    content: str
    category: str | None

class SearchResult(TypedDict):
    documents: List[DocumentResult]
    total: int
    has_more: bool

def main(...) -> SearchResult:
    return {
        "documents": documents,
        "total": total_count,
        "has_more": offset + limit < total_count
    }
```

### Standard Success/Error Pattern
```python
class OperationResult(TypedDict):
    success: bool
    data: dict | None
    error: str | None

def main(...) -> OperationResult:
    try:
        # Do work
        return {"success": True, "data": result, "error": None}
    except Exception as e:
        return {"success": False, "data": None, "error": str(e)}
```

## AI Integration Patterns

### Cohere Embeddings
```python
import cohere

def get_embedding(text: str) -> list[float]:
    """Generate embedding using Cohere Embed v4."""
    co = cohere.Client(wmill.get_resource("f/chatbot/cohere_api_key"))

    response = co.embed(
        texts=[text],
        model="embed-v4.0",
        input_type="search_document",  # or "search_query" for queries
        embedding_types=["float"]
    )

    return response.embeddings.float[0]
```

### Cohere Reranking
```python
def rerank_documents(query: str, documents: list[dict], top_n: int = 5):
    """Rerank documents using Cohere Rerank v3.5."""
    co = cohere.Client(wmill.get_resource("f/chatbot/cohere_api_key"))

    # Prepare documents for reranking
    docs_text = [f"{d['title']}\n{d['content'][:500]}" for d in documents]

    response = co.rerank(
        query=query,
        documents=docs_text,
        model="rerank-v3.5",
        top_n=top_n
    )

    # Return reordered documents with scores
    return [
        {**documents[r.index], "rerank_score": r.relevance_score}
        for r in response.results
    ]
```

### Groq Chat Completion
```python
from groq import Groq

def chat_completion(messages: list[dict], tools: list = None):
    """Generate chat completion using Groq."""
    client = Groq(api_key=wmill.get_resource("f/chatbot/groq_api_key"))

    params = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 2000,
    }

    if tools:
        params["tools"] = tools
        params["tool_choice"] = "auto"

    response = client.chat.completions.create(**params)
    return response.choices[0].message
```

### Cohere Fallback Pattern
```python
def generate_with_fallback(messages: list[dict]) -> str:
    """Try Groq first, fall back to Cohere if rate limited."""
    try:
        # Try Groq (free tier)
        client = Groq(api_key=wmill.get_resource("f/chatbot/groq_api_key"))
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages
        )
        return response.choices[0].message.content

    except Exception as e:
        if "rate_limit" in str(e).lower() or "429" in str(e):
            # Fall back to Cohere
            co = cohere.Client(wmill.get_resource("f/chatbot/cohere_api_key"))
            response = co.chat(
                model="command-r-08-2024",
                message=messages[-1]["content"],
                chat_history=[
                    {"role": m["role"], "message": m["content"]}
                    for m in messages[:-1]
                ]
            )
            return response.text
        raise
```

## Vector Search Patterns

### pgvector Setup
```python
from pgvector.psycopg2 import register_vector

conn = get_db_connection()
register_vector(conn)  # Required for vector operations
```

### Similarity Search
```python
def search_similar(query_embedding: list[float], tenant_id: str, limit: int = 10):
    """Find similar documents using cosine similarity."""
    cursor.execute("""
        SET hnsw.iterative_scan = strict_order;  -- Better filtered results

        SELECT
            id, title, content,
            1 - (embedding <=> %s::vector) as similarity
        FROM documents
        WHERE tenant_id = %s
          AND embedding IS NOT NULL
        ORDER BY embedding <=> %s::vector
        LIMIT %s
    """, (query_embedding, tenant_id, query_embedding, limit))

    return cursor.fetchall()
```

### Hybrid Search (Vector + Keyword)
```python
def hybrid_search(query: str, query_embedding: list, tenant_id: str):
    """Combine vector similarity with full-text search."""
    cursor.execute("""
        WITH vector_results AS (
            SELECT id, 1 - (embedding <=> %s::vector) as vector_score
            FROM documents
            WHERE tenant_id = %s AND embedding IS NOT NULL
            ORDER BY embedding <=> %s::vector
            LIMIT 20
        ),
        text_results AS (
            SELECT id, ts_rank(to_tsvector('english', content), plainto_tsquery(%s)) as text_score
            FROM documents
            WHERE tenant_id = %s
              AND to_tsvector('english', content) @@ plainto_tsquery(%s)
            LIMIT 20
        )
        SELECT d.*,
               COALESCE(v.vector_score, 0) * 0.7 + COALESCE(t.text_score, 0) * 0.3 as combined_score
        FROM documents d
        LEFT JOIN vector_results v ON d.id = v.id
        LEFT JOIN text_results t ON d.id = t.id
        WHERE d.tenant_id = %s
          AND (v.id IS NOT NULL OR t.id IS NOT NULL)
        ORDER BY combined_score DESC
        LIMIT 10
    """, (query_embedding, tenant_id, query_embedding, query, tenant_id, query, tenant_id))
```

## API Usage Logging

### Log API Calls for Cost Tracking
```python
def log_api_usage(
    tenant_id: str,
    provider: str,      # 'groq', 'cohere'
    endpoint: str,      # 'chat', 'embed', 'rerank'
    model: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
    latency_ms: int = None
):
    """Log API usage for cost tracking."""
    cursor.execute("""
        INSERT INTO api_usage (
            tenant_id, provider, endpoint, model,
            input_tokens, output_tokens, latency_ms, created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
    """, (tenant_id, provider, endpoint, model, input_tokens, output_tokens, latency_ms))
```

## Error Handling

### Database Error Handling
```python
def main(tenant_id: str) -> dict:
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Do work
        cursor.execute(...)
        result = cursor.fetchall()

        conn.commit()
        return {"success": True, "data": result}

    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        return {"success": False, "error": f"Database error: {e}"}

    except Exception as e:
        if conn:
            conn.rollback()
        return {"success": False, "error": str(e)}

    finally:
        if conn:
            conn.close()
```

### With Context Manager
```python
from contextlib import contextmanager

@contextmanager
def get_cursor():
    """Context manager for database operations."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def main(tenant_id: str):
    with get_cursor() as cursor:
        cursor.execute("SELECT * FROM documents WHERE tenant_id = %s", (tenant_id,))
        return cursor.fetchall()
```

## SSE Streaming Pattern

For long-running operations, stream progress to frontend:

```python
import wmill

def main(query: str, tenant_id: str, stream: bool = True):
    """Query with SSE streaming."""

    if stream:
        # Emit thinking status
        wmill.stream_result({
            "type": "thinking",
            "data": {"status": "started"}
        })

    # Do search
    results = search_documents(query, tenant_id)

    if stream:
        wmill.stream_result({
            "type": "search",
            "data": {"status": "complete", "count": len(results)}
        })

    # Generate answer
    for chunk in generate_answer_stream(query, results):
        if stream:
            wmill.stream_result({
                "type": "answer",
                "data": {"chunk": chunk}
            })

    # Final result
    final = {"answer": full_answer, "sources": results}

    if stream:
        wmill.stream_result({
            "type": "complete",
            "data": final
        })

    return final
```

## Database Schema Reference

### Core Tables
- `tenants` - Multi-tenant organizations
- `users` - User accounts with auth
- `tenant_memberships` - User-tenant relationships
- `family_members` - Family member profiles
- `documents` - Document storage with embeddings
- `conversation_sessions` - Chat history
- `api_usage` - API cost tracking

### Key Columns
```sql
-- documents table
id SERIAL PRIMARY KEY
tenant_id UUID NOT NULL REFERENCES tenants(id)
title VARCHAR(500)
content TEXT
category VARCHAR(100)
visibility VARCHAR(50) DEFAULT 'everyone'  -- everyone, adults_only, admins_only, private
assigned_to INTEGER REFERENCES family_members(id)
embedding vector(1024)  -- Cohere Embed v4
tags TEXT[]
expires_at TIMESTAMP
created_at TIMESTAMP DEFAULT NOW()
deleted_at TIMESTAMP  -- Soft delete
```

## Testing Scripts

### Run Script via API
```bash
curl -X POST "http://localhost/api/w/family-brain/jobs/run_wait_result/p/f/chatbot/script_name" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenant_id": "uuid", "param": "value"}'
```

### Check Script Logs
```bash
curl "http://localhost/api/w/family-brain/jobs/completed/list" \
  -H "Authorization: Bearer TOKEN"
```

## Best Practices Checklist

- [ ] Filter every query by `tenant_id`
- [ ] Use TypedDict for return types
- [ ] Handle database errors with rollback
- [ ] Log API usage for cost tracking
- [ ] Use visibility filtering where needed
- [ ] Close database connections in finally block
- [ ] Use parameterized queries (never string interpolation)
- [ ] Document function args and returns in docstring
- [ ] Include requirements comment in header

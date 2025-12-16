# rag_query_agent.py
# Windmill Python script - AI Agent with tool calling for RAG
# Path: f/chatbot/rag_query_agent
#
# requirements:
#   - groq
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - wmill

"""
AI Agent-style RAG query using Groq with tool calling.

This provides an AI Agent experience where:
1. The AI can decide when to search documents
2. Tool calling is used instead of hardcoded pipeline
3. Uses Groq free tier (Llama 3.3 70B)
4. Streams results via SSE for real-time UI updates

Benefits over rag_query.py:
- AI decides when/what to search (more natural)
- Can handle follow-up questions without search
- Supports multi-turn conversation
- SSE streaming for progressive UI rendering

Args:
    user_message: The user's question
    tenant_id: UUID for data isolation
    session_id: Optional session for conversation continuity
    conversation_history: Optional list of prior messages
    user_member_type: For visibility filtering
    user_member_id: For private doc access
    stream: Whether to stream events (default True)

Returns:
    dict: {answer, sources, tool_calls, session_id, tenant_id}

When stream=True, also emits SSE events:
    - {type: "thinking", data: {status: "started"}}
    - {type: "search", data: {query, status: "started"|"complete", results}}
    - {type: "answer", data: {chunk}} - streamed answer chunks
    - {type: "complete", data: {full response}}
"""

import json
import uuid
import time
from typing import Optional, Generator
import wmill
from groq import Groq
import cohere
import psycopg2
from pgvector.psycopg2 import register_vector


def log_api_usage_direct(
    tenant_id: str,
    provider: str,
    endpoint: str,
    model: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
    latency_ms: int = None,
    success: bool = True,
    operation: str = None
):
    """Log API usage directly to PostgreSQL. Fire-and-forget - errors are silently ignored."""
    try:
        postgres_db = wmill.get_resource("f/chatbot/postgres_db")
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        cursor = conn.cursor()

        # Pricing (cents per million tokens)
        PRICING = {
            'groq': {
                'llama-3.3-70b-versatile': {'input': 59, 'output': 79},
                'llama-4-scout-17b-16e-instruct': {'input': 11, 'output': 34},
                'llama-4-maverick-17b-128e-instruct': {'input': 50, 'output': 77},
            },
            'cohere': {
                'embed-v4.0': {'input': 10, 'output': 0},
                'rerank-v3.5': {'per_request': 2},  # 0.2 cents
                'command-r-08-2024': {'input': 150, 'output': 600},
                'command-a-03-2025': {'input': 250, 'output': 1000},
                'command-r-plus-08-2024': {'input': 250, 'output': 1000},
            }
        }

        # Calculate cost
        cost_cents = 0
        if provider in PRICING and model in PRICING[provider]:
            pricing = PRICING[provider][model]
            if 'per_request' in pricing:
                cost_cents = pricing['per_request']
            else:
                cost_cents = int(
                    (input_tokens / 1_000_000) * pricing.get('input', 0) * 100 +
                    (output_tokens / 1_000_000) * pricing.get('output', 0) * 100
                )

        cursor.execute("""
            INSERT INTO api_usage (
                tenant_id, provider, endpoint, model,
                input_tokens, output_tokens, cost_cents,
                latency_ms, success, operation
            ) VALUES (
                %s::uuid, %s, %s, %s,
                %s, %s, %s,
                %s, %s, %s
            )
        """, (
            tenant_id, provider, endpoint, model,
            input_tokens, output_tokens, cost_cents,
            latency_ms, success, operation
        ))

        conn.commit()
        cursor.close()
        conn.close()
    except Exception:
        pass  # Fire-and-forget - don't let logging failures affect the main flow


def log_api_usage(
    tenant_id: str,
    provider: str,
    endpoint: str,
    model: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
    latency_ms: int = None,
    success: bool = True,
    operation: str = None,
    error_message: str = None
):
    """Wrapper for API usage logging."""
    log_api_usage_direct(
        tenant_id=tenant_id,
        provider=provider,
        endpoint=endpoint,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        latency_ms=latency_ms,
        success=success,
        operation=operation
    )


def stream_event(event_type: str, data: dict) -> str:
    """Format an SSE event for streaming.

    Args:
        event_type: Type of event (thinking, search, answer, complete, error)
        data: Event payload

    Returns:
        JSON string for wmill.stream_result()
    """
    return json.dumps({"type": event_type, "data": data})


def format_extracted_data_for_ai(extracted_data: dict) -> str:
    """Format extracted data into a structured text block for AI context.

    Prioritizes high-importance items and key data to help the AI give precise answers.

    Args:
        extracted_data: The extracted_data JSONB field from the document

    Returns:
        Formatted string with key data prominently displayed, or empty string if no data
    """
    if not extracted_data or not isinstance(extracted_data, dict):
        return ""

    parts = []

    # V2 format detection (has 'items' array)
    if 'items' in extracted_data and isinstance(extracted_data.get('items'), list):
        # Document type and summary
        if extracted_data.get('document_type'):
            parts.append(f"Document Type: {extracted_data['document_type']}")
        if extracted_data.get('summary'):
            parts.append(f"Summary: {extracted_data['summary']}")

        # High importance items first
        high_importance = extracted_data.get('high_importance', [])
        if high_importance:
            parts.append("KEY DATA (High Importance):")
            for item in high_importance:
                if isinstance(item, dict) and item.get('label') and item.get('value'):
                    parts.append(f"  - {item['label']}: {item['value']}")

        # Key categories
        for category, label in [
            ('key_dates', 'Important Dates'),
            ('key_amounts', 'Important Amounts'),
            ('key_people', 'People'),
            ('key_organizations', 'Organizations'),
            ('key_references', 'Reference Numbers')
        ]:
            items = extracted_data.get(category, [])
            if items:
                parts.append(f"{label}:")
                for item in items:
                    if isinstance(item, dict) and item.get('label') and item.get('value'):
                        parts.append(f"  - {item['label']}: {item['value']}")

    else:
        # V1 format - legacy category-specific fields
        # Only include non-null values
        for key, value in extracted_data.items():
            if value is not None and value != '' and value != 'null':
                if isinstance(value, list):
                    filtered = [v for v in value if v is not None and v != '' and v != 'null']
                    if filtered:
                        parts.append(f"{key.replace('_', ' ').title()}: {', '.join(str(v) for v in filtered)}")
                else:
                    parts.append(f"{key.replace('_', ' ').title()}: {value}")

    if not parts:
        return ""

    return "\n--- EXTRACTED KEY DATA ---\n" + "\n".join(parts) + "\n--- END KEY DATA ---\n"


class RateLimitExhausted(Exception):
    """Raised when Groq rate limit retries are exhausted."""
    pass


class TenantRateLimitExceeded(Exception):
    """Raised when tenant has exceeded their rate limit."""
    def __init__(self, message: str, retry_after: int, limit: int, window: int):
        super().__init__(message)
        self.retry_after = retry_after
        self.limit = limit
        self.window = window


def check_rate_limit(
    conn,
    tenant_id: str,
    endpoint: str = "rag_query",
    max_requests: int = 30,
    window_seconds: int = 60
) -> tuple[bool, int, int]:
    """
    Check and update rate limit for a tenant.

    Uses a fixed window rate limiting strategy with PostgreSQL for persistence.

    Args:
        conn: PostgreSQL connection
        tenant_id: UUID of the tenant
        endpoint: Name of the endpoint being rate limited
        max_requests: Maximum requests allowed per window
        window_seconds: Window duration in seconds

    Returns:
        tuple: (allowed: bool, remaining: int, retry_after: int)
    """
    from datetime import datetime, timedelta

    cursor = conn.cursor()

    # Calculate current window start (truncate to window boundary)
    now = datetime.utcnow()
    window_start = now.replace(
        second=(now.second // window_seconds) * window_seconds,
        microsecond=0
    )

    # Upsert: increment counter or create new record
    cursor.execute("""
        INSERT INTO rate_limits (tenant_id, endpoint, window_start, request_count)
        VALUES (%s, %s, %s, 1)
        ON CONFLICT (tenant_id, endpoint, window_start)
        DO UPDATE SET request_count = rate_limits.request_count + 1
        RETURNING request_count
    """, (tenant_id, endpoint, window_start))

    result = cursor.fetchone()
    current_count = result[0] if result else 1
    conn.commit()

    # Calculate remaining and retry_after
    remaining = max(0, max_requests - current_count)

    if current_count > max_requests:
        # Calculate seconds until window resets
        window_end = window_start + timedelta(seconds=window_seconds)
        retry_after = int((window_end - now).total_seconds())
        cursor.close()
        return False, 0, max(1, retry_after)

    cursor.close()
    return True, remaining, 0


def cleanup_old_rate_limits(conn, hours: int = 24):
    """Remove rate limit records older than specified hours."""
    from datetime import datetime, timedelta

    cursor = conn.cursor()
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    cursor.execute(
        "DELETE FROM rate_limits WHERE window_start < %s",
        (cutoff,)
    )
    deleted = cursor.rowcount
    conn.commit()
    cursor.close()
    return deleted


# Rate limit tiers per plan (requests per minute)
PLAN_RATE_LIMITS = {
    'trial': 15,           # Limited trial: 15 req/min
    'starter': 30,         # Basic plan: 30 req/min
    'family': 60,          # Family plan: 60 req/min
    'family_office': 120,  # Premium plan: 120 req/min
}


# Available models for user selection
AVAILABLE_MODELS = {
    'groq': {
        'llama-3.3-70b-versatile': {
            'name': 'Llama 3.3 70B',
            'description': 'Fast, versatile, great for most queries',
            'context_length': 128000,
            'supports_tools': True,
            'multimodal': False,
        },
        'llama-4-scout-17b-16e-instruct': {
            'name': 'Llama 4 Scout',
            'description': 'Multimodal with image understanding, 128K context',
            'context_length': 128000,
            'supports_tools': True,
            'multimodal': True,
        },
        'llama-4-maverick-17b-128e-instruct': {
            'name': 'Llama 4 Maverick',
            'description': 'Larger MoE, better reasoning',
            'context_length': 128000,
            'supports_tools': True,
            'multimodal': True,
        },
    },
    'cohere': {
        'command-a-03-2025': {
            'name': 'Command A',
            'description': 'Most performant, 256K context, great tool use',
            'context_length': 256000,
            'supports_tools': True,
            'multimodal': False,
        },
        'command-r-plus-08-2024': {
            'name': 'Command R+',
            'description': 'Good balance of speed and quality',
            'context_length': 128000,
            'supports_tools': True,
            'multimodal': False,
        },
        'command-r-08-2024': {
            'name': 'Command R',
            'description': 'Fast and efficient for simpler queries',
            'context_length': 128000,
            'supports_tools': False,
            'multimodal': False,
        },
    }
}

# Default model
DEFAULT_MODEL = 'llama-3.3-70b-versatile'
DEFAULT_PROVIDER = 'groq'


def get_model_provider(model_id: str) -> tuple[str, str]:
    """Get the provider for a model ID. Returns (provider, model_id) or defaults."""
    for provider, models in AVAILABLE_MODELS.items():
        if model_id in models:
            return provider, model_id
    # Return default if not found
    return DEFAULT_PROVIDER, DEFAULT_MODEL


def get_tenant_rate_limit(conn, tenant_id: str) -> tuple[int, str]:
    """
    Get rate limit for a tenant based on their plan.

    Args:
        conn: PostgreSQL connection
        tenant_id: UUID of the tenant

    Returns:
        tuple: (max_requests_per_minute: int, plan_name: str)
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT plan, status FROM tenants WHERE id = %s
    """, (tenant_id,))

    result = cursor.fetchone()
    cursor.close()

    if not result:
        # Unknown tenant - use trial limits
        return PLAN_RATE_LIMITS['trial'], 'unknown'

    plan, status = result

    # Suspended tenants get very limited access
    if status == 'suspended':
        return 5, 'suspended'

    # Get plan-specific limit (default to trial if plan unknown)
    limit = PLAN_RATE_LIMITS.get(plan, PLAN_RATE_LIMITS['trial'])
    return limit, plan


def call_groq_with_retry(client, max_retries: int = 3, **kwargs):
    """Call Groq API with automatic retry and exponential backoff for rate limits.

    Raises RateLimitExhausted if all retries fail due to rate limits,
    allowing caller to fall back to Cohere.
    """
    last_error = None

    for attempt in range(max_retries):
        try:
            return client.chat.completions.create(**kwargs)
        except Exception as e:
            error_msg = str(e).lower()
            last_error = e

            # Check if it's a rate limit error
            if "rate_limit" in error_msg or "429" in error_msg:
                if attempt < max_retries - 1:
                    # Exponential backoff: 2s, 4s, 8s
                    wait_time = 2 ** (attempt + 1)
                    time.sleep(wait_time)
                    continue
                # Exhausted retries due to rate limit - signal for fallback
                raise RateLimitExhausted(f"Groq rate limited after {max_retries} retries")
            # For other errors, don't retry
            raise

    # If we exhausted retries, raise the last error
    raise last_error


def generate_with_model(
    groq_client,
    cohere_client,
    messages: list,
    model_id: str = None,
    tenant_id: str = None,
    use_tools: bool = False,
    search_tool: dict = None,
    tools: list = None
) -> tuple[str, str, list]:
    """
    Generate a response using the specified model.
    Falls back to Cohere if Groq is rate limited.

    Args:
        groq_client: Groq API client
        cohere_client: Cohere API client
        messages: Conversation messages
        model_id: Model ID to use (defaults to DEFAULT_MODEL)
        tenant_id: For usage logging
        use_tools: Whether to enable tool calling
        search_tool: Single tool definition (backward compat) if use_tools is True
        tools: List of tool definitions if use_tools is True (takes precedence)

    Returns: (response_content, model_used, tool_calls)
    """
    if not model_id:
        model_id = DEFAULT_MODEL

    provider, model_id = get_model_provider(model_id)
    model_info = AVAILABLE_MODELS.get(provider, {}).get(model_id, {})
    supports_tools = model_info.get('supports_tools', False)

    # Determine which tools to use
    tool_list = tools if tools else ([search_tool] if search_tool else [])

    # If user requested Cohere directly, use Cohere
    if provider == 'cohere':
        return _generate_with_cohere(
            cohere_client, messages, model_id, tenant_id,
            use_tools=use_tools and supports_tools, search_tool=search_tool, tools=tool_list
        )

    # Try Groq first
    try:
        start_time = time.time()
        if use_tools and tool_list and supports_tools:
            response = call_groq_with_retry(
                groq_client,
                max_retries=3,
                model=model_id,
                messages=messages,
                tools=tool_list,
                tool_choice="auto",
                parallel_tool_calls=False,
                temperature=0.2,
                max_tokens=2048
            )
        else:
            response = call_groq_with_retry(
                groq_client,
                max_retries=3,
                model=model_id,
                messages=messages,
                temperature=0.3,
                max_tokens=2048
            )
        latency_ms = int((time.time() - start_time) * 1000)

        assistant_msg = response.choices[0].message
        tool_calls = []

        if hasattr(assistant_msg, 'tool_calls') and assistant_msg.tool_calls:
            tool_calls = assistant_msg.tool_calls

        # Log Groq usage
        if tenant_id and hasattr(response, 'usage'):
            log_api_usage(
                tenant_id=tenant_id,
                provider="groq",
                endpoint="chat",
                model=model_id,
                input_tokens=response.usage.prompt_tokens if response.usage else 0,
                output_tokens=response.usage.completion_tokens if response.usage else 0,
                latency_ms=latency_ms,
                success=True,
                operation="rag_query"
            )

        return assistant_msg.content, model_id, tool_calls

    except RateLimitExhausted:
        # Fall back to Cohere Command-R
        return _generate_with_cohere(
            cohere_client, messages, "command-r-08-2024", tenant_id,
            use_tools=False, search_tool=None, is_fallback=True
        )


def _generate_with_cohere(
    cohere_client,
    messages: list,
    model_id: str,
    tenant_id: str = None,
    use_tools: bool = False,
    search_tool: dict = None,
    tools: list = None,
    is_fallback: bool = False
) -> tuple[str, str, list]:
    """Generate response using Cohere API."""
    # Convert messages to Cohere V2 format (system goes in messages)
    cohere_messages = []

    for msg in messages:
        if msg["role"] == "system":
            cohere_messages.append({"role": "system", "content": msg["content"]})
        elif msg["role"] == "user":
            cohere_messages.append({"role": "user", "content": msg["content"]})
        elif msg["role"] == "assistant":
            content = msg.get("content", "")
            if content:
                cohere_messages.append({"role": "assistant", "content": content})
        elif msg["role"] == "tool":
            # Include tool results as user context since Cohere V2 doesn't have tool role
            cohere_messages.append({
                "role": "user",
                "content": f"[Search Results]: {msg['content']}"
            })

    # Cohere V2 API - no preamble, system is in messages
    start_time = time.time()

    # Build tool definitions for Cohere if needed
    cohere_tools = None
    tool_list = tools if tools else ([search_tool] if search_tool else [])
    if use_tools and tool_list:
        cohere_tools = [
            {"type": "function", "function": t["function"]}
            for t in tool_list
        ]

    chat_kwargs = {
        "model": model_id,
        "messages": cohere_messages,
        "temperature": 0.3,
        "max_tokens": 2048
    }
    if cohere_tools:
        chat_kwargs["tools"] = cohere_tools

    response = cohere_client.chat(**chat_kwargs)
    latency_ms = int((time.time() - start_time) * 1000)

    # Log Cohere usage
    if tenant_id:
        input_tokens = response.usage.tokens.input_tokens if hasattr(response, 'usage') and response.usage else 0
        output_tokens = response.usage.tokens.output_tokens if hasattr(response, 'usage') and response.usage else 0
        log_api_usage(
            tenant_id=tenant_id,
            provider="cohere",
            endpoint="chat",
            model=model_id,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            latency_ms=latency_ms,
            success=True,
            operation="rag_query_fallback" if is_fallback else "rag_query"
        )

    # Handle tool calls from Cohere (V2 API)
    tool_calls = []
    if hasattr(response.message, 'tool_calls') and response.message.tool_calls:
        tool_calls = response.message.tool_calls

    # Get text content
    content = ""
    if hasattr(response.message, 'content') and response.message.content:
        for part in response.message.content:
            if hasattr(part, 'text'):
                content += part.text

    model_label = f"{model_id} (fallback)" if is_fallback else model_id
    return content, model_label, tool_calls


# Alias for backward compatibility
def generate_with_cohere_fallback(
    groq_client,
    cohere_client,
    messages: list,
    tenant_id: str = None,
    use_tools: bool = False,
    search_tool: dict = None
) -> tuple[str, str, list]:
    """Backward compatible wrapper - uses default model."""
    return generate_with_model(
        groq_client, cohere_client, messages,
        model_id=DEFAULT_MODEL,
        tenant_id=tenant_id,
        use_tools=use_tools,
        search_tool=search_tool
    )

# Tool definition for search_documents
SEARCH_TOOL = {
    "type": "function",
    "function": {
        "name": "search_documents",
        "description": "Search family documents using semantic search. Use this when the user asks questions about their documents, stored information, insurance, medical records, recipes, or anything related to their family knowledge base.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query - what to look for in the documents"
                }
            },
            "required": ["query"]
        }
    }
}

# Tool definition for visual search of PDF pages
SEARCH_PAGES_TOOL = {
    "type": "function",
    "function": {
        "name": "search_pdf_pages",
        "description": "Search PDF document pages by visual content. Use this when the user asks about charts, diagrams, graphs, tables, handwritten notes, signatures, floor plans, photos within documents, or wants to find a specific page by its visual appearance. This searches the actual rendered page images.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Description of the visual content to find (e.g., 'pie chart showing expenses', 'signature page', 'handwritten notes')"
                },
                "document_id": {
                    "type": "integer",
                    "description": "Optional: limit search to a specific document ID"
                }
            },
            "required": ["query"]
        }
    }
}

SYSTEM_PROMPT = """You are Archevi, a helpful AI assistant for family document management.

Your role is to help family members find and understand information from their stored documents.

Guidelines:
- Use the search_documents tool when users ask about their documents, policies, records, or stored information
- Use the search_pdf_pages tool when users ask about charts, diagrams, graphs, tables, handwritten notes, signatures, or visual content in PDFs
- Cite sources by mentioning document titles when answering
- If you can't find relevant information, say so clearly
- Be helpful, friendly, and respect privacy
- For sensitive topics (medical, financial), remind users to verify with professionals
- Keep answers concise but complete

When documents include "key_data" in search results:
- PRIORITIZE the key_data over raw content for precise answers (dates, amounts, names, policy numbers)
- Key data has been AI-extracted and verified from the document
- High importance items (expiry dates, totals, policy numbers) are marked prominently
- Use exact values from key_data when answering specific questions

You have access to:
- search_documents: Find documents by text content using semantic search
- search_pdf_pages: Find specific PDF pages by visual content (charts, diagrams, handwritten notes, etc.)"""


def search_documents_internal(
    query: str,
    tenant_id: str,
    top_k: int = 5,
    user_member_type: Optional[str] = None,
    user_member_id: Optional[int] = None
) -> dict:
    """Search documents using Cohere Embed v4 + pgvector + Rerank v3.5."""
    if not query or not query.strip():
        return {"documents": [], "query": query, "count": 0}

    query = query.strip()

    # Fetch resources
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    co = cohere.ClientV2(api_key=cohere_api_key)

    # Step 1: Embed query
    try:
        embed_start = time.time()
        embed_response = co.embed(
            texts=[query],
            model="embed-v4.0",
            input_type="search_query",
            embedding_types=["float"],
            output_dimension=1024
        )
        embed_latency = int((time.time() - embed_start) * 1000)
        query_embedding = embed_response.embeddings.float_[0]

        # Log embed usage (estimate tokens from query length)
        log_api_usage(
            tenant_id=tenant_id,
            provider="cohere",
            endpoint="embed",
            model="embed-v4.0",
            input_tokens=len(query.split()),  # Approximate token count
            output_tokens=0,
            latency_ms=embed_latency,
            success=True,
            operation="search_embed"
        )
    except Exception as e:
        return {"documents": [], "query": query, "count": 0, "error": f"Embed error: {str(e)}"}

    # Step 2: Vector search
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

        # Enable pgvector iterative scans for filtered queries (pgvector 0.8.0+)
        # This prevents overfiltering when combining vector search with WHERE clauses
        cursor.execute("SET hnsw.iterative_scan = strict_order;")

        # Build visibility filter
        visibility_filter = ""
        params = [query_embedding, tenant_id]

        if user_member_type:
            if user_member_type == 'admin':
                pass
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

        cursor.execute(f"""
            SELECT id, title, content, category, extracted_data, embedding <=> %s::vector AS distance
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

    # Step 3: Rerank
    try:
        documents_for_rerank = []
        for r in search_results:
            # r = (id, title, content, category, extracted_data, distance)
            extracted_data = r[4] if r[4] else {}
            doc_text = f"title: {r[1]}\ncategory: {r[3]}\ncontent: {r[2][:4000]}"
            documents_for_rerank.append({
                "id": str(r[0]),
                "title": r[1],
                "content": r[2][:8000],
                "category": r[3],
                "extracted_data": extracted_data,
                "rerank_text": doc_text
            })

        rerank_start = time.time()
        rerank_response = co.rerank(
            query=query,
            documents=[d["rerank_text"] for d in documents_for_rerank],
            top_n=top_k,
            model="rerank-v3.5",
            return_documents=False
        )
        rerank_latency = int((time.time() - rerank_start) * 1000)

        # Log rerank usage (per-request pricing)
        log_api_usage(
            tenant_id=tenant_id,
            provider="cohere",
            endpoint="rerank",
            model="rerank-v3.5",
            input_tokens=0,  # Rerank uses per-request pricing
            output_tokens=0,
            latency_ms=rerank_latency,
            success=True,
            operation="search_rerank"
        )

        documents = []
        for result in rerank_response.results:
            doc = documents_for_rerank[result.index]
            documents.append({
                "id": doc["id"],
                "title": doc["title"],
                "content": doc["content"],
                "category": doc["category"],
                "extracted_data": doc.get("extracted_data", {}),
                "relevance": round(float(result.relevance_score), 3)
            })

    except Exception:
        documents = []
        for r in search_results[:top_k]:
            # r = (id, title, content, category, extracted_data, distance)
            distance = float(r[5])
            extracted_data = r[4] if r[4] else {}
            similarity = max(0.0, min(1.0, 1.0 / (1.0 + distance)))
            documents.append({
                "id": str(r[0]),
                "title": r[1],
                "content": r[2][:8000],
                "category": r[3],
                "extracted_data": extracted_data,
                "relevance": round(similarity, 3)
            })

    return {
        "documents": documents,
        "query": query,
        "count": len(documents)
    }


def search_pdf_pages_internal(
    query: str,
    tenant_id: str,
    document_id: Optional[int] = None,
    limit: int = 5,
    min_similarity: float = 0.2
) -> dict:
    """Search PDF pages by visual similarity using Cohere Embed v4.

    This enables queries like:
    - "Find the page with the pie chart"
    - "Show me the signature page"
    - "Find handwritten notes"

    Args:
        query: Natural language description of visual content
        tenant_id: UUID for data isolation
        document_id: Optional document ID to limit search
        limit: Max results
        min_similarity: Minimum similarity threshold

    Returns:
        dict with pages list, query, count
    """
    if not query or not query.strip():
        return {"pages": [], "query": query, "count": 0}

    query = query.strip()

    # Fetch resources
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    co = cohere.ClientV2(api_key=cohere_api_key)

    # Step 1: Embed query as text (Cohere aligns text and image embeddings)
    try:
        embed_start = time.time()
        embed_response = co.embed(
            texts=[query],
            model="embed-v4.0",
            input_type="search_query",
            embedding_types=["float"]
        )
        embed_latency = int((time.time() - embed_start) * 1000)
        query_embedding = embed_response.embeddings.float_[0]

        log_api_usage(
            tenant_id=tenant_id,
            provider="cohere",
            endpoint="embed",
            model="embed-v4.0",
            input_tokens=len(query.split()),
            output_tokens=0,
            latency_ms=embed_latency,
            success=True,
            operation="visual_search_embed"
        )
    except Exception as e:
        return {"pages": [], "query": query, "count": 0, "error": f"Embed error: {str(e)}"}

    # Step 2: Vector search in document_pages
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

        # Enable pgvector iterative scans
        cursor.execute("SET hnsw.iterative_scan = strict_order;")

        # Build query with optional document filter
        params = [query_embedding, tenant_id, query_embedding, min_similarity, query_embedding, limit]
        doc_filter = ""
        if document_id:
            doc_filter = "AND dp.document_id = %s"
            params = [query_embedding, tenant_id, document_id, query_embedding, min_similarity, query_embedding, limit]

        cursor.execute(f"""
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
            WHERE dp.tenant_id = %s::uuid
              {doc_filter}
              AND dp.embedding IS NOT NULL
              AND (1 - (dp.embedding <=> %s::vector)) >= %s
            ORDER BY dp.embedding <=> %s::vector
            LIMIT %s
        """, params)

        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        pages = []
        for row in rows:
            pages.append({
                "page_id": row[0],
                "document_id": row[1],
                "document_title": row[2],
                "page_number": row[3],
                "similarity": round(float(row[4]), 4),
                "page_image": row[5],  # Base64 thumbnail
                "ocr_text": row[6][:500] if row[6] else None,
                "has_images": row[7],
                "dimensions": {"width": row[8], "height": row[9]}
            })

        return {
            "pages": pages,
            "query": query,
            "count": len(pages)
        }

    except psycopg2.Error as e:
        return {"pages": [], "query": query, "count": 0, "error": f"DB error: {str(e)}"}


def main(
    user_message: str,
    tenant_id: str,
    session_id: Optional[str] = None,
    conversation_history: Optional[list] = None,
    user_member_type: Optional[str] = None,
    user_member_id: Optional[int] = None,
    stream: bool = True,
    model: Optional[str] = None,
) -> dict:
    """Execute AI Agent RAG pipeline with tool calling.

    Args:
        user_message: The user's question
        tenant_id: UUID for data isolation
        session_id: Optional session for conversation continuity
        conversation_history: Optional list of prior messages
        user_member_type: For visibility filtering
        user_member_id: For private doc access
        stream: Whether to stream events (default True)
        model: Optional model ID to use (defaults to llama-3.3-70b-versatile)

    Uses the specified model, or falls back to Cohere Command-R if rate limited.
    When stream=True, emits SSE events via wmill.stream_result() for real-time UI updates.
    """
    def emit(event_type: str, data: dict):
        """Emit an SSE event if streaming is enabled."""
        if stream:
            wmill.stream_result(stream_event(event_type, data))

    if not user_message or not user_message.strip():
        result = {"answer": "Please ask a question.", "sources": [], "tool_calls": []}
        emit("complete", result)
        return result

    if not tenant_id:
        result = {"answer": "Error: tenant_id required", "sources": [], "tool_calls": []}
        emit("error", {"message": "tenant_id required"})
        return result

    if not session_id:
        session_id = str(uuid.uuid4())

    # Rate limit check - limits based on tenant's plan
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    rate_limit_conn = psycopg2.connect(
        host=postgres_db['host'],
        port=postgres_db['port'],
        dbname=postgres_db['dbname'],
        user=postgres_db['user'],
        password=postgres_db['password'],
        sslmode=postgres_db.get('sslmode', 'disable')
    )

    try:
        # Get plan-based rate limit for this tenant
        max_requests, tenant_plan = get_tenant_rate_limit(rate_limit_conn, tenant_id)

        allowed, remaining, retry_after = check_rate_limit(
            rate_limit_conn,
            tenant_id,
            endpoint="rag_query",
            max_requests=max_requests,
            window_seconds=60
        )

        if not allowed:
            rate_limit_conn.close()
            result = {
                "error": "rate_limit_exceeded",
                "answer": "You've reached the query limit. Please wait a moment before asking another question.",
                "sources": [],
                "tool_calls": [],
                "retry_after": retry_after,
                "limit": max_requests,
                "window": 60,
                "plan": tenant_plan,
                "session_id": session_id,
                "tenant_id": tenant_id
            }
            emit("error", {"message": "rate_limit_exceeded", "retry_after": retry_after, "plan": tenant_plan})
            return result

        # Store for response
        rate_limit_remaining = remaining
        rate_limit_max = max_requests
        rate_limit_plan = tenant_plan

        # Occasionally cleanup old rate limit records (1% chance)
        import random
        if random.random() < 0.01:
            cleanup_old_rate_limits(rate_limit_conn, hours=24)

    finally:
        rate_limit_conn.close()

    # Initialize both clients
    groq_api_key = wmill.get_variable("f/chatbot/groq_api_key")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")
    groq_client = Groq(api_key=groq_api_key)
    cohere_client = cohere.ClientV2(api_key=cohere_api_key)

    # Build messages
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if conversation_history:
        messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})

    tool_calls_made = []
    sources = []
    requested_model = model or DEFAULT_MODEL
    model_used = requested_model

    # Emit thinking started event
    emit("thinking", {"status": "started", "model": requested_model})

    # Both tools available to the AI
    all_tools = [SEARCH_TOOL, SEARCH_PAGES_TOOL]
    page_sources = []  # Track page results separately

    # First call - let AI decide if it needs to search
    # Use specified model, fall back to Cohere if rate limited
    try:
        content, model_used, tool_calls = generate_with_model(
            groq_client, cohere_client, messages,
            model_id=requested_model,
            tenant_id=tenant_id,
            use_tools=True, tools=all_tools
        )

        # Check if we're in Cohere fallback mode (no tool calling support)
        is_cohere_fallback = "fallback" in model_used

        # If we got tool calls, process them
        if tool_calls:
            # Build assistant message for conversation
            assistant_msg = {"role": "assistant", "content": content or "", "tool_calls": tool_calls}
            messages.append(assistant_msg)

            for tool_call in tool_calls:
                if tool_call.function.name == "search_documents":
                    args = json.loads(tool_call.function.arguments)
                    search_query = args.get("query", user_message)

                    tool_calls_made.append({
                        "name": "search_documents",
                        "query": search_query
                    })

                    # Emit search started event
                    emit("search", {"status": "started", "query": search_query})

                    # Execute search
                    search_result = search_documents_internal(
                        query=search_query,
                        tenant_id=tenant_id,
                        top_k=5,
                        user_member_type=user_member_type,
                        user_member_id=user_member_id
                    )

                    if search_result.get("documents"):
                        sources = [
                            {
                                "id": doc["id"],
                                "title": doc["title"],
                                "category": doc["category"],
                                "relevance": doc["relevance"],
                                "snippet": doc["content"][:500] if doc.get("content") else None
                            }
                            for doc in search_result["documents"]
                        ]

                    # Emit search complete event with results
                    emit("search", {
                        "status": "complete",
                        "query": search_query,
                        "count": len(sources),
                        "sources": sources
                    })

                    # Format documents for AI with extracted key data prominently displayed
                    formatted_docs = []
                    for doc in search_result.get("documents", []):
                        formatted_doc = {
                            "id": doc["id"],
                            "title": doc["title"],
                            "category": doc["category"],
                            "relevance": doc["relevance"]
                        }
                        # Add key data if available - prominently before content
                        key_data = format_extracted_data_for_ai(doc.get("extracted_data", {}))
                        if key_data:
                            formatted_doc["key_data"] = key_data
                        # Truncate content to save tokens, key data is more precise
                        formatted_doc["content"] = doc["content"][:4000] if doc.get("content") else ""
                        formatted_docs.append(formatted_doc)

                    tool_response = json.dumps({
                        "found": len(formatted_docs),
                        "documents": formatted_docs
                    })

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": tool_response
                    })

                elif tool_call.function.name == "search_pdf_pages":
                    args = json.loads(tool_call.function.arguments)
                    visual_query = args.get("query", user_message)
                    doc_id = args.get("document_id")

                    tool_calls_made.append({
                        "name": "search_pdf_pages",
                        "query": visual_query,
                        "document_id": doc_id
                    })

                    # Emit visual search started
                    emit("visual_search", {"status": "started", "query": visual_query})

                    # Execute visual search
                    page_result = search_pdf_pages_internal(
                        query=visual_query,
                        tenant_id=tenant_id,
                        document_id=doc_id,
                        limit=5,
                        min_similarity=0.2
                    )

                    if page_result.get("pages"):
                        page_sources = [
                            {
                                "page_id": p["page_id"],
                                "document_id": p["document_id"],
                                "document_title": p["document_title"],
                                "page_number": p["page_number"],
                                "similarity": p["similarity"],
                                "page_image": p["page_image"],
                                "ocr_text": p["ocr_text"],
                                "type": "page"
                            }
                            for p in page_result["pages"]
                        ]

                    # Emit visual search complete
                    emit("visual_search", {
                        "status": "complete",
                        "query": visual_query,
                        "count": len(page_sources),
                        "page_sources": page_sources
                    })

                    # Build tool response - don't include full page images in LLM context
                    tool_response = json.dumps({
                        "found": len(page_result.get("pages", [])),
                        "pages": [
                            {
                                "document_title": p["document_title"],
                                "page_number": p["page_number"],
                                "ocr_text": p["ocr_text"],
                                "has_images": p.get("has_images", False)
                            }
                            for p in page_result.get("pages", [])
                        ]
                    })

                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": tool_response
                    })

            # Emit answer generation started
            emit("answer", {"status": "started"})

            # Second call - generate answer with search results
            answer, model_used, _ = generate_with_model(
                groq_client, cohere_client, messages,
                model_id=requested_model,
                tenant_id=tenant_id,
                use_tools=False
            )

            # Emit answer complete (full answer - not chunked since Groq doesn't stream here)
            emit("answer", {"status": "complete", "content": answer})

        elif is_cohere_fallback:
            # Cohere fallback doesn't support tool calling, so proactively search
            # Always search when using Cohere fallback (user is asking a question)
            tool_calls_made.append({
                "name": "search_documents",
                "query": user_message
            })

            # Emit search started for Cohere fallback
            emit("search", {"status": "started", "query": user_message})

            search_result = search_documents_internal(
                query=user_message,
                tenant_id=tenant_id,
                top_k=5,
                user_member_type=user_member_type,
                user_member_id=user_member_id
            )

            if search_result.get("documents"):
                sources = [
                    {
                        "id": doc["id"],
                        "title": doc["title"],
                        "category": doc["category"],
                        "relevance": doc["relevance"],
                        "snippet": doc["content"][:500] if doc.get("content") else None
                    }
                    for doc in search_result["documents"]
                ]

                # Emit search complete
                emit("search", {
                    "status": "complete",
                    "query": user_message,
                    "count": len(sources),
                    "sources": sources
                })

                # Build context from search results with extracted key data
                context_parts = []
                for doc in search_result["documents"][:3]:
                    doc_context = f"Document: {doc['title']}\nCategory: {doc['category']}"
                    # Add key data prominently before content
                    key_data = format_extracted_data_for_ai(doc.get("extracted_data", {}))
                    if key_data:
                        doc_context += f"\n{key_data}"
                    doc_context += f"\nContent: {doc['content'][:2000]}"
                    context_parts.append(doc_context)
                context_docs = "\n\n".join(context_parts)

                # Add search results to messages and generate answer
                messages.append({
                    "role": "user",
                    "content": f"[Search Results - use these to answer the question]:\n{context_docs}"
                })

                # Emit answer started
                emit("answer", {"status": "started"})

                # Generate answer with context
                answer, model_used, _ = generate_with_model(
                    groq_client, cohere_client, messages,
                    model_id=requested_model,
                    tenant_id=tenant_id,
                    use_tools=False
                )

                # Emit answer complete
                emit("answer", {"status": "complete", "content": answer})
            else:
                # No documents found, emit search complete with 0 results
                emit("search", {
                    "status": "complete",
                    "query": user_message,
                    "count": 0,
                    "sources": []
                })
                # No documents found, use original response
                answer = content
                emit("answer", {"status": "complete", "content": answer})

        else:
            # No tools needed, use the first response
            answer = content
            emit("answer", {"status": "complete", "content": answer})

    except Exception as e:
        error_msg = str(e)
        # If tool calling fails completely, try direct Cohere without tools
        if "tool_use_failed" in error_msg:
            try:
                # Convert messages and call Cohere directly
                cohere_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
                for msg in messages:
                    if msg["role"] == "user":
                        cohere_messages.append({"role": "user", "content": msg["content"]})

                response = cohere_client.chat(
                    model="command-r-08-2024",
                    messages=cohere_messages,
                    temperature=0.3,
                    max_tokens=2048
                )
                return {
                    "answer": response.message.content[0].text,
                    "sources": [],
                    "tool_calls": [],
                    "confidence": 0.0,
                    "session_id": session_id,
                    "tenant_id": tenant_id,
                    "model": "command-r-08-2024 (error fallback)"
                }
            except Exception:
                pass
        raise

    # Calculate confidence
    confidence = 0.0
    if sources:
        weights = [0.5, 0.3, 0.2]
        weighted_sum = sum(
            s["relevance"] * weights[i]
            for i, s in enumerate(sources[:len(weights)])
        )
        total_weight = sum(weights[:len(sources)])
        confidence = weighted_sum / total_weight if total_weight > 0 else 0.0

    result = {
        "answer": answer,
        "sources": sources,
        "page_sources": page_sources,  # Visual search results with page images
        "tool_calls": tool_calls_made,
        "confidence": round(confidence, 3),
        "session_id": session_id,
        "tenant_id": tenant_id,
        "model": model_used,
        "rate_limit": {
            "remaining": rate_limit_remaining,
            "limit": rate_limit_max,
            "window": 60,
            "plan": rate_limit_plan
        }
    }

    # Emit complete event with full result
    emit("complete", result)

    return result

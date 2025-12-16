# log_api_usage.py
# Windmill Python script - Log API usage with cost calculation
# Path: f/chatbot/log_api_usage
#
# requirements:
#   - psycopg2-binary
#   - wmill

"""
Log API usage for cost tracking and analytics.

This script should be called after every API call to external services
(Groq, Cohere, OpenAI, etc.) to track usage and costs.

Args:
    tenant_id: UUID of the tenant making the request
    provider: API provider ('groq', 'cohere', 'openai', 'anthropic')
    endpoint: API endpoint ('chat', 'embed', 'rerank')
    model: Model name (e.g., 'llama-3.3-70b-versatile', 'embed-v4.0')
    input_tokens: Number of input tokens (optional)
    output_tokens: Number of output tokens (optional)
    latency_ms: Request latency in milliseconds (optional)
    success: Whether the request succeeded (default True)
    error_message: Error message if failed (optional)
    operation: What operation triggered this (e.g., 'rag_query', 'embed_document')
    user_id: Optional user ID for attribution
    request_id: Optional UUID for request correlation
    metadata: Optional JSONB for additional context

Returns:
    dict: {success, usage_id, cost_cents, message}
"""

import json
import uuid
from typing import Optional
import wmill
import psycopg2


# Current pricing (cents per million tokens or per request)
# Updated Dec 2025
PRICING = {
    'groq': {
        'llama-3.3-70b-versatile': {'input': 59, 'output': 79},  # per 1M tokens
        'llama-3.1-8b-instant': {'input': 5, 'output': 8},
    },
    'cohere': {
        'embed-v4.0': {'input': 10, 'output': 0},  # per 1M tokens
        'rerank-v3.5': {'per_request': 0.2},  # 0.2 cents per search ($2/1000)
        'command-r-08-2024': {'input': 150, 'output': 600},
        'command-r-plus-08-2024': {'input': 250, 'output': 1000},
    },
    'openai': {
        'gpt-4o': {'input': 250, 'output': 1000},
        'gpt-4o-mini': {'input': 15, 'output': 60},
    },
    'anthropic': {
        'claude-3-5-sonnet': {'input': 300, 'output': 1500},
        'claude-3-haiku': {'input': 25, 'output': 125},
    }
}


def calculate_cost_cents(
    provider: str,
    model: str,
    input_tokens: int = 0,
    output_tokens: int = 0
) -> int:
    """Calculate cost in cents based on usage."""
    if provider not in PRICING:
        return 0

    model_pricing = PRICING[provider].get(model)
    if not model_pricing:
        return 0

    # Per-request pricing (like rerank)
    if 'per_request' in model_pricing:
        return int(model_pricing['per_request'] * 10)  # Convert to integer cents * 10 for precision

    # Token-based pricing
    input_cost = (input_tokens / 1_000_000) * model_pricing.get('input', 0)
    output_cost = (output_tokens / 1_000_000) * model_pricing.get('output', 0)

    # Return cost in cents (rounded up to nearest 0.01 cent for precision)
    return int((input_cost + output_cost) * 100)


def main(
    tenant_id: str,
    provider: str,
    endpoint: str,
    model: str,
    input_tokens: int = 0,
    output_tokens: int = 0,
    latency_ms: Optional[int] = None,
    success: bool = True,
    error_message: Optional[str] = None,
    operation: Optional[str] = None,
    user_id: Optional[int] = None,
    request_id: Optional[str] = None,
    metadata: Optional[dict] = None
) -> dict:
    """Log API usage and calculate cost."""

    if not tenant_id:
        return {"success": False, "message": "tenant_id is required"}

    if not provider or provider not in ['groq', 'cohere', 'openai', 'anthropic']:
        return {"success": False, "message": f"Invalid provider: {provider}"}

    # Calculate cost
    cost_cents = calculate_cost_cents(provider, model, input_tokens, output_tokens)

    # Get database connection
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    try:
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        cursor = conn.cursor()

        # Insert usage record
        cursor.execute("""
            INSERT INTO api_usage (
                tenant_id, user_id, provider, endpoint, model,
                input_tokens, output_tokens, cost_cents,
                request_id, latency_ms, success, error_message,
                operation, metadata
            ) VALUES (
                %s::uuid, %s, %s, %s, %s,
                %s, %s, %s,
                %s::uuid, %s, %s, %s,
                %s, %s::jsonb
            )
            RETURNING id
        """, (
            tenant_id, user_id, provider, endpoint, model,
            input_tokens, output_tokens, cost_cents,
            request_id, latency_ms, success, error_message,
            operation, json.dumps(metadata) if metadata else None
        ))

        usage_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "usage_id": usage_id,
            "cost_cents": cost_cents,
            "message": f"Logged {provider}/{model} usage: {input_tokens + output_tokens} tokens, ${cost_cents/100:.4f}"
        }

    except psycopg2.Error as e:
        return {
            "success": False,
            "message": f"Database error: {str(e)}"
        }

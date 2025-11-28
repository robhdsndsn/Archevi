# health_check.py
# Windmill Python script for system health monitoring
# Path: f/chatbot/health_check
#
# requirements:
#   - cohere
#   - psycopg2-binary
#   - wmill
#   - requests

"""
Health check endpoint for monitoring all system components.

Checks the health of:
- PostgreSQL database connection
- Cohere Embed API
- Cohere Chat API
- Cohere Rerank API

Returns status for each service with response times and any errors.
Optionally stores results in health_checks table for historical tracking.

Args:
    store_results (bool): Whether to store check results in database (default: True)
    verbose (bool): Include detailed error messages (default: False)

Returns:
    dict: {
        status: 'healthy' | 'degraded' | 'unhealthy',
        services: {service_name: {status, response_time_ms, error}},
        timestamp: ISO timestamp
    }
"""

import cohere
import psycopg2
import time
from datetime import datetime
from typing import Optional
import wmill


def check_postgres(postgres_db: dict) -> dict:
    """Check PostgreSQL connection and basic query execution."""
    start = time.time()
    try:
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable'),
            connect_timeout=10
        )
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()

        return {
            "status": "up",
            "response_time_ms": int((time.time() - start) * 1000),
            "error": None
        }
    except Exception as e:
        return {
            "status": "down",
            "response_time_ms": int((time.time() - start) * 1000),
            "error": str(e)
        }


def check_cohere_embed(co: cohere.ClientV2) -> dict:
    """Check Cohere Embed API with a minimal request."""
    start = time.time()
    try:
        response = co.embed(
            texts=["health check"],
            model="embed-v4.0",
            input_type="search_query",
            embedding_types=["float"],
            output_dimension=256  # Use smallest dimension for speed
        )
        # Verify we got embeddings back
        if response.embeddings and response.embeddings.float_:
            return {
                "status": "up",
                "response_time_ms": int((time.time() - start) * 1000),
                "error": None
            }
        else:
            return {
                "status": "degraded",
                "response_time_ms": int((time.time() - start) * 1000),
                "error": "Empty response"
            }
    except Exception as e:
        return {
            "status": "down",
            "response_time_ms": int((time.time() - start) * 1000),
            "error": str(e)
        }


def check_cohere_chat(co: cohere.ClientV2) -> dict:
    """Check Cohere Chat API with a minimal request."""
    start = time.time()
    try:
        response = co.chat(
            model="command-r-08-2024",  # Use available cheaper model for health check
            messages=[{"role": "user", "content": "Reply with OK"}]
        )
        if response.message and response.message.content:
            return {
                "status": "up",
                "response_time_ms": int((time.time() - start) * 1000),
                "error": None
            }
        else:
            return {
                "status": "degraded",
                "response_time_ms": int((time.time() - start) * 1000),
                "error": "Empty response"
            }
    except Exception as e:
        return {
            "status": "down",
            "response_time_ms": int((time.time() - start) * 1000),
            "error": str(e)
        }


def check_cohere_rerank(co: cohere.ClientV2) -> dict:
    """Check Cohere Rerank API with a minimal request."""
    start = time.time()
    try:
        response = co.rerank(
            query="test",
            documents=["document one", "document two"],
            model="rerank-v3.5",
            top_n=1
        )
        if response.results:
            return {
                "status": "up",
                "response_time_ms": int((time.time() - start) * 1000),
                "error": None
            }
        else:
            return {
                "status": "degraded",
                "response_time_ms": int((time.time() - start) * 1000),
                "error": "Empty response"
            }
    except Exception as e:
        return {
            "status": "down",
            "response_time_ms": int((time.time() - start) * 1000),
            "error": str(e)
        }


def main(
    store_results: bool = True,
    verbose: bool = False
) -> dict:
    """
    Run health checks on all system components.
    """
    timestamp = datetime.utcnow().isoformat() + "Z"

    # Fetch resources
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    # Initialize Cohere client
    co = cohere.ClientV2(api_key=cohere_api_key)

    # Run all checks
    services = {
        "postgres": check_postgres(postgres_db),
        "cohere_embed": check_cohere_embed(co),
        "cohere_chat": check_cohere_chat(co),
        "cohere_rerank": check_cohere_rerank(co)
    }

    # Determine overall status
    statuses = [s["status"] for s in services.values()]
    if all(s == "up" for s in statuses):
        overall_status = "healthy"
    elif any(s == "down" for s in statuses):
        overall_status = "unhealthy"
    else:
        overall_status = "degraded"

    # Store results in database if requested
    if store_results and services["postgres"]["status"] == "up":
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

            for service_name, result in services.items():
                try:
                    cursor.execute("""
                        INSERT INTO health_checks (service, status, response_time_ms, error_message)
                        VALUES (%s, %s, %s, %s)
                    """, (
                        service_name,
                        result["status"],
                        result["response_time_ms"],
                        result["error"] if verbose else None
                    ))
                except psycopg2.Error:
                    # Table might not exist yet
                    pass

            conn.commit()
            cursor.close()
            conn.close()
        except Exception:
            pass  # Don't fail health check due to logging issues

    # Clean up error messages if not verbose
    if not verbose:
        for service in services.values():
            if service["error"]:
                service["error"] = "Error occurred (enable verbose for details)"

    return {
        "status": overall_status,
        "services": services,
        "timestamp": timestamp
    }

# test_log_api_usage.py
# requirements:
#   - psycopg2-binary
#   - wmill

"""Test API usage logging directly."""

import wmill
import psycopg2

def main(tenant_id: str = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11") -> dict:
    """Insert a test API usage record."""
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
            RETURNING id
        """, (
            tenant_id, 'groq', 'chat', 'llama-3.3-70b-versatile',
            100, 50, 1,
            500, True, 'test'
        ))

        row_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()

        return {"success": True, "row_id": row_id}
    except Exception as e:
        return {"success": False, "error": str(e)}

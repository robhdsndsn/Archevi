# debug_api_usage.py
# requirements:
#   - psycopg2-binary
#   - wmill

import wmill
import psycopg2

def main() -> dict:
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

    # Check table exists
    cursor.execute("SELECT COUNT(*) FROM api_usage")
    count = cursor.fetchone()[0]

    # Get recent rows
    cursor.execute("SELECT id, tenant_id, provider, endpoint, model, cost_cents, created_at FROM api_usage ORDER BY created_at DESC LIMIT 10")
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    return {
        "total_rows": count,
        "recent": [
            {"id": r[0], "tenant_id": str(r[1]), "provider": r[2], "endpoint": r[3], "model": r[4], "cost_cents": r[5], "created_at": str(r[6])}
            for r in rows
        ]
    }

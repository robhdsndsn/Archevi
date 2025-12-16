#!/usr/bin/env python3
"""Create rate_limits table for per-tenant rate limiting."""
import requests
from config import WINDMILL_URL, WINDMILL_WORKSPACE as WORKSPACE, get_windmill_token

TOKEN = get_windmill_token()

# SQL to create the rate limits table
SQL = """
-- Rate limiting table for per-tenant request tracking
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    window_start TIMESTAMP NOT NULL,
    request_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, endpoint, window_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
ON rate_limits(tenant_id, endpoint, window_start DESC);

-- Cleanup old records (keep last 24 hours for analytics)
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
ON rate_limits(window_start);

-- Comment for documentation
COMMENT ON TABLE rate_limits IS 'Per-tenant rate limiting with fixed time windows';
"""

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Run via Windmill's database resource
script_content = f'''
import wmill
import psycopg2

def main():
    """Create rate_limits table."""
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

    sql = """{SQL}"""

    cursor.execute(sql)
    conn.commit()

    # Verify table exists
    cursor.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'rate_limits'
        ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()

    cursor.close()
    conn.close()

    return {{
        "success": True,
        "table": "rate_limits",
        "columns": [dict(name=c[0], type=c[1]) for c in columns]
    }}
'''

# Deploy and run the migration
print("Creating rate_limits table...")
payload = {
    "path": "f/migrations/create_rate_limits_table",
    "summary": "Create rate_limits table",
    "description": "Database migration to create rate limiting table",
    "content": script_content,
    "language": "python3",
    "lock": """# py: 3.11
anyio==4.5.0
certifi==2025.6.15
h11==0.16.0
httpcore==1.0.7
httpx==0.27.2
idna==3.10
psycopg2-binary==2.9.9
sniffio==1.3.1
wmill==1.404.0"""
}

# Archive if exists
requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/f/migrations/create_rate_limits_table",
    headers=headers
)

# Create script
resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create",
    headers=headers,
    json=payload
)
print(f"Create script: {resp.status_code}")

# Run the migration
print("Running migration...")
resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/jobs/run_wait_result/p/f/migrations/create_rate_limits_table",
    headers=headers,
    json={}
)
print(f"Migration result: {resp.status_code}")
if resp.status_code == 200:
    print(resp.json())
else:
    print(resp.text)

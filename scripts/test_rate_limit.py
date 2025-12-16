#!/usr/bin/env python3
"""Test rate limiting by directly manipulating the database."""
import requests
import json
import os
from config import WINDMILL_URL, WINDMILL_WORKSPACE as WORKSPACE, get_windmill_token, DEFAULT_TENANT_ID

TOKEN = get_windmill_token()
TEST_TENANT = DEFAULT_TENANT_ID or os.getenv('TEST_TENANT_ID', '')

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Script to check and manipulate rate limits
script_content = '''
import wmill
import psycopg2
from datetime import datetime

def main(action: str = "check", tenant_id: str = None, set_count: int = None):
    """Check or manipulate rate limits for testing.

    Args:
        action: "check", "set", or "clear"
        tenant_id: UUID of tenant
        set_count: For "set" action, the count to set
    """
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

    if action == "check":
        cursor.execute("""
            SELECT tenant_id, endpoint, window_start, request_count
            FROM rate_limits
            ORDER BY window_start DESC
            LIMIT 20
        """)
        rows = cursor.fetchall()
        result = [
            {"tenant_id": str(r[0]), "endpoint": r[1],
             "window_start": r[2].isoformat(), "request_count": r[3]}
            for r in rows
        ]

    elif action == "set" and tenant_id and set_count is not None:
        # Set the current window's count to a specific value
        now = datetime.utcnow()
        window_start = now.replace(second=0, microsecond=0)

        cursor.execute("""
            INSERT INTO rate_limits (tenant_id, endpoint, window_start, request_count)
            VALUES (%s, 'rag_query', %s, %s)
            ON CONFLICT (tenant_id, endpoint, window_start)
            DO UPDATE SET request_count = %s
            RETURNING request_count
        """, (tenant_id, window_start, set_count, set_count))
        conn.commit()
        result = {"set_count": set_count, "tenant_id": tenant_id}

    elif action == "clear":
        cursor.execute("DELETE FROM rate_limits")
        deleted = cursor.rowcount
        conn.commit()
        result = {"deleted": deleted}

    else:
        result = {"error": "Invalid action"}

    cursor.close()
    conn.close()
    return result
'''

# Deploy the test script
print("Deploying test script...")
payload = {
    "path": "f/test/rate_limit_test",
    "summary": "Test rate limiting",
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

requests.post(f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/f/test/rate_limit_test", headers=headers)
resp = requests.post(f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create", headers=headers, json=payload)
print(f"Deploy: {resp.status_code}")

# Check current state
print("\n1. Checking current rate limits...")
resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/jobs/run_wait_result/p/f/test/rate_limit_test",
    headers=headers,
    json={"action": "check"}
)
print(json.dumps(resp.json(), indent=2))

# Set count to 31 to trigger limit
print(f"\n2. Setting count to 31 for tenant {TEST_TENANT}...")
resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/jobs/run_wait_result/p/f/test/rate_limit_test",
    headers=headers,
    json={"action": "set", "tenant_id": TEST_TENANT, "set_count": 31}
)
print(json.dumps(resp.json(), indent=2))

# Now test the RAG endpoint - should be rate limited
print("\n3. Testing RAG query (should be rate limited)...")
resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/jobs/run_wait_result/p/f/chatbot/rag_query_agent",
    headers=headers,
    json={"user_message": "Hello", "tenant_id": TEST_TENANT}
)
result = resp.json()
if "error" in result:
    print(f"RATE LIMITED: {result.get('answer')}")
    print(f"Retry after: {result.get('retry_after')} seconds")
else:
    print(f"NOT LIMITED - remaining: {result.get('rate_limit', {}).get('remaining')}")

# Clear for cleanup
print("\n4. Clearing rate limits...")
resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/jobs/run_wait_result/p/f/test/rate_limit_test",
    headers=headers,
    json={"action": "clear"}
)
print(json.dumps(resp.json(), indent=2))

# Verify it works again
print("\n5. Testing RAG query after clear (should work)...")
resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/jobs/run_wait_result/p/f/chatbot/rag_query_agent",
    headers=headers,
    json={"user_message": "Hello again", "tenant_id": TEST_TENANT}
)
result = resp.json()
if "error" in result:
    print(f"STILL LIMITED: {result.get('answer')}")
else:
    print(f"Working! Remaining: {result.get('rate_limit', {}).get('remaining')}")

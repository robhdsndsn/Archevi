#!/usr/bin/env python3
"""Check if documents have embeddings."""
import requests
import json
import os
from config import WINDMILL_URL, WINDMILL_WORKSPACE as WORKSPACE, get_windmill_token, DEFAULT_TENANT_ID

TOKEN = get_windmill_token()
TENANT = DEFAULT_TENANT_ID or os.getenv('TEST_TENANT_ID', '')

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

script_content = '''
import wmill
import psycopg2

def main(tenant_id: str):
    """Check embedding status for tenant documents."""
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

    # Check total docs and those with embeddings
    cursor.execute("""
        SELECT
            COUNT(*) as total,
            COUNT(embedding) as with_embedding,
            COUNT(*) - COUNT(embedding) as without_embedding
        FROM family_documents
        WHERE tenant_id = %s::uuid
    """, (tenant_id,))
    counts = cursor.fetchone()

    # Get sample of docs without embeddings
    cursor.execute("""
        SELECT id, title, LEFT(content, 100) as preview
        FROM family_documents
        WHERE tenant_id = %s::uuid AND embedding IS NULL
        LIMIT 5
    """, (tenant_id,))
    no_embedding = cursor.fetchall()

    # Get sample of docs WITH embeddings
    cursor.execute("""
        SELECT id, title, array_length(embedding::float[], 1) as embed_dim
        FROM family_documents
        WHERE tenant_id = %s::uuid AND embedding IS NOT NULL
        LIMIT 5
    """, (tenant_id,))
    with_embedding = cursor.fetchall()

    cursor.close()
    conn.close()

    return {
        "total": counts[0],
        "with_embedding": counts[1],
        "without_embedding": counts[2],
        "docs_without_embedding": [{"id": r[0], "title": r[1], "preview": r[2]} for r in no_embedding],
        "docs_with_embedding": [{"id": r[0], "title": r[1], "embed_dim": r[2]} for r in with_embedding]
    }
'''

# Deploy
print("Deploying check script...")
payload = {
    "path": "f/test/check_embeddings",
    "summary": "Check document embeddings",
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

requests.post(f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/f/test/check_embeddings", headers=headers)
resp = requests.post(f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create", headers=headers, json=payload)
print(f"Deploy: {resp.status_code}")

# Run
print("\nChecking embeddings...")
resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/jobs/run_wait_result/p/f/test/check_embeddings",
    headers=headers,
    json={"tenant_id": TENANT}
)
print(json.dumps(resp.json(), indent=2))

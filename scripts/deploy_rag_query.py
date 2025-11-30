#!/usr/bin/env python3
"""Deploy updated rag_query.py to Windmill"""
import requests
import json

WINDMILL_URL = "http://localhost"
TOKEN = "t8u4sIJRGhaHPqLn0VuUPUPbWSa9uTyi"
WORKSPACE = "family-brain"

# Read the script content
with open('rag_query.py', 'r', encoding='utf-8') as f:
    script_content = f.read()

# Define the lock file for dependencies with full chain
lock_content = """# py: 3.11
annotated-types==0.6.0
anyio==4.5.0
certifi==2025.6.15
charset-normalizer==3.3.2
cohere==5.17.0
distro==1.9.0
fastavro==1.9.4
h11==0.16.0
httpcore==1.0.7
httpx==0.28.1
httpx-sse==0.4.0
idna==3.10
numpy==1.26.4
parameterized==0.9.0
psycopg2-binary==2.9.9
pgvector==0.2.4
pydantic==2.10.5
pydantic_core==2.27.2
requests==2.32.3
sniffio==1.3.1
tokenizers==0.15.2
typing_extensions==4.12.2
typing_inspection==0.4.0
urllib3==2.2.3
wmill==1.404.0"""

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Archive old version first
print("Archiving old version...")
resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/f/chatbot/rag_query",
    headers=headers
)
print(f"Archive response: {resp.status_code}")

# Create new version
print("Creating new version...")
payload = {
    "path": "f/chatbot/rag_query",
    "summary": "Multi-tenant RAG query with tenant isolation",
    "description": "RAG pipeline with tenant_id filtering for data isolation",
    "content": script_content,
    "language": "python3",
    "lock": lock_content
}

resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create",
    headers=headers,
    json=payload
)
print(f"Create response: {resp.status_code}")
if resp.status_code != 201:
    print(f"Response: {resp.text}")
else:
    print("Successfully deployed rag_query.py!")

#!/usr/bin/env python3
"""Deploy get_related_documents.py to Windmill"""
import requests
from config import WINDMILL_URL, WINDMILL_WORKSPACE as WORKSPACE, get_windmill_token

TOKEN = get_windmill_token()

# Standard lock file for database-only scripts
lock_content = """# py: 3.11
anyio==4.5.0
certifi==2025.6.15
h11==0.16.0
httpcore==1.0.7
httpx==0.28.1
idna==3.10
psycopg2-binary==2.9.9
sniffio==1.3.1
wmill==1.404.0"""

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Read script content
with open('get_related_documents.py', 'r', encoding='utf-8') as f:
    script_content = f.read()

print("=== Deploying f/chatbot/get_related_documents ===")

# Archive old version first
resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/f/chatbot/get_related_documents",
    headers=headers
)
print(f"Archive: {resp.status_code}")

# Create new version
payload = {
    "path": "f/chatbot/get_related_documents",
    "summary": "Find related documents by vector similarity",
    "description": "Returns documents similar to a given document using embedding cosine similarity. Useful for 'You might also want to see...' suggestions.",
    "content": script_content,
    "language": "python3",
    "lock": lock_content
}

resp = requests.post(
    f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create",
    headers=headers,
    json=payload
)

if resp.status_code == 201:
    print("Successfully deployed get_related_documents!")
else:
    print(f"Create: {resp.status_code} - {resp.text}")

print("\n=== Done ===")

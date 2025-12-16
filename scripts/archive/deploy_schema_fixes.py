#!/usr/bin/env python3
"""Deploy scripts with database schema fixes"""
import requests

WINDMILL_URL = "http://localhost"
TOKEN = "t8u4sIJRGhaHPqLn0VuUPUPbWSa9uTyi"
WORKSPACE = "family-brain"

# Complete lock file with ALL dependencies
lock_content = """# py: 3.11
annotated-types==0.6.0
anyio==4.5.0
bcrypt==4.1.2
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
PyJWT==2.8.0
requests==2.32.3
resend==0.8.0
sniffio==1.3.1
stripe==7.0.0
tokenizers==0.15.2
typing_extensions==4.12.2
typing_inspection==0.4.0
urllib3==2.2.3
wmill==1.404.0"""

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# Scripts with schema fixes
scripts = [
    {
        "file": "search_documents_advanced.py",
        "path": "f/chatbot/search_documents_advanced",
        "summary": "Advanced document search with filters",
        "description": "Search documents with date range, category, and tag filtering"
    },
    {
        "file": "create_tenant.py",
        "path": "f/admin/create_tenant",
        "summary": "Create new tenant",
        "description": "Admin endpoint to create a new tenant with owner account"
    },
]

print("=" * 60)
print("Deploying scripts with database schema fixes")
print("=" * 60)

success_count = 0
fail_count = 0

for script in scripts:
    print(f"\n--- Deploying {script['path']} ---")

    # Read script content
    try:
        with open(script['file'], 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"  ERROR: File {script['file']} not found")
        fail_count += 1
        continue

    # Archive old version
    resp = requests.post(
        f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/{script['path']}",
        headers=headers
    )
    print(f"  Archive: {resp.status_code}")

    # Create new version
    payload = {
        "path": script['path'],
        "summary": script['summary'],
        "description": script['description'],
        "content": content,
        "language": "python3",
        "lock": lock_content
    }

    resp = requests.post(
        f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create",
        headers=headers,
        json=payload
    )

    if resp.status_code == 201:
        print(f"  Create: SUCCESS")
        success_count += 1
    else:
        print(f"  Create: FAILED ({resp.status_code})")
        print(f"  Error: {resp.text[:200]}")
        fail_count += 1

print("\n" + "=" * 60)
print(f"Deployment complete: {success_count} succeeded, {fail_count} failed")
print("=" * 60)

#!/usr/bin/env python3
"""Deploy admin scripts to Windmill"""
import requests
from config import WINDMILL_URL, WINDMILL_WORKSPACE as WORKSPACE, get_windmill_token

TOKEN = get_windmill_token()

# Lock file for admin scripts (wmill needs httpx)
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

scripts = [
    {
        "path": "f/admin/list_tenants",
        "file": "list_tenants.py",
        "summary": "List all tenants with stats",
        "description": "Admin endpoint to list all tenants with member and document counts"
    },
    {
        "path": "f/admin/get_tenant_details",
        "file": "get_tenant_details.py",
        "summary": "Get tenant details",
        "description": "Admin endpoint to get detailed information about a specific tenant"
    }
]

for script in scripts:
    print(f"\n=== Deploying {script['path']} ===")

    # Read script content
    with open(script['file'], 'r', encoding='utf-8') as f:
        content = f.read()

    # Archive old version
    resp = requests.post(
        f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/{script['path']}",
        headers=headers
    )
    print(f"Archive: {resp.status_code}")

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
        print(f"Created successfully!")
    else:
        print(f"Create: {resp.status_code} - {resp.text}")

print("\n=== Done ===")

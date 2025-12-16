#!/usr/bin/env python3
"""
Deploy new Windmill scripts to production.

Scripts deployed:
- f/admin/create_tenant - Create new tenant (admin only)
- f/admin/update_tenant - Update tenant settings (admin only)
- f/chatbot/search_documents_advanced - Advanced document search with filters

Prerequisites:
- Docker Desktop must be running
- Windmill container must be up: docker compose up -d (from windmill-setup/)

Usage:
    python scripts/deploy_new_scripts.py
"""
import requests
import json
import sys
from pathlib import Path
from config import WINDMILL_URL, WINDMILL_WORKSPACE as WORKSPACE, get_windmill_token

TOKEN = get_windmill_token()

# Lock file content for Python dependencies
LOCK_CONTENT = """# py: 3.11
annotated-types==0.6.0
anyio==4.5.0
bcrypt==4.2.0
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

# Scripts to deploy
SCRIPTS = [
    {
        "file": "create_tenant.py",
        "path": "f/admin/create_tenant",
        "summary": "Create new tenant with owner account",
        "description": "Admin-only endpoint to create a new tenant (family/organization) with an initial owner user."
    },
    {
        "file": "update_tenant.py",
        "path": "f/admin/update_tenant",
        "summary": "Update tenant settings",
        "description": "Admin-only endpoint to update tenant configuration (plan, status, limits)."
    },
    {
        "file": "search_documents_advanced.py",
        "path": "f/chatbot/search_documents_advanced",
        "summary": "Advanced document search with filters",
        "description": "Search documents with semantic search, date ranges, categories, tags, and pagination."
    }
]

def check_windmill_health():
    """Check if Windmill is running."""
    try:
        resp = requests.get(f"{WINDMILL_URL}/api/version", timeout=5)
        return resp.status_code == 200
    except requests.exceptions.ConnectionError:
        return False

def deploy_script(script_info: dict, scripts_dir: Path) -> bool:
    """Deploy a single script to Windmill."""
    file_path = scripts_dir / script_info["file"]

    if not file_path.exists():
        print(f"  ERROR: {script_info['file']} not found")
        return False

    script_content = file_path.read_text(encoding='utf-8')

    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    # Archive old version (if exists)
    archive_resp = requests.post(
        f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/{script_info['path']}",
        headers=headers
    )

    # Create new version
    payload = {
        "path": script_info["path"],
        "summary": script_info["summary"],
        "description": script_info["description"],
        "content": script_content,
        "language": "python3",
        "lock": LOCK_CONTENT
    }

    resp = requests.post(
        f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create",
        headers=headers,
        json=payload
    )

    if resp.status_code == 201:
        print(f"  OK: {script_info['path']}")
        return True
    else:
        print(f"  FAILED: {script_info['path']} - {resp.status_code}")
        print(f"    {resp.text[:200]}")
        return False

def main():
    print("=" * 50)
    print("Archevi - Deploy New Windmill Scripts")
    print("=" * 50)
    print()

    # Check Windmill is running
    print("Checking Windmill connection...")
    if not check_windmill_health():
        print()
        print("ERROR: Cannot connect to Windmill at", WINDMILL_URL)
        print()
        print("Make sure:")
        print("  1. Docker Desktop is running")
        print("  2. Windmill containers are up:")
        print("     cd windmill-setup && docker compose up -d")
        print()
        sys.exit(1)

    print("  Connected to Windmill")
    print()

    # Deploy scripts
    scripts_dir = Path(__file__).parent
    print(f"Deploying {len(SCRIPTS)} scripts...")
    print()

    success_count = 0
    for script in SCRIPTS:
        if deploy_script(script, scripts_dir):
            success_count += 1

    print()
    print("-" * 50)
    print(f"Deployed: {success_count}/{len(SCRIPTS)} scripts")

    if success_count == len(SCRIPTS):
        print("All scripts deployed successfully!")
        return 0
    else:
        print("Some scripts failed to deploy.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

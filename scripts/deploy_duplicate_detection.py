#!/usr/bin/env python3
"""
Deploy updated embed_document_enhanced with duplicate detection to Windmill.

This update adds:
- SHA-256 content hashing for duplicate detection
- Check for duplicates BEFORE any expensive AI operations
- Returns existing document info if duplicate found

Prerequisites:
- Docker Desktop must be running
- Windmill container must be up: docker compose up -d (from windmill-setup/)

Usage:
    python scripts/deploy_duplicate_detection.py
"""
import requests
import sys
from pathlib import Path

WINDMILL_URL = "http://localhost"
TOKEN = "t8u4sIJRGhaHPqLn0VuUPUPbWSa9uTyi"
WORKSPACE = "family-brain"

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


def check_windmill_health():
    """Check if Windmill is running."""
    try:
        resp = requests.get(f"{WINDMILL_URL}/api/version", timeout=5)
        return resp.status_code == 200
    except requests.exceptions.ConnectionError:
        return False


def deploy_script(file_path: Path) -> bool:
    """Deploy embed_document_enhanced to Windmill."""
    if not file_path.exists():
        print(f"  ERROR: {file_path} not found")
        return False

    script_content = file_path.read_text(encoding='utf-8')

    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    script_path = "f/chatbot/embed_document_enhanced"

    # Archive old version (if exists)
    archive_resp = requests.post(
        f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/{script_path}",
        headers=headers
    )
    print(f"  Archive response: {archive_resp.status_code}")

    # Create new version
    payload = {
        "path": script_path,
        "summary": "Enhanced document embedding with duplicate detection",
        "description": "Embed documents with AI features: auto-categorization, tag extraction, expiry detection. Now includes SHA-256 content hashing to detect and prevent exact duplicate uploads.",
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
        print(f"  OK: {script_path} deployed successfully")
        result = resp.json()
        print(f"  Hash: {result.get('hash', 'unknown')}")
        return True
    else:
        print(f"  FAILED: {script_path} - {resp.status_code}")
        print(f"    {resp.text[:300]}")
        return False


def main():
    print("=" * 50)
    print("Deploy embed_document_enhanced with Duplicate Detection")
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

    # Deploy the script
    scripts_dir = Path(__file__).parent
    file_path = scripts_dir / "embed_document_enhanced.py"

    print("Deploying embed_document_enhanced.py...")
    if deploy_script(file_path):
        print()
        print("-" * 50)
        print("Deployment successful!")
        print()
        print("New features:")
        print("  - SHA-256 content hashing for duplicate detection")
        print("  - Checks for duplicates BEFORE expensive AI operations")
        print("  - Returns existing document info if duplicate found")
        return 0
    else:
        print()
        print("Deployment failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())

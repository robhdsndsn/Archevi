#!/usr/bin/env python3
"""
Deploy timeline-related Windmill scripts.

Scripts deployed:
- f/chatbot/get_timeline_events - Fetch timeline events with filters
- f/chatbot/generate_timeline_events - Extract events from documents using AI
- f/chatbot/manage_timeline_event - Create, update, delete timeline events

Usage:
    python scripts/deploy_timeline_scripts.py
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
certifi==2025.6.15
charset-normalizer==3.3.2
distro==1.9.0
groq==0.18.0
h11==0.16.0
httpcore==1.0.7
httpx==0.28.1
idna==3.10
psycopg2-binary==2.9.9
pydantic==2.10.5
pydantic_core==2.27.2
sniffio==1.3.1
typing_extensions==4.12.2
wmill==1.589.3"""

# Scripts to deploy
SCRIPTS = [
    {
        "file": "get_timeline_events.py",
        "path": "f/chatbot/get_timeline_events",
        "summary": "Fetch timeline events with filters",
        "description": "Fetch timeline events for a tenant with optional filters by date, type, family member, or document."
    },
    {
        "file": "generate_timeline_events.py",
        "path": "f/chatbot/generate_timeline_events",
        "summary": "Extract timeline events from documents using AI",
        "description": "Use AI to analyze document content and extract significant dates/events for the timeline."
    },
    {
        "file": "manage_timeline_event.py",
        "path": "f/chatbot/manage_timeline_event",
        "summary": "Create, update, delete timeline events",
        "description": "Manage timeline events - create new events manually, update existing ones, or delete them."
    }
]

def check_windmill_health():
    """Check if Windmill is running."""
    try:
        resp = requests.get(f"{WINDMILL_URL}/api/version", timeout=5)
        if resp.status_code == 200:
            print(f"Windmill is running: {resp.text.strip()}")
            return True
    except requests.exceptions.RequestException as e:
        print(f"Cannot connect to Windmill: {e}")
    return False

def ensure_folder_exists():
    """Ensure the chatbot folder exists."""
    headers = {"Authorization": f"Bearer {TOKEN}"}

    # Check if folder exists
    resp = requests.get(
        f"{WINDMILL_URL}/api/w/{WORKSPACE}/folders/get/chatbot",
        headers=headers
    )

    if resp.status_code == 404:
        print("Creating chatbot folder...")
        resp = requests.post(
            f"{WINDMILL_URL}/api/w/{WORKSPACE}/folders/create",
            headers=headers,
            json={"name": "chatbot"}
        )
        if resp.status_code not in [200, 201]:
            print(f"Failed to create folder: {resp.text}")
            return False
        print("Folder created successfully")
    else:
        print("Folder chatbot already exists")

    return True

def read_script_content(filename):
    """Read script content, skipping header comments."""
    script_path = Path(__file__).parent / filename
    if not script_path.exists():
        print(f"Script file not found: {script_path}")
        return None

    with open(script_path, 'r') as f:
        lines = f.readlines()

    # Skip header comments (lines starting with #) at the beginning
    content_lines = []
    in_header = True
    for line in lines:
        if in_header and (line.startswith('#') or line.strip() == ''):
            continue
        in_header = False
        content_lines.append(line)

    return ''.join(content_lines)

def deploy_script(script_info):
    """Deploy a single script to Windmill."""
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    content = read_script_content(script_info["file"])
    if not content:
        return False

    payload = {
        "path": script_info["path"],
        "summary": script_info["summary"],
        "description": script_info["description"],
        "content": content,
        "language": "python3",
        "lock": LOCK_CONTENT
    }

    # Try to create the script
    resp = requests.post(
        f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create",
        headers=headers,
        json=payload
    )

    if resp.status_code in [200, 201]:
        print(f"  Created: {script_info['path']}")
        return True
    elif "already exists" in resp.text.lower() or "duplicate" in resp.text.lower():
        # Script exists, try to update by creating a new version
        print(f"  Script exists, creating new version...")
        resp = requests.post(
            f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create",
            headers=headers,
            json={**payload, "parent_hash": None}
        )
        if resp.status_code in [200, 201]:
            print(f"  Updated: {script_info['path']}")
            return True

    print(f"  Failed to deploy {script_info['path']}: {resp.status_code} - {resp.text}")
    return False

def main():
    print("Deploying Timeline Scripts to Windmill")
    print("=" * 50)

    if not check_windmill_health():
        print("Windmill is not available. Please start it first.")
        sys.exit(1)

    if not ensure_folder_exists():
        print("Failed to ensure folder exists.")
        sys.exit(1)

    print("\nDeploying scripts...")
    success_count = 0
    for script in SCRIPTS:
        print(f"\nProcessing: {script['file']}")
        if deploy_script(script):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"Deployed {success_count}/{len(SCRIPTS)} scripts successfully")

    if success_count < len(SCRIPTS):
        sys.exit(1)

if __name__ == "__main__":
    main()

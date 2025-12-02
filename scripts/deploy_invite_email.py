#!/usr/bin/env python3
"""
Deploy updated manage_family_members script with email invite support.

This updates the generate_invite action to send invitation emails via Resend.

Usage:
    python scripts/deploy_invite_email.py
"""
import requests
import json
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
distro==1.9.0
h11==0.16.0
httpcore==1.0.7
httpx==0.28.1
idna==3.10
psycopg2-binary==2.9.9
pydantic==2.10.5
pydantic_core==2.27.2
requests==2.32.3
resend==2.0.0
sniffio==1.3.1
typing_extensions==4.12.2
urllib3==2.2.3
wmill==1.404.0"""


def check_windmill_health():
    """Check if Windmill is running."""
    try:
        resp = requests.get(f"{WINDMILL_URL}/api/version", timeout=5)
        return resp.status_code == 200
    except Exception as e:
        print(f"[ERROR] Windmill not reachable: {e}")
        return False


def read_script_file(filename):
    """Read script content from file."""
    scripts_dir = Path(__file__).parent
    filepath = scripts_dir / filename
    if not filepath.exists():
        raise FileNotFoundError(f"Script not found: {filepath}")
    return filepath.read_text(encoding='utf-8')


def deploy_script(script_path, content, summary, description, lock=None):
    """Deploy a script to Windmill."""
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    # Archive old version first
    archive_resp = requests.post(
        f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/{script_path}",
        headers=headers
    )
    print(f"  Archive existing: {archive_resp.status_code}")

    payload = {
        "path": script_path,
        "content": content,
        "language": "python3",
        "summary": summary,
        "description": description,
        "is_template": False,
        "kind": "script",
        "lock": lock or LOCK_CONTENT
    }

    # Create new version
    url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create"
    resp = requests.post(url, headers=headers, json=payload)

    if resp.status_code in [200, 201]:
        try:
            result = resp.json()
            hash_val = result.get('hash', 'N/A') if isinstance(result, dict) else resp.text[:16]
        except:
            hash_val = resp.text[:16] if resp.text else 'N/A'
        print(f"  [OK] Deployed {script_path} (hash: {hash_val})")
        return True
    else:
        print(f"  [FAIL] {script_path}: {resp.status_code} - {resp.text[:200]}")
        return False


def main():
    print("=" * 60)
    print("Deploying manage_family_members with email invite support")
    print("=" * 60)

    if not check_windmill_health():
        print("\n[ERROR] Windmill is not running!")
        print("Start it with: docker compose up -d (from windmill-setup/)")
        sys.exit(1)

    print("\n[INFO] Windmill is running")

    # Deploy the updated script
    try:
        content = read_script_file("manage_family_members.py")
        # Add timestamp to description to force new version
        from datetime import datetime
        ts = datetime.now().strftime("%Y-%m-%d %H:%M")
        success = deploy_script(
            "f/chatbot/manage_family_members",
            content,
            "Manage family members with email invites",
            f"CRUD operations for family members. generate_invite action sends invitation emails via Resend. Updated: {ts}"
        )

        if success:
            print("\n" + "=" * 60)
            print("Deployment complete!")
            print("=" * 60)
            print("\nThe generate_invite action will now:")
            print("1. Generate a secure invite token")
            print("2. Store it in the database")
            print("3. Send an email to the invitee via Resend")
            print("4. Return email_sent: true/false in the response")
            print("\nNote: Requires u/admin/resend_api_key variable in Windmill")
        else:
            sys.exit(1)

    except FileNotFoundError as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

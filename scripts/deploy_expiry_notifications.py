#!/usr/bin/env python3
"""
Deploy expiry notification script to Windmill and optionally create a schedule.

Usage:
    python scripts/deploy_expiry_notifications.py
    python scripts/deploy_expiry_notifications.py --with-schedule
"""
import requests
import json
import sys
from pathlib import Path
from datetime import datetime

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


def create_schedule(script_path, schedule_name, cron, summary):
    """Create a Windmill schedule for the script."""
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "path": f"schedule/{schedule_name}",
        "schedule": cron,
        "timezone": "America/Toronto",
        "script_path": script_path,
        "is_flow": False,
        "args": {"dry_run": False, "force_send": False},
        "enabled": True,
        "summary": summary
    }

    url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/schedules/create"
    resp = requests.post(url, headers=headers, json=payload)

    if resp.status_code in [200, 201]:
        print(f"  [OK] Created schedule: {schedule_name}")
        return True
    elif resp.status_code == 409:
        # Schedule exists, update it
        url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/schedules/update/schedule/{schedule_name}"
        resp = requests.post(url, headers=headers, json=payload)
        if resp.status_code in [200, 201]:
            print(f"  [OK] Updated schedule: {schedule_name}")
            return True
        else:
            print(f"  [FAIL] Update schedule: {resp.status_code} - {resp.text[:200]}")
            return False
    else:
        print(f"  [FAIL] Create schedule: {resp.status_code} - {resp.text[:200]}")
        return False


def main():
    with_schedule = "--with-schedule" in sys.argv

    print("=" * 60)
    print("Deploying send_expiry_notifications script")
    print("=" * 60)

    if not check_windmill_health():
        print("\n[ERROR] Windmill is not running!")
        print("Start it with: docker compose up -d (from windmill-setup/)")
        sys.exit(1)

    print("\n[INFO] Windmill is running")

    # Deploy the script
    try:
        content = read_script_file("send_expiry_notifications.py")
        ts = datetime.now().strftime("%Y-%m-%d %H:%M")
        success = deploy_script(
            "f/chatbot/send_expiry_notifications",
            content,
            "Send document expiry notification emails",
            f"Checks for expiring documents and sends notification emails to admins. Run daily. Updated: {ts}"
        )

        if not success:
            sys.exit(1)

        print("\n" + "=" * 60)
        print("Deployment complete!")
        print("=" * 60)

        if with_schedule:
            print("\nCreating daily schedule...")
            # Run at 8am Toronto time every day
            # Windmill uses 6-field cron: seconds minutes hours day month weekday
            create_schedule(
                "f/chatbot/send_expiry_notifications",
                "daily_expiry_notifications",
                "0 0 8 * * *",  # 8am daily (seconds minutes hours day month weekday)
                "Daily document expiry notification check"
            )
            print("\nSchedule created: runs daily at 8am UTC")
        else:
            print("\nTo create a daily schedule, run with --with-schedule flag")
            print("Or manually create in Windmill UI:")
            print("  - Script: f/chatbot/send_expiry_notifications")
            print("  - Cron: 0 8 * * * (daily at 8am UTC)")

        print("\nTo test the script:")
        print("  1. Run with dry_run=true to see what would be sent")
        print("  2. Run with force_send=true to send all notifications")

    except FileNotFoundError as e:
        print(f"\n[ERROR] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

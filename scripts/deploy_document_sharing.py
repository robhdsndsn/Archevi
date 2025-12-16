#!/usr/bin/env python3
"""
Deploy document sharing feature:
1. Run migration 007
2. Deploy manage_document_shares script to Windmill
"""

import subprocess
import sys
from pathlib import Path

# Windmill configuration
WINDMILL_URL = "http://localhost"
WORKSPACE = "family-brain"
SCRIPT_PATH = "f/chatbot/manage_document_shares"

def run_migration():
    """Run the document sharing migration."""
    print("\n=== Running Migration 007: Document Sharing ===\n")

    migration_file = Path(__file__).parent.parent / "Infrastructure" / "migrations" / "007_document_sharing.sql"

    if not migration_file.exists():
        print(f"ERROR: Migration file not found: {migration_file}")
        return False

    # Read migration
    with open(migration_file, "r") as f:
        migration_sql = f.read()

    print(f"Migration file: {migration_file}")
    print(f"SQL length: {len(migration_sql)} characters")

    # Connect to database and run migration
    try:
        import psycopg2

        # Use the same connection settings as Windmill scripts
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            dbname="windmill",
            user="postgres",
            password="changeme",
            sslmode="prefer"
        )
        conn.autocommit = True

        with conn.cursor() as cur:
            # Check if migration already applied
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'document_shares'
                )
            """)
            if cur.fetchone()[0]:
                print("INFO: document_shares table already exists. Skipping migration.")
                conn.close()
                return True

            # Run migration
            print("Executing migration SQL...")
            cur.execute(migration_sql)
            print("Migration executed successfully!")

        conn.close()
        return True

    except ImportError:
        print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
        return False
    except Exception as e:
        print(f"ERROR: Migration failed: {e}")
        return False


def deploy_script():
    """Deploy the manage_document_shares script to Windmill."""
    print("\n=== Deploying manage_document_shares Script ===\n")

    script_file = Path(__file__).parent / "manage_document_shares.py"

    if not script_file.exists():
        print(f"ERROR: Script file not found: {script_file}")
        return False

    with open(script_file, "r") as f:
        script_content = f.read()

    print(f"Script file: {script_file}")
    print(f"Script length: {len(script_content)} characters")

    # Deploy via Windmill CLI or API
    try:
        import urllib.request
        import urllib.error
        import json

        # Get token from config
        from config import get_windmill_token
        token = get_windmill_token()

        # Create script via API
        url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create"

        payload = {
            "path": SCRIPT_PATH,
            "summary": "Manage document sharing between family members",
            "description": "Share, unshare, and list document shares. Actions: share, unshare, list_shared_with_me, list_shared_by_me, get_document_shares, mark_notification_read, get_tenant_members",
            "content": script_content,
            "language": "python3",
            "is_template": False,
            "schema": {
                "$schema": "https://json-schema.org/draft/2020-12/schema",
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "default": "list_shared_with_me",
                        "enum": ["share", "unshare", "list_shared_with_me", "list_shared_by_me", "get_document_shares", "mark_notification_read", "get_tenant_members"],
                        "description": "Action to perform"
                    },
                    "document_id": {
                        "type": "string",
                        "description": "UUID of the document"
                    },
                    "user_id": {
                        "type": "string",
                        "description": "UUID of the current user"
                    },
                    "tenant_id": {
                        "type": "string",
                        "description": "UUID of the tenant"
                    },
                    "share_data": {
                        "type": "object",
                        "description": "Share configuration (shared_with_user_id, permission, message)"
                    }
                },
                "required": []
            }
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST")
        req.add_header("Authorization", f"Bearer {token}")
        req.add_header("Content-Type", "application/json")

        try:
            with urllib.request.urlopen(req) as response:
                result = response.read().decode("utf-8")
                print(f"Script deployed successfully!")
                print(f"Response: {result[:200]}")
                return True
        except urllib.error.HTTPError as e:
            error_body = e.read().decode()
            if "already exists" in error_body.lower() or e.code == 409:
                print("Script already exists, updating...")
                # Try update instead
                return update_script(script_content, token)
            print(f"HTTP Error {e.code}: {error_body[:500]}")
            return False

    except Exception as e:
        print(f"ERROR: Deployment failed: {e}")
        return False


def update_script(script_content: str, token: str):
    """Update existing script."""
    import urllib.request
    import urllib.error
    import json

    # First get the current hash
    get_url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/get/p/{SCRIPT_PATH}"
    req = urllib.request.Request(get_url)
    req.add_header("Authorization", f"Bearer {token}")

    try:
        with urllib.request.urlopen(req) as response:
            script_info = json.loads(response.read().decode("utf-8"))
            current_hash = script_info.get("hash")
    except Exception as e:
        print(f"Could not get current script hash: {e}")
        current_hash = None

    if not current_hash:
        print("Cannot update without hash, trying create with archive...")
        return False

    # Update via hash endpoint
    update_url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/update/h/{current_hash}"

    payload = {
        "path": SCRIPT_PATH,
        "summary": "Manage document sharing between family members",
        "description": "Share, unshare, and list document shares. Actions: share, unshare, list_shared_with_me, list_shared_by_me, get_document_shares, mark_notification_read, get_tenant_members",
        "content": script_content,
        "language": "python3"
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(update_url, data=data, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req) as response:
            result = response.read().decode("utf-8")
            print(f"Script updated successfully! New hash: {result}")
            return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"Update failed - HTTP Error {e.code}: {error_body[:500]}")
        return False


def main():
    print("=" * 60)
    print("DOCUMENT SHARING FEATURE DEPLOYMENT")
    print("=" * 60)

    # Run migration
    if not run_migration():
        print("\nMigration failed! Aborting deployment.")
        sys.exit(1)

    # Deploy script
    if not deploy_script():
        print("\nScript deployment failed!")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("DEPLOYMENT COMPLETE!")
    print("=" * 60)
    print(f"\nScript available at: {WINDMILL_URL}/scripts/get/p/{SCRIPT_PATH}")
    print("\nTo test:")
    print(f"  curl -X POST {WINDMILL_URL}/api/w/{WORKSPACE}/jobs/run_wait_result/p/{SCRIPT_PATH}")
    print('       -H "Authorization: Bearer <token>"')
    print('       -H "Content-Type: application/json"')
    print('       -d \'{"action": "get_tenant_members", "tenant_id": "<uuid>", "user_id": "<uuid>"}\'')


if __name__ == "__main__":
    main()

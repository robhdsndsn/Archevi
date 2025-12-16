#!/usr/bin/env python3
"""
Deploy branding/theming scripts to Windmill.
"""

import requests
import os
from config import WINDMILL_URL, WINDMILL_WORKSPACE as WORKSPACE, get_windmill_token

WINDMILL_TOKEN = get_windmill_token()

headers = {
    "Authorization": f"Bearer {WINDMILL_TOKEN}",
    "Content-Type": "application/json"
}

SCRIPTS = [
    {
        "path": "f/chatbot/get_tenant_branding",
        "summary": "Get tenant branding configuration",
        "description": "Returns branding settings for a specific tenant, falling back to system defaults.",
        "file": "get_tenant_branding.py"
    },
    {
        "path": "f/chatbot/update_tenant_branding",
        "summary": "Update tenant branding configuration",
        "description": "Allows admins and tenant owners to customize branding for their tenant.",
        "file": "update_tenant_branding.py"
    },
    {
        "path": "f/chatbot/list_theme_presets",
        "summary": "List available theme presets",
        "description": "Returns all active theme presets that users can choose from.",
        "file": "list_theme_presets.py"
    },
    {
        "path": "f/chatbot/apply_theme_preset",
        "summary": "Apply a theme preset to a tenant",
        "description": "Copies colors from a preset to the tenant's branding configuration.",
        "file": "apply_theme_preset.py"
    },
]

def deploy_script(script_info):
    script_path = script_info["path"]
    script_file = script_info["file"]

    # Read script content
    script_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(script_dir, script_file)

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check if script exists
    check_url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/get/p/{script_path}"
    response = requests.get(check_url, headers=headers)

    if response.status_code == 200:
        # Script exists, archive it first then create new version
        existing = response.json()
        existing_hash = existing.get("hash")

        # Archive old version
        archive_url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/h/{existing_hash}"
        archive_response = requests.post(archive_url, headers=headers)
        if archive_response.status_code != 200:
            print(f"Failed to archive {script_path}: {archive_response.status_code}")
            return False

    # Create (new version)
    create_url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create"
    payload = {
        "path": script_path,
        "summary": script_info["summary"],
        "description": script_info["description"],
        "content": content,
        "language": "python3",
        "is_template": False,
        "schema": {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {},
            "required": []
        }
    }

    response = requests.post(create_url, headers=headers, json=payload)
    if response.status_code == 201:
        print(f"Deployed: {script_path}")
        return True
    else:
        print(f"Failed to create {script_path}: {response.status_code} - {response.text}")
        return False


def main():
    print("Deploying branding scripts to Windmill...")
    print(f"URL: {WINDMILL_URL}")
    print(f"Workspace: {WORKSPACE}")
    print()

    success = 0
    failed = 0

    for script in SCRIPTS:
        if deploy_script(script):
            success += 1
        else:
            failed += 1

    print()
    print(f"Done: {success} succeeded, {failed} failed")


if __name__ == "__main__":
    main()

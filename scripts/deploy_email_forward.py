# deploy_email_forward.py
# Deploy the email forwarding script to Windmill
#
# Usage:
#   python scripts/deploy_email_forward.py
#
# After deployment, configure the email trigger in Windmill UI:
# 1. Go to the script detail page for f/chatbot/process_email_forward
# 2. Click "Triggers" tab
# 3. Add an "Email" trigger
# 4. Configure the email address (e.g., save@archevi.ca)

import requests
import os
from pathlib import Path

# Configuration
WINDMILL_WORKSPACE = "chatbot"
WINDMILL_BASE_URL = os.getenv("WINDMILL_BASE_URL", "https://app.windmill.dev")
WINDMILL_TOKEN = os.getenv("WINDMILL_TOKEN")

# Script path in Windmill
SCRIPT_PATH = "f/chatbot/process_email_forward"

def read_script_content():
    """Read the script content from local file."""
    script_path = Path(__file__).parent / "process_email_forward.py"
    with open(script_path, "r", encoding="utf-8") as f:
        return f.read()

def extract_requirements(content: str) -> list:
    """Extract requirements from script header comments."""
    requirements = []
    in_requirements = False

    for line in content.split('\n'):
        if '# requirements:' in line:
            in_requirements = True
            continue
        if in_requirements:
            if line.startswith('#   - '):
                req = line.replace('#   - ', '').strip()
                if req:
                    requirements.append(req)
            elif line.startswith('#') and not line.startswith('#   '):
                break
            elif not line.startswith('#'):
                break

    return requirements

def deploy_script():
    """Deploy the email forward script to Windmill."""
    if not WINDMILL_TOKEN:
        print("Error: WINDMILL_TOKEN environment variable not set")
        print("Set it with: export WINDMILL_TOKEN=your_token")
        return False

    content = read_script_content()
    requirements = extract_requirements(content)

    # Remove the header comments (Windmill doesn't need them)
    lines = content.split('\n')
    start_idx = 0
    for i, line in enumerate(lines):
        if line.startswith('"""'):
            start_idx = i
            break

    clean_content = '\n'.join(lines[start_idx:])

    # Prepare the script payload
    payload = {
        "path": SCRIPT_PATH,
        "summary": "Process forwarded emails and save as documents",
        "description": "Receives emails via Windmill email trigger, verifies sender, extracts content, and saves to family vault.",
        "content": clean_content,
        "language": "python3",
        "lock": requirements,
        "kind": "script",
        "tag": "email",
        "schema": {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {
                "raw_email": {
                    "type": "string",
                    "description": "Complete raw email string (provided by Windmill email trigger)"
                },
                "parsed_email": {
                    "type": "object",
                    "description": "Parsed email with headers, text_body, html_body, attachments"
                },
                "email_extra_args": {
                    "type": "object",
                    "description": "Extra arguments from email address (e.g., category=medical)"
                }
            },
            "required": []
        }
    }

    headers = {
        "Authorization": f"Bearer {WINDMILL_TOKEN}",
        "Content-Type": "application/json"
    }

    # Check if script exists
    check_url = f"{WINDMILL_BASE_URL}/api/w/{WINDMILL_WORKSPACE}/scripts/get/p/{SCRIPT_PATH}"
    check_response = requests.get(check_url, headers=headers)

    if check_response.status_code == 200:
        # Update existing script
        update_url = f"{WINDMILL_BASE_URL}/api/w/{WINDMILL_WORKSPACE}/scripts/update/p/{SCRIPT_PATH}"
        response = requests.post(update_url, json=payload, headers=headers)
    else:
        # Create new script
        create_url = f"{WINDMILL_BASE_URL}/api/w/{WINDMILL_WORKSPACE}/scripts/create"
        response = requests.post(create_url, json=payload, headers=headers)

    if response.status_code in [200, 201]:
        print(f"Successfully deployed {SCRIPT_PATH}")
        print(f"\nNext steps:")
        print(f"1. Go to Windmill: {WINDMILL_BASE_URL}/scripts/get/{SCRIPT_PATH}")
        print(f"2. Click 'Triggers' tab")
        print(f"3. Add an 'Email' trigger")
        print(f"4. Configure email address: save@archevi.ca")
        print(f"\nNote: Email triggers require:")
        print(f"  - Port 25 exposed on your Windmill instance")
        print(f"  - MX DNS record pointing to your instance")
        print(f"  - Email domain configured in Windmill instance settings")
        return True
    else:
        print(f"Failed to deploy: {response.status_code}")
        print(response.text)
        return False

if __name__ == "__main__":
    deploy_script()

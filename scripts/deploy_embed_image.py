#!/usr/bin/env python3
"""Deploy embed_image.py script to Windmill for visual search feature"""
import urllib.request
import json
import os
from config import WINDMILL_URL, WINDMILL_WORKSPACE as WORKSPACE, get_windmill_token

TOKEN = get_windmill_token()

# Lock file with Pillow added for image resizing
LOCK_CONTENT = """# py: 3.11
annotated-types==0.6.0
anyio==4.5.0
bcrypt==4.2.0
certifi==2025.6.15
charset-normalizer==3.3.2
cohere==5.17.0
distro==1.9.0
fastavro==1.9.4
filelock==3.16.0
fsspec==2024.9.0
groq==0.11.0
h11==0.16.0
httpcore==1.0.7
httpx==0.27.2
httpx-sse==0.4.0
huggingface-hub==0.26.0
idna==3.10
numpy==1.26.4
packaging==24.1
parameterized==0.9.0
Pillow==10.4.0
psycopg2-binary==2.9.9
pgvector==0.2.4
pydantic==2.10.5
pydantic_core==2.27.2
PyJWT==2.8.0
pypdf==5.0.0
PyYAML==6.0.2
requests==2.32.3
resend==0.8.0
sniffio==1.3.1
stripe==7.0.0
tokenizers==0.15.2
tqdm==4.66.5
types-requests==2.32.0.20240914
typing_extensions==4.12.2
typing_inspection==0.4.0
urllib3==2.2.3
wmill==1.404.0"""

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def make_request(url, method="GET", data=None):
    """Make HTTP request to Windmill API"""
    req = urllib.request.Request(url, method=method, headers=headers)
    if data:
        req.data = json.dumps(data).encode('utf-8')
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        return resp.status, resp.read().decode('utf-8')
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')
    except Exception as e:
        return 0, str(e)

def deploy_script(filename, path, summary):
    """Deploy a single script to Windmill"""
    if not os.path.exists(filename):
        return False, f"File not found: {filename}"

    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # Archive old version (if exists)
    status, _ = make_request(
        f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/{path}",
        method="POST"
    )

    # Create new version
    payload = {
        "path": path,
        "summary": summary,
        "description": f"{summary} - Cohere Embed v4 multimodal",
        "content": content,
        "language": "python3",
        "lock": LOCK_CONTENT
    }

    status, response = make_request(
        f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create",
        method="POST",
        data=payload
    )

    if status == 201:
        return True, response
    else:
        return False, f"HTTP {status}: {response[:200]}"

def main():
    print("=" * 70)
    print("Deploying embed_image.py for visual search")
    print("=" * 70)

    # Change to scripts directory
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(scripts_dir)

    scripts = [
        ("embed_image.py", "f/chatbot/embed_image", "Embed image for visual search"),
        # Also update search_documents_advanced with Pillow dependency
        ("search_documents_advanced.py", "f/chatbot/search_documents_advanced", "Advanced document search with image support"),
    ]

    for filename, path, summary in scripts:
        print(f"\nDeploying {filename}...")
        success, result = deploy_script(filename, path, summary)
        if success:
            # Parse hash from response
            try:
                data = json.loads(result)
                hash_val = data if isinstance(data, str) else data.get('hash', 'unknown')
                print(f"  SUCCESS: {path} (hash: {hash_val})")
            except:
                print(f"  SUCCESS: {path}")
        else:
            print(f"  FAILED: {result}")

    print("\n" + "=" * 70)
    print("Deployment complete!")
    print("=" * 70)

if __name__ == "__main__":
    main()

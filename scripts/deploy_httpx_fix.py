#!/usr/bin/env python3
"""Deploy all scripts with httpx dependency fix to Windmill"""
import urllib.request
import json
import os
import re
from config import WINDMILL_URL, WINDMILL_WORKSPACE as WORKSPACE, get_windmill_token

TOKEN = get_windmill_token()

# Complete lock file with ALL dependencies including httpx, bcrypt, pypdf, groq
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

# Scripts to deploy with their Windmill paths
SCRIPTS = [
    ("get_document.py", "f/chatbot/get_document", "Get a single document"),
    ("extract_document_data.py", "f/chatbot/extract_document_data", "Extract structured data from documents"),
    ("process_email_forward.py", "f/chatbot/process_email_forward", "Process forwarded emails"),
    ("process_zip_upload.py", "f/chatbot/process_zip_upload", "Process bulk ZIP uploads"),
    ("manage_family_members.py", "f/chatbot/manage_family_members", "Manage family members"),
    ("rag_query.py", "f/chatbot/rag_query", "RAG query with reranking"),
    ("auth_refresh.py", "f/chatbot/auth_refresh", "Refresh auth token"),
    ("auth_login.py", "f/chatbot/auth_login", "User login"),
    ("auth_logout.py", "f/chatbot/auth_logout", "User logout"),
    ("auth_request_password_reset.py", "f/chatbot/auth_request_password_reset", "Request password reset"),
    ("auth_set_password.py", "f/chatbot/auth_set_password", "Set new password"),
    ("search_documents_advanced.py", "f/chatbot/search_documents_advanced", "Advanced document search"),
    ("search_documents.py", "f/chatbot/search_documents", "Basic document search"),
    ("embed_document_enhanced.py", "f/chatbot/embed_document_enhanced", "Enhanced document embedding"),
    ("embed_document.py", "f/chatbot/embed_document", "Basic document embedding"),
    ("update_document.py", "f/chatbot/update_document", "Update document"),
    ("delete_document.py", "f/chatbot/delete_document", "Delete document"),
    ("admin_list_documents.py", "f/chatbot/admin_list_documents", "Admin list all documents"),
    ("send_expiry_notifications.py", "f/chatbot/send_expiry_notifications", "Send expiry notifications"),
    ("suggest_tags.py", "f/chatbot/suggest_tags", "Suggest document tags"),
    ("get_expiring_documents.py", "f/chatbot/get_expiring_documents", "Get expiring documents"),
    ("get_tags.py", "f/chatbot/get_tags", "Get all tags"),
    ("get_analytics.py", "f/chatbot/get_analytics", "Get analytics data"),
    ("get_conversation_history.py", "f/chatbot/get_conversation_history", "Get conversation history"),
    ("bulk_upload_documents.py", "f/chatbot/bulk_upload_documents", "Bulk upload documents"),
    ("transcribe_voice_note.py", "f/chatbot/transcribe_voice_note", "Transcribe voice notes"),
    ("health_check.py", "f/chatbot/health_check", "Health check endpoint"),
    # Tenant management scripts
    ("create_tenant.py", "f/chatbot/create_tenant", "Create new tenant"),
    ("get_tenant_details.py", "f/chatbot/get_tenant_details", "Get tenant details"),
    ("list_tenants.py", "f/chatbot/list_tenants", "List all tenants"),
    ("update_tenant.py", "f/chatbot/update_tenant", "Update tenant"),
    ("get_user_tenants.py", "f/chatbot/get_user_tenants", "Get user's tenants"),
    ("invite_to_tenant.py", "f/chatbot/invite_to_tenant", "Invite user to tenant"),
    ("switch_tenant.py", "f/chatbot/switch_tenant", "Switch active tenant"),
    ("provision_tenant.py", "f/chatbot/provision_tenant", "Provision new tenant"),
    ("provisioning_worker.py", "f/chatbot/provisioning_worker", "Tenant provisioning worker"),
]

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

    # Archive old version
    status, _ = make_request(
        f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/{path}",
        method="POST"
    )

    # Create new version
    payload = {
        "path": path,
        "summary": summary,
        "description": f"{summary} - with httpx dependency",
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
    print("Deploying all scripts with httpx dependency fix")
    print("=" * 70)

    success = 0
    failed = 0

    for filename, path, summary in SCRIPTS:
        print(f"\n--- {filename} -> {path} ---")
        ok, msg = deploy_script(filename, path, summary)
        if ok:
            print(f"  SUCCESS")
            success += 1
        else:
            print(f"  FAILED: {msg}")
            failed += 1

    print("\n" + "=" * 70)
    print(f"Deployment complete: {success} succeeded, {failed} failed")
    print("=" * 70)

if __name__ == "__main__":
    main()

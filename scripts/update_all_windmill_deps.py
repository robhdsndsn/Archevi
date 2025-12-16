#!/usr/bin/env python3
"""
Update ALL Windmill scripts with complete dependencies.
This ensures all scripts have the proper transitive dependencies
including httpx, httpcore, etc. that wmill requires.
"""

import requests
import json
import os
from config import WINDMILL_URL, WINDMILL_WORKSPACE as WORKSPACE, get_windmill_token

WINDMILL_TOKEN = get_windmill_token()

headers = {
    'Authorization': f'Bearer {WINDMILL_TOKEN}',
    'Content-Type': 'application/json'
}

# The complete base lock file with ALL transitive dependencies
BASE_LOCK = """wmill
fastavro
tokenizers
types-requests
huggingface-hub
filelock
fsspec
packaging
pyyaml
tqdm
requests
urllib3
charset-normalizer
httpx
httpx-sse
httpcore
h11
anyio
sniffio
idna
certifi
pydantic
pydantic-core
annotated-types
typing_extensions
typing_inspection"""

# Mapping from script path to local file and extra deps
SCRIPT_MAPPING = {
    'f/chatbot/rag_query': {'file': 'rag_query.py', 'extra_deps': ['cohere', 'psycopg2-binary', 'pgvector', 'numpy']},
    'f/chatbot/embed_document': {'file': 'embed_document.py', 'extra_deps': ['cohere', 'psycopg2-binary', 'pgvector', 'numpy']},
    'f/chatbot/embed_document_enhanced': {'file': 'embed_document_enhanced.py', 'extra_deps': ['cohere', 'psycopg2-binary', 'pgvector', 'numpy']},
    'f/chatbot/search_documents': {'file': 'search_documents.py', 'extra_deps': ['cohere', 'psycopg2-binary']},
    'f/chatbot/search_documents_advanced': {'file': 'search_documents_advanced.py', 'extra_deps': ['cohere', 'psycopg2-binary']},
    'f/chatbot/get_document': {'file': 'get_document.py', 'extra_deps': ['psycopg2-binary']},
    'f/chatbot/update_document': {'file': 'update_document.py', 'extra_deps': ['cohere', 'psycopg2-binary', 'pgvector', 'numpy']},
    'f/chatbot/delete_document': {'file': 'delete_document.py', 'extra_deps': ['psycopg2-binary']},
    'f/chatbot/manage_family_members': {'file': 'manage_family_members.py', 'extra_deps': ['psycopg2-binary']},
    'f/chatbot/auth_login': {'file': 'auth_login.py', 'extra_deps': ['psycopg2-binary', 'bcrypt', 'pyjwt', 'cryptography']},
    'f/chatbot/auth_verify': {'file': 'auth_verify.py', 'extra_deps': ['psycopg2-binary', 'pyjwt', 'cryptography']},
    'f/chatbot/auth_refresh': {'file': 'auth_refresh.py', 'extra_deps': ['psycopg2-binary', 'pyjwt', 'cryptography']},
    'f/chatbot/auth_logout': {'file': 'auth_logout.py', 'extra_deps': ['psycopg2-binary']},
    'f/chatbot/auth_set_password': {'file': 'auth_set_password.py', 'extra_deps': ['psycopg2-binary', 'bcrypt']},
    'f/chatbot/get_analytics': {'file': 'get_analytics.py', 'extra_deps': ['psycopg2-binary']},
    'f/chatbot/get_tags': {'file': 'get_tags.py', 'extra_deps': ['psycopg2-binary']},
    'f/chatbot/get_expiring_documents': {'file': 'get_expiring_documents.py', 'extra_deps': ['psycopg2-binary']},
    'f/chatbot/suggest_tags': {'file': 'suggest_tags.py', 'extra_deps': ['cohere', 'psycopg2-binary']},
    'f/chatbot/parse_pdf': {'file': 'parse_pdf.py', 'extra_deps': ['pymupdf']},
    'f/chatbot/transcribe_voice_note': {'file': 'transcribe_voice_note.py', 'extra_deps': ['cohere', 'psycopg2-binary', 'pgvector', 'numpy']},
    'f/chatbot/health_check': {'file': 'health_check.py', 'extra_deps': ['cohere', 'psycopg2-binary']},
    'f/chatbot/get_conversation_history': {'file': 'get_conversation_history.py', 'extra_deps': ['psycopg2-binary']},
    'f/chatbot/bulk_upload_documents': {'file': 'bulk_upload_documents.py', 'extra_deps': ['cohere', 'psycopg2-binary', 'pgvector', 'numpy']},
    'f/chatbot/send_expiry_notifications': {'file': 'send_expiry_notifications.py', 'extra_deps': ['psycopg2-binary']},
    'f/chatbot/admin_list_documents': {'file': 'admin_list_documents.py', 'extra_deps': ['psycopg2-binary']},
    'f/admin/create_tenant': {'file': 'create_tenant.py', 'extra_deps': ['psycopg2-binary']},
    'f/admin/update_tenant': {'file': 'update_tenant.py', 'extra_deps': ['psycopg2-binary']},
    'f/admin/get_tenant_details': {'file': 'get_tenant_details.py', 'extra_deps': ['psycopg2-binary']},
    'f/tenant/switch_tenant': {'file': 'switch_tenant.py', 'extra_deps': ['psycopg2-binary']},
    'f/tenant/check_db_state': {'file': 'check_db_state.py', 'extra_deps': ['psycopg2-binary']},
    'f/tenant/run_multi_tenant_migration': {'file': 'run_multi_tenant_migration.py', 'extra_deps': ['psycopg2-binary']},
    'f/tenant/test_multi_tenant_system': {'file': 'test_multi_tenant_system.py', 'extra_deps': ['psycopg2-binary']},
    'f/migrations/add_assigned_to': {'file': 'add_assigned_to_migration.py', 'extra_deps': ['psycopg2-binary']},
}


def main():
    # List all active scripts
    url = f'{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/list'
    response = requests.get(url, headers=headers)
    active_scripts = [s['path'] for s in response.json() if not s.get('archived', False)]

    print(f'Found {len(active_scripts)} active scripts')
    print(f'Have mapping for {len(SCRIPT_MAPPING)} scripts')
    print()

    # Update each script
    updated = 0
    failed = 0
    skipped = 0

    for script_path in active_scripts:
        if script_path not in SCRIPT_MAPPING:
            print(f'SKIP: {script_path} - no local file mapping')
            skipped += 1
            continue

        mapping = SCRIPT_MAPPING[script_path]
        local_file = mapping['file']
        extra_deps = mapping['extra_deps']

        if not os.path.exists(local_file):
            print(f'SKIP: {script_path} - local file {local_file} not found')
            skipped += 1
            continue

        # Read local file content
        with open(local_file, 'r') as f:
            content = f.read()

        # Build lock file
        lock = '\n'.join(extra_deps) + '\n' + BASE_LOCK

        # Archive old version
        encoded_path = script_path.replace('/', '%2F')
        archive_url = f'{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/archive/p/{encoded_path}'
        requests.post(archive_url, headers=headers)

        # Create new version
        payload = {
            'path': script_path,
            'summary': f'Script with complete dependencies',
            'description': f'Script with complete dependencies',
            'content': content,
            'language': 'python3',
            'lock': lock,
            'kind': 'script'
        }

        url = f'{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create'
        response = requests.post(url, headers=headers, json=payload)

        if response.status_code in [200, 201]:
            print(f'OK: {script_path}')
            updated += 1
        else:
            print(f'FAIL: {script_path} - {response.status_code}: {response.text[:100]}')
            failed += 1

    print()
    print(f'Summary: {updated} updated, {failed} failed, {skipped} skipped')


if __name__ == '__main__':
    main()

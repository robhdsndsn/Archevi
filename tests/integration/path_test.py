#!/usr/bin/env python3
"""
FamilySecondBrain Comprehensive Path Test
Tests all major endpoints and user flows via API
"""

import urllib.request
import urllib.error
import json
import time
import uuid
import os
from config import WINDMILL_BASE_URL, get_windmill_token, DEFAULT_TENANT_ID

API_BASE = WINDMILL_BASE_URL
TOKEN = f'Bearer {get_windmill_token()}'
TEST_TENANT = DEFAULT_TENANT_ID or os.getenv('TEST_TENANT_ID', '')

def api_call(endpoint, payload=None, timeout=90):
    url = f'{API_BASE}{endpoint}'
    data = json.dumps(payload if payload else {}).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Authorization', TOKEN)
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            try:
                return {'ok': True, 'data': json.loads(resp.read().decode())}
            except:
                return {'ok': True, 'data': resp.read().decode()}
    except urllib.error.HTTPError as e:
        return {'ok': False, 'status': e.code, 'error': e.read().decode()[:300]}
    except Exception as e:
        return {'ok': False, 'error': str(e)}

def main():
    print('=' * 70)
    print('FAMILYSECONDBRAIN COMPREHENSIVE PATH TEST')
    print('=' * 70)

    test_id = str(uuid.uuid4())[:8]
    print(f'Test ID: {test_id}')
    print()

    results = []
    test_doc_id = None

    def run_test(name, endpoint, payload, success_check=None, timeout=90):
        nonlocal test_doc_id
        print(f'Testing: {name}...')
        r = api_call(endpoint, payload, timeout)

        if r['ok']:
            data = r['data']
            if success_check:
                passed, details = success_check(data)
            elif isinstance(data, dict):
                passed = data.get('success', True) and 'error' not in data
                details = str(data)[:100] if not passed else 'OK'
            else:
                passed = True
                details = 'OK'
        else:
            passed = False
            details = r.get('error', 'HTTP error')[:80]

        status = 'PASS' if passed else 'FAIL'
        results.append((name, status, details))
        print(f'  [{status}] {details[:60]}')
        return r['data'] if r['ok'] else None

    # ================================================================
    # 1. SYSTEM HEALTH
    # ================================================================
    print('\n=== SYSTEM HEALTH ===')
    run_test('Database Stats', '/jobs/run_wait_result/p/f/chatbot/get_database_stats',
        {'tenant_id': TEST_TENANT},
        lambda d: (True, f"Docs: {d.get('document_count')}, Users: {d.get('member_count')}"))

    run_test('Embedding Stats', '/jobs/run_wait_result/p/f/chatbot/get_embedding_stats',
        {'tenant_id': TEST_TENANT},
        lambda d: (d.get('success', True), f"Embeddings: {d.get('total_embeddings', d.get('count', 'N/A'))}"))

    # ================================================================
    # 2. USER/TENANT OPERATIONS
    # ================================================================
    print('\n=== USER & TENANT ===')
    run_test('List Tenants', '/jobs/run_wait_result/p/f/chatbot/list_tenants', {},
        lambda d: (isinstance(d, list) or d.get('success'), f"Found {len(d) if isinstance(d, list) else len(d.get('tenants', []))} tenants"))

    run_test('Get Tenant Details', '/jobs/run_wait_result/p/f/chatbot/get_tenant_details',
        {'tenant_id': TEST_TENANT},
        lambda d: (d.get('success', 'tenant' in d), f"Family: {d.get('tenant', d).get('family_name', d.get('name', 'N/A'))}"))

    run_test('Manage Members (List)', '/jobs/run_wait_result/p/f/chatbot/manage_family_members',
        {'action': 'list', 'tenant_id': TEST_TENANT},
        lambda d: (d.get('success'), f"Found {len(d.get('members', []))} members"))

    # ================================================================
    # 3. DOCUMENT OPERATIONS
    # ================================================================
    print('\n=== DOCUMENTS ===')
    docs_result = run_test('Admin List Documents', '/jobs/run_wait_result/p/f/chatbot/admin_list_documents',
        {'tenant_id': TEST_TENANT, 'limit': 10},
        lambda d: (d.get('success', 'documents' in d), f"Found {len(d.get('documents', []))} documents"))

    if docs_result and docs_result.get('documents'):
        test_doc_id = docs_result['documents'][0]['id']
        doc_title = docs_result['documents'][0].get('title', 'Unknown')[:30]
        print(f'  Using doc #{test_doc_id}: {doc_title}')

    if test_doc_id:
        run_test('Get Document', '/jobs/run_wait_result/p/f/chatbot/get_document',
            {'document_id': test_doc_id, 'tenant_id': TEST_TENANT},
            lambda d: (d.get('success'), f"Got: {d.get('document', {}).get('title', 'N/A')[:40]}"))

    run_test('Get Tags', '/jobs/run_wait_result/p/f/chatbot/get_tags',
        {'tenant_id': TEST_TENANT},
        lambda d: (d.get('success'), f"Found {len(d.get('tags', []))} tags"))

    run_test('Get Expiring Documents', '/jobs/run_wait_result/p/f/chatbot/get_expiring_documents',
        {'tenant_id': TEST_TENANT, 'days_ahead': 90},
        lambda d: (d.get('success'), f"Found {len(d.get('documents', []))} expiring"))

    # ================================================================
    # 4. SEARCH FEATURES
    # ================================================================
    print('\n=== SEARCH ===')
    run_test('Search Suggestions', '/jobs/run_wait_result/p/f/chatbot/get_search_suggestions',
        {'query_prefix': 'tax', 'tenant_id': TEST_TENANT, 'limit': 5},
        lambda d: (d.get('success'), f"Found {len(d.get('suggestions', []))} suggestions"))

    run_test('Search Advanced', '/jobs/run_wait_result/p/f/chatbot/search_documents_advanced',
        {'query': 'medical records', 'tenant_id': TEST_TENANT, 'limit': 5},
        lambda d: (d.get('success'), f"Found {len(d.get('results', []))} results"))

    if test_doc_id:
        run_test('Related Documents', '/jobs/run_wait_result/p/f/chatbot/get_related_documents',
            {'document_id': test_doc_id, 'tenant_id': TEST_TENANT, 'limit': 3},
            lambda d: (d.get('success'), f"Found {len(d.get('related', []))} related"))

    # ================================================================
    # 5. AI/RAG CHAT
    # ================================================================
    print('\n=== AI CHAT ===')
    run_test('RAG Query Agent', '/jobs/run_wait_result/p/f/chatbot/rag_query_agent',
        {'user_message': 'What insurance policies do we have?', 'tenant_id': TEST_TENANT},
        lambda d: (len(d.get('answer', '')) > 20, f"Answer: {d.get('answer', '')[:50]}..."),
        timeout=120)

    run_test('RAG Agent - Llama 4 Scout', '/jobs/run_wait_result/p/f/chatbot/rag_query_agent',
        {'user_message': 'Show medical documents', 'tenant_id': TEST_TENANT, 'model': 'llama-4-scout-17b-16e-instruct'},
        lambda d: (len(d.get('answer', '')) > 10, f"Sources: {len(d.get('sources', []))}"),
        timeout=120)

    # ================================================================
    # 6. ANALYTICS & STATS
    # ================================================================
    print('\n=== ANALYTICS ===')
    run_test('Get Analytics', '/jobs/run_wait_result/p/f/chatbot/get_analytics',
        {'tenant_id': TEST_TENANT},
        lambda d: (d.get('success', 'error' not in d), 'Analytics retrieved'))

    run_test('Get Usage Stats', '/jobs/run_wait_result/p/f/chatbot/get_usage_stats',
        {'tenant_id': TEST_TENANT},
        lambda d: (d.get('success', 'error' not in d), f"Queries: {d.get('total_queries', 0)}"))

    run_test('Get Query Stats', '/jobs/run_wait_result/p/f/chatbot/get_query_stats',
        {'tenant_id': TEST_TENANT},
        lambda d: (d.get('success', 'error' not in d), 'Stats retrieved'))

    run_test('API Costs', '/jobs/run_wait_result/p/f/chatbot/get_api_costs',
        {'tenant_id': TEST_TENANT},
        lambda d: (d.get('success', 'error' not in d), f"Cost: ${d.get('total_cost', 0):.4f}"))

    # ================================================================
    # 7. ADMIN OPERATIONS
    # ================================================================
    print('\n=== ADMIN ===')
    run_test('Admin List Tenants', '/jobs/run_wait_result/p/f/admin/list_tenants', {},
        lambda d: (isinstance(d, list) or d.get('success'), f"Found {len(d) if isinstance(d, list) else len(d.get('tenants', []))} tenants"))

    run_test('Admin Get Audit Logs', '/jobs/run_wait_result/p/f/admin/get_admin_audit_logs',
        {'limit': 10},
        lambda d: (d.get('success', 'logs' in d or 'error' not in d), f"Found {len(d.get('logs', []))} logs"))

    # ================================================================
    # 8. DOCUMENT UPLOAD (Create test document)
    # ================================================================
    print('\n=== DOCUMENT UPLOAD ===')
    test_content = f"This is a test document created during path test {test_id}. It contains important test information for validation purposes."

    upload_result = run_test('Upload Document', '/jobs/run_wait_result/p/f/chatbot/embed_document_enhanced',
        {
            'title': f'Path Test Document {test_id}',
            'content': test_content,
            'category': 'general',
            'tenant_id': TEST_TENANT,
            'visibility': 'private',
            'metadata': {'test_run': test_id, 'type': 'path_test'}
        },
        lambda d: (d.get('success', 'document_id' in d), f"Created doc #{d.get('document_id')}"),
        timeout=120)

    new_doc_id = None
    if upload_result and upload_result.get('document_id'):
        new_doc_id = upload_result['document_id']
        print(f'  Created test document: #{new_doc_id}')

    # ================================================================
    # 9. DOCUMENT EDIT
    # ================================================================
    if new_doc_id:
        print('\n=== DOCUMENT EDIT ===')
        run_test('Update Document', '/jobs/run_wait_result/p/f/chatbot/update_document',
            {
                'document_id': new_doc_id,
                'tenant_id': TEST_TENANT,
                'title': f'Updated Path Test {test_id}',
                'metadata': {'test_run': test_id, 'updated': True}
            },
            lambda d: (d.get('success'), 'Document updated'))

        run_test('Extract Data', '/jobs/run_wait_result/p/f/chatbot/extract_document_data',
            {'document_id': new_doc_id, 'tenant_id': TEST_TENANT},
            lambda d: (d.get('success'), f"Extracted: {list(d.get('extracted_data', {}).keys())[:3]}"),
            timeout=60)

    # ================================================================
    # 10. DOCUMENT VISIBILITY (replaces legacy sharing)
    # Visibility is set during upload: 'everyone', 'adults_only', 'private'
    # This is already tested via the upload test above (visibility: 'private')
    # ================================================================

    # ================================================================
    # 11. CLEANUP - Delete test document
    # ================================================================
    if new_doc_id:
        print('\n=== CLEANUP ===')
        run_test('Delete Test Document', '/jobs/run_wait_result/p/f/chatbot/delete_document',
            {'document_id': new_doc_id, 'tenant_id': TEST_TENANT},
            lambda d: (d.get('success'), 'Test document deleted'))

    # ================================================================
    # SUMMARY
    # ================================================================
    print()
    print('=' * 70)
    print('TEST RESULTS SUMMARY')
    print('=' * 70)

    passed = sum(1 for _, s, _ in results if s == 'PASS')
    failed = sum(1 for _, s, _ in results if s == 'FAIL')

    print(f'PASSED: {passed}/{len(results)}')
    print(f'FAILED: {failed}/{len(results)}')
    print()

    if failed > 0:
        print('FAILED TESTS:')
        for name, status, details in results:
            if status == 'FAIL':
                print(f'  - {name}: {details[:60]}')

    print()
    print('ALL TESTS:')
    for name, status, details in results:
        marker = '[OK]' if status == 'PASS' else '[XX]'
        print(f'  {marker} {name}')

    return 0 if failed == 0 else 1

if __name__ == '__main__':
    exit(main())

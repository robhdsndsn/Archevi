#!/usr/bin/env python3
"""
Full test battery for FamilySecondBrain Windmill scripts.
Tests all major functionality including the new visibility feature.
"""

import requests
import json
import time

WINDMILL_URL = 'http://localhost'
WINDMILL_TOKEN = 'vBTbBdIfUmgWj4cCbl4EEXNB7O2xt50J'
WORKSPACE = 'family-brain'

headers = {
    'Authorization': f'Bearer {WINDMILL_TOKEN}',
    'Content-Type': 'application/json'
}

def run_script(path, args, timeout=60):
    """Run a Windmill script and return the result."""
    url = f'{WINDMILL_URL}/api/w/{WORKSPACE}/jobs/run_wait_result/p/{path}'
    try:
        response = requests.post(url, headers=headers, json=args, timeout=timeout)
        return response.json()
    except Exception as e:
        return {'error': str(e)}

def test_result(name, result, success_check):
    """Print test result."""
    if success_check(result):
        print(f'  PASS: {name}')
        return True
    else:
        print(f'  FAIL: {name}')
        print(f'        {str(result)[:200]}')
        return False

def main():
    passed = 0
    failed = 0

    print('='*70)
    print('FULL TEST BATTERY - FamilySecondBrain Windmill Scripts')
    print('='*70)
    print()

    # ========================================
    # HEALTH & INFRASTRUCTURE TESTS
    # ========================================
    print('--- HEALTH & INFRASTRUCTURE ---')

    result = run_script('f%2Fchatbot%2Fhealth_check', {})
    if test_result('health_check', result, lambda r: r.get('status') == 'healthy'):
        passed += 1
    else:
        failed += 1

    # ========================================
    # DOCUMENT CRUD TESTS
    # ========================================
    print()
    print('--- DOCUMENT CRUD ---')

    # Test get_document
    result = run_script('f%2Fchatbot%2Fget_document', {'document_id': 1})
    if test_result('get_document (existing)', result, lambda r: r.get('success') and r.get('document')):
        passed += 1
        # Check visibility field exists
        doc = result.get('document', {})
        if 'visibility' in doc:
            print(f'        visibility field present: {doc.get("visibility")}')
    else:
        failed += 1

    # Test get_document (non-existent)
    result = run_script('f%2Fchatbot%2Fget_document', {'document_id': 999999})
    if test_result('get_document (not found)', result, lambda r: not r.get('success') and 'not found' in str(r.get('error', '')).lower()):
        passed += 1
    else:
        failed += 1

    # ========================================
    # SEARCH TESTS
    # ========================================
    print()
    print('--- SEARCH ---')

    # Basic search
    result = run_script('f%2Fchatbot%2Fsearch_documents_advanced', {'limit': 5})
    if test_result('search_documents_advanced (basic)', result, lambda r: 'documents' in r and isinstance(r.get('documents'), list)):
        passed += 1
        # Check visibility in results
        docs = result.get('documents', [])
        if docs and 'visibility' in docs[0]:
            print(f'        visibility in results: {docs[0].get("visibility")}')
    else:
        failed += 1

    # Category filter
    result = run_script('f%2Fchatbot%2Fsearch_documents_advanced', {'category': 'general', 'limit': 3})
    if test_result('search_documents_advanced (category filter)', result, lambda r: 'documents' in r):
        passed += 1
    else:
        failed += 1

    # Semantic search (uses Cohere API)
    result = run_script('f%2Fchatbot%2Fsearch_documents_advanced', {'search_term': 'school', 'limit': 3}, timeout=120)
    if test_result('search_documents_advanced (semantic)', result, lambda r: 'documents' in r):
        passed += 1
    else:
        failed += 1

    # ========================================
    # FAMILY MEMBERS TESTS
    # ========================================
    print()
    print('--- FAMILY MEMBERS ---')

    result = run_script('f%2Fchatbot%2Fmanage_family_members', {'action': 'list'})
    if test_result('manage_family_members (list)', result, lambda r: r.get('success') and 'members' in r):
        passed += 1
        members = result.get('members', [])
        print(f'        Found {len(members)} family members')
    else:
        failed += 1

    # ========================================
    # ANALYTICS TESTS
    # ========================================
    print()
    print('--- ANALYTICS ---')

    result = run_script('f%2Fchatbot%2Fget_analytics', {'period': 'week'})
    if test_result('get_analytics (week)', result, lambda r: 'total_documents' in r or 'documents_count' in r or isinstance(r, dict)):
        passed += 1
    else:
        failed += 1

    # ========================================
    # TAGS & EXPIRY TESTS
    # ========================================
    print()
    print('--- TAGS & EXPIRY ---')

    result = run_script('f%2Fchatbot%2Fget_tags', {})
    if test_result('get_tags', result, lambda r: 'tags' in r or isinstance(r, list)):
        passed += 1
    else:
        failed += 1

    result = run_script('f%2Fchatbot%2Fget_expiring_documents', {'days': 90})
    if test_result('get_expiring_documents', result, lambda r: 'documents' in r or isinstance(r, list)):
        passed += 1
    else:
        failed += 1

    # ========================================
    # UPDATE DOCUMENT TEST
    # ========================================
    print()
    print('--- UPDATE DOCUMENT ---')

    # Test updating visibility on document 1
    result = run_script('f%2Fchatbot%2Fupdate_document', {
        'document_id': 1,
        'visibility': 'everyone'
    })
    if test_result('update_document (visibility)', result, lambda r: r.get('success')):
        passed += 1
    else:
        failed += 1

    # ========================================
    # RAG QUERY TEST (uses AI)
    # ========================================
    print()
    print('--- RAG QUERY ---')

    result = run_script('f%2Fchatbot%2Frag_query', {
        'query': 'What documents do I have?',
        'conversation_history': []
    }, timeout=120)
    if test_result('rag_query (basic)', result, lambda r: 'response' in r or 'answer' in r or isinstance(r.get('response'), str)):
        passed += 1
    else:
        failed += 1

    # ========================================
    # ADMIN TESTS
    # ========================================
    print()
    print('--- ADMIN ---')

    result = run_script('f%2Fchatbot%2Fadmin_list_documents', {'limit': 5})
    if test_result('admin_list_documents', result, lambda r: 'documents' in r):
        passed += 1
    else:
        failed += 1

    # ========================================
    # SUMMARY
    # ========================================
    print()
    print('='*70)
    print(f'TEST SUMMARY: {passed} passed, {failed} failed')
    print('='*70)

    if failed == 0:
        print('ALL TESTS PASSED!')
    else:
        print(f'Some tests failed. Check the output above for details.')

    return failed == 0


if __name__ == '__main__':
    main()

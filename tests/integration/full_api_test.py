#!/usr/bin/env python3
"""
Comprehensive API Test Suite for Family Second Brain
Tests all Windmill endpoints and functionality
"""
import urllib.request
import json
import time
import uuid
import os
from datetime import datetime, timedelta
from config import WINDMILL_URL, WINDMILL_WORKSPACE as WORKSPACE, WINDMILL_BASE_URL, get_windmill_token, DEFAULT_TENANT_ID

TOKEN = get_windmill_token()
BASE_URL = f"{WINDMILL_BASE_URL}/jobs/run_wait_result/p"

# Test data - USE ACTUAL UUID from tenants table or environment
TEST_TENANT = DEFAULT_TENANT_ID or os.getenv('TEST_TENANT_ID', '')  # The Hudson Family
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "TestPassword123!"

class APITester:
    def __init__(self):
        self.headers = {
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json"
        }
        self.results = []
        self.test_doc_ids = []
        self.test_user_token = None

    def call_api(self, script_path, data, timeout=60):
        """Make API call to Windmill script"""
        url = f"{BASE_URL}/{script_path}"
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers=self.headers,
            method='POST'
        )
        try:
            resp = urllib.request.urlopen(req, timeout=timeout)
            return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            return {"error": f"HTTP {e.code}", "details": error_body[:500]}
        except Exception as e:
            return {"error": str(e)}

    def test(self, name, script, data, expect_success=True, timeout=60):
        """Run a single test"""
        print(f"\n{'='*60}")
        print(f"TEST: {name}")
        print(f"Script: {script}")
        print(f"Input: {json.dumps(data, indent=2)[:200]}...")

        start = time.time()
        result = self.call_api(script, data, timeout)
        elapsed = time.time() - start

        # Determine success (handle both dict and list responses)
        success = False
        if isinstance(result, list):
            # List response is success if not empty or if we got data
            success = expect_success
        elif expect_success:
            success = result.get('success', False) or 'error' not in result
        else:
            success = not result.get('success', True) or 'error' in result

        status = "PASS" if success else "FAIL"
        print(f"Result: {status} ({elapsed:.2f}s)")
        print(f"Output: {json.dumps(result, indent=2)[:500]}...")

        self.results.append({
            "name": name,
            "script": script,
            "status": status,
            "elapsed": elapsed,
            "result": result
        })

        return result

    # ========== AUTHENTICATION TESTS ==========

    def test_auth_login(self):
        """Test user login"""
        result = self.test(
            "Auth Login",
            "f/chatbot/auth_login",
            {"email": "robarthudson@gmail.com", "password": "test123", "tenant_id": TEST_TENANT}
        )
        if result.get('success') and result.get('token'):
            self.test_user_token = result['token']
        return result

    def test_auth_login_invalid(self):
        """Test login with invalid credentials"""
        return self.test(
            "Auth Login (Invalid)",
            "f/chatbot/auth_login",
            {"email": "invalid@example.com", "password": "wrong", "tenant_id": TEST_TENANT},
            expect_success=False
        )

    def test_auth_refresh(self):
        """Test token refresh"""
        if not self.test_user_token:
            print("SKIP: No token available for refresh test")
            return None
        return self.test(
            "Auth Refresh",
            "f/chatbot/auth_refresh",
            {"token": self.test_user_token, "tenant_id": TEST_TENANT}
        )

    # ========== DOCUMENT TESTS ==========

    def test_get_document(self):
        """Test fetching a document"""
        return self.test(
            "Get Document",
            "f/chatbot/get_document",
            {"document_id": 7}
        )

    def test_search_documents(self):
        """Test document search"""
        return self.test(
            "Search Documents",
            "f/chatbot/search_documents",
            {"search_term": "insurance policy", "tenant_id": TEST_TENANT, "limit": 5}
        )

    def test_search_documents_advanced(self):
        """Test advanced document search with filters"""
        return self.test(
            "Search Documents Advanced",
            "f/chatbot/search_documents_advanced",
            {
                "tenant_id": TEST_TENANT,
                "category": "insurance",
                "limit": 10,
                "user_member_type": "admin"
            }
        )

    def test_embed_document(self):
        """Test document embedding/creation"""
        test_content = f"""
        Test Medical Record - Created {datetime.now().isoformat()}

        Patient: John Test
        Date of Visit: {datetime.now().strftime('%Y-%m-%d')}
        Provider: Dr. Smith

        Diagnosis: Annual checkup - all clear
        Blood Pressure: 120/80
        Next Appointment: {(datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')}

        Medications: None
        Allergies: Penicillin
        """

        result = self.test(
            "Embed Document (Medical)",
            "f/chatbot/embed_document_enhanced",
            {
                "title": f"Test Medical Record {uuid.uuid4().hex[:8]}",
                "content": test_content,
                "category": "medical",
                "tenant_id": TEST_TENANT,
                "created_by": "API Test Suite"
            },
            timeout=120
        )

        if result.get('success') and result.get('document_id'):
            self.test_doc_ids.append(result['document_id'])

        return result

    def test_embed_document_invoice(self):
        """Test invoice document creation"""
        test_content = f"""
        INVOICE #INV-{uuid.uuid4().hex[:6].upper()}

        From: Test Vendor Inc.
        To: Hudson Family
        Date: {datetime.now().strftime('%Y-%m-%d')}
        Due Date: {(datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')}

        Items:
        - Professional Services: $500.00
        - Materials: $150.00

        Subtotal: $650.00
        Tax (13%): $84.50
        Total: $734.50

        Payment Terms: Net 30
        """

        result = self.test(
            "Embed Document (Invoice)",
            "f/chatbot/embed_document_enhanced",
            {
                "title": f"Test Invoice {uuid.uuid4().hex[:8]}",
                "content": test_content,
                "category": "invoices",
                "tenant_id": TEST_TENANT,
                "created_by": "API Test Suite"
            },
            timeout=120
        )

        if result.get('success') and result.get('document_id'):
            self.test_doc_ids.append(result['document_id'])

        return result

    def test_embed_document_recipe(self):
        """Test recipe document creation"""
        test_content = """
        Classic Beef Stew Recipe

        Prep Time: 20 minutes
        Cook Time: 2 hours
        Servings: 6
        Calories: 450 per serving

        Ingredients:
        - 2 lbs beef chuck, cubed
        - 4 carrots, chopped
        - 3 potatoes, cubed
        - 1 onion, diced
        - 2 cups beef broth
        - 1 cup red wine
        - Salt and pepper to taste

        Instructions:
        1. Brown beef in Dutch oven
        2. Add vegetables and liquids
        3. Simmer for 2 hours until tender

        Dietary: Gluten-free, Dairy-free
        """

        result = self.test(
            "Embed Document (Recipe)",
            "f/chatbot/embed_document_enhanced",
            {
                "title": f"Test Recipe {uuid.uuid4().hex[:8]}",
                "content": test_content,
                "category": "recipes",
                "tenant_id": TEST_TENANT,
                "created_by": "API Test Suite"
            },
            timeout=120
        )

        if result.get('success') and result.get('document_id'):
            self.test_doc_ids.append(result['document_id'])

        return result

    def test_update_document(self):
        """Test document update"""
        if not self.test_doc_ids:
            print("SKIP: No test documents to update")
            return None

        doc_id = self.test_doc_ids[0]
        return self.test(
            "Update Document",
            "f/chatbot/update_document",
            {
                "document_id": doc_id,
                "title": f"Updated Title {datetime.now().isoformat()}",
                "visibility": "adults_only",
                "tenant_id": TEST_TENANT
            }
        )

    def test_extract_document_data(self):
        """Test document data extraction"""
        return self.test(
            "Extract Document Data",
            "f/chatbot/extract_document_data",
            {
                "document_id": 7,
                "tenant_id": TEST_TENANT,
                "force_reextract": False
            },
            timeout=120
        )

    # ========== RAG QUERY TESTS ==========

    def test_rag_query(self):
        """Test RAG query"""
        return self.test(
            "RAG Query",
            "f/chatbot/rag_query",
            {
                "query": "What is my insurance policy number?",
                "tenant_id": TEST_TENANT,
                "top_k": 3,
                "user_member_type": "admin"
            },
            timeout=120
        )

    def test_rag_query_medical(self):
        """Test RAG query for medical info"""
        return self.test(
            "RAG Query (Medical)",
            "f/chatbot/rag_query",
            {
                "query": "What medications or allergies are on file?",
                "tenant_id": TEST_TENANT,
                "top_k": 3,
                "user_member_type": "admin"
            },
            timeout=120
        )

    # ========== FAMILY MEMBER TESTS ==========

    def test_manage_family_members_list(self):
        """Test listing family members"""
        return self.test(
            "List Family Members",
            "f/chatbot/manage_family_members",
            {
                "action": "list",
                "tenant_id": TEST_TENANT
            }
        )

    def test_manage_family_members_add(self):
        """Test adding a family member"""
        return self.test(
            "Add Family Member",
            "f/chatbot/manage_family_members",
            {
                "action": "add",
                "member_data": {
                    "name": f"Test Member {uuid.uuid4().hex[:6]}",
                    "email": f"test_{uuid.uuid4().hex[:6]}@example.com",
                    "role": "member"
                }
            }
        )

    # ========== TAGS AND ANALYTICS ==========

    def test_get_tags(self):
        """Test getting tags"""
        return self.test(
            "Get Tags",
            "f/chatbot/get_tags",
            {"tenant_id": TEST_TENANT}
        )

    def test_suggest_tags(self):
        """Test tag suggestions"""
        return self.test(
            "Suggest Tags",
            "f/chatbot/suggest_tags",
            {
                "content": "This is a medical document about blood test results and cholesterol levels",
                "category": "medical",
                "tenant_id": TEST_TENANT
            },
            timeout=60
        )

    def test_get_analytics(self):
        """Test analytics endpoint"""
        return self.test(
            "Get Analytics",
            "f/chatbot/get_analytics",
            {"tenant_id": TEST_TENANT}
        )

    def test_get_expiring_documents(self):
        """Test expiring documents"""
        return self.test(
            "Get Expiring Documents",
            "f/chatbot/get_expiring_documents",
            {"tenant_id": TEST_TENANT, "days_ahead": 90}
        )

    # ========== TENANT TESTS ==========

    def test_list_tenants(self):
        """Test listing tenants"""
        return self.test(
            "List Tenants",
            "f/chatbot/list_tenants",
            {}
        )

    def test_get_tenant_details(self):
        """Test getting tenant details"""
        return self.test(
            "Get Tenant Details",
            "f/chatbot/get_tenant_details",
            {"tenant_id": TEST_TENANT}
        )

    def test_create_tenant(self):
        """Test creating a new tenant"""
        slug = f"test{uuid.uuid4().hex[:6]}"
        return self.test(
            "Create Tenant",
            "f/chatbot/create_tenant",
            {
                "name": f"Test Family {slug}",
                "slug": slug,
                "plan": "starter",
                "owner_email": f"owner_{uuid.uuid4().hex[:6]}@example.com",
                "owner_name": "Test Owner"
            }
        )

    # ========== HEALTH CHECK ==========

    def test_health_check(self):
        """Test health check endpoint"""
        return self.test(
            "Health Check",
            "f/chatbot/health_check",
            {}
        )

    # ========== CONVERSATION HISTORY ==========

    def test_get_conversation_history(self):
        """Test conversation history"""
        return self.test(
            "Get Conversation History",
            "f/chatbot/get_conversation_history",
            {"tenant_id": TEST_TENANT, "limit": 10}
        )

    # ========== ADMIN TESTS ==========

    def test_admin_list_documents(self):
        """Test admin document listing"""
        return self.test(
            "Admin List Documents",
            "f/chatbot/admin_list_documents",
            {
                "limit": 20,
                "offset": 0
            }
        )

    # ========== CLEANUP ==========

    def cleanup_test_documents(self):
        """Delete test documents created during testing"""
        print(f"\n{'='*60}")
        print(f"CLEANUP: Deleting {len(self.test_doc_ids)} test documents")

        for doc_id in self.test_doc_ids:
            result = self.call_api(
                "f/chatbot/delete_document",
                {"document_id": doc_id, "tenant_id": TEST_TENANT}
            )
            status = "OK" if result.get('success') else "FAIL"
            print(f"  Delete doc {doc_id}: {status}")

    # ========== MAIN TEST RUNNER ==========

    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*70)
        print("FAMILY SECOND BRAIN - COMPREHENSIVE API TEST SUITE")
        print("="*70)
        print(f"Windmill URL: {WINDMILL_URL}")
        print(f"Workspace: {WORKSPACE}")
        print(f"Test Tenant: {TEST_TENANT}")
        print(f"Started: {datetime.now().isoformat()}")

        # Run tests in logical order
        tests = [
            # Health & Basic
            self.test_health_check,

            # Authentication
            self.test_auth_login,
            self.test_auth_login_invalid,
            self.test_auth_refresh,

            # Documents - Read
            self.test_get_document,
            self.test_search_documents,
            self.test_search_documents_advanced,

            # Documents - Create (different categories)
            self.test_embed_document,           # Medical
            self.test_embed_document_invoice,   # Invoice
            self.test_embed_document_recipe,    # Recipe

            # Documents - Update
            self.test_update_document,

            # Data Extraction
            self.test_extract_document_data,

            # RAG Queries
            self.test_rag_query,
            self.test_rag_query_medical,

            # Family Members
            self.test_manage_family_members_list,
            self.test_manage_family_members_add,

            # Tags & Analytics
            self.test_get_tags,
            self.test_suggest_tags,
            self.test_get_analytics,
            self.test_get_expiring_documents,

            # Tenants
            self.test_list_tenants,
            self.test_get_tenant_details,
            self.test_create_tenant,

            # Admin
            self.test_admin_list_documents,

            # Conversation
            self.test_get_conversation_history,
        ]

        for test_func in tests:
            try:
                test_func()
            except Exception as e:
                print(f"\nERROR in {test_func.__name__}: {e}")
                self.results.append({
                    "name": test_func.__name__,
                    "status": "ERROR",
                    "error": str(e)
                })

        # Cleanup
        self.cleanup_test_documents()

        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)

        passed = sum(1 for r in self.results if r['status'] == 'PASS')
        failed = sum(1 for r in self.results if r['status'] == 'FAIL')
        errors = sum(1 for r in self.results if r['status'] == 'ERROR')
        total = len(self.results)

        print(f"\nTotal Tests: {total}")
        print(f"  PASSED: {passed}")
        print(f"  FAILED: {failed}")
        print(f"  ERRORS: {errors}")
        print(f"\nSuccess Rate: {passed/total*100:.1f}%")

        if failed > 0 or errors > 0:
            print("\n--- FAILED/ERROR TESTS ---")
            for r in self.results:
                if r['status'] in ['FAIL', 'ERROR']:
                    print(f"  {r['status']}: {r['name']}")
                    if 'result' in r:
                        print(f"    Result: {json.dumps(r['result'], indent=2)[:200]}")

        print("\n" + "="*70)
        print(f"Completed: {datetime.now().isoformat()}")
        print("="*70)


if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()

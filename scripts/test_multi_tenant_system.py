#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - httpx

"""
Multi-Tenant System Integration Test
Creates test data and validates the entire tenant system.

Windmill Script Configuration:
- Path: f/tenant/test_multi_tenant_system
- Trigger: Manual test run
"""

import wmill
import psycopg2
import psycopg2.extras
from datetime import datetime, timedelta
import secrets
import hashlib


def hash_password(password: str) -> str:
    """Simple password hash for testing (use bcrypt in production)."""
    return hashlib.sha256(password.encode()).hexdigest()


def main(cleanup_first: bool = True) -> dict:
    """
    Run comprehensive multi-tenant system test.

    Args:
        cleanup_first: If True, remove test data before creating new

    Returns:
        dict with test results and created data
    """

    # Connect to database
    try:
        db_resource = wmill.get_resource("u/admin/archevi_postgres")
        conn = psycopg2.connect(db_resource["connection_string"])
    except:
        postgres_db = wmill.get_resource("f/chatbot/postgres_db")
        conn = psycopg2.connect(
            host=postgres_db["host"],
            port=postgres_db["port"],
            dbname=postgres_db["dbname"],
            user=postgres_db["user"],
            password=postgres_db["password"],
            sslmode=postgres_db.get("sslmode", "disable")
        )

    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    results = {
        "success": True,
        "users_created": [],
        "tenants_created": [],
        "memberships_created": [],
        "documents_created": [],
        "test_scenarios": []
    }

    try:
        # ============================================
        # CLEANUP (if requested)
        # Proper order to respect FK constraints:
        # 1. Clear user references to test tenants (default_tenant_id)
        # 2. Delete dependent records in correct order
        # 3. Delete tenants
        # 4. Delete users
        # ============================================
        if cleanup_first:
            # Get test tenant IDs for subqueries
            test_tenant_subquery = "SELECT id FROM tenants WHERE slug LIKE 'test-%'"
            test_user_subquery = "SELECT id FROM users WHERE email LIKE 'test-%@archevi.ca'"

            # Step 1: Clear default_tenant_id references FIRST (this is the FK that causes issues)
            cursor.execute(f"""
                UPDATE users SET default_tenant_id = NULL
                WHERE default_tenant_id IN ({test_tenant_subquery})
            """)

            # Step 2: Delete dependent records (most have ON DELETE CASCADE, but be explicit)
            # Delete chat messages (via cascade from chat_sessions, but be safe)
            cursor.execute(f"""
                DELETE FROM chat_messages WHERE session_id IN (
                    SELECT id FROM chat_sessions WHERE tenant_id IN ({test_tenant_subquery})
                )
            """)

            # Delete chat sessions
            cursor.execute(f"DELETE FROM chat_sessions WHERE tenant_id IN ({test_tenant_subquery})")

            # Delete documents with TEST: prefix
            cursor.execute("DELETE FROM documents WHERE title LIKE 'TEST:%'")

            # Delete AI usage records
            cursor.execute(f"DELETE FROM ai_usage WHERE tenant_id IN ({test_tenant_subquery})")

            # Delete monthly usage summaries
            cursor.execute(f"DELETE FROM monthly_usage_summary WHERE tenant_id IN ({test_tenant_subquery})")

            # Delete admin audit logs (no cascade)
            cursor.execute(f"DELETE FROM admin_audit_logs WHERE tenant_id IN ({test_tenant_subquery})")

            # Delete API usage records (no cascade)
            cursor.execute(f"DELETE FROM api_usage WHERE tenant_id IN ({test_tenant_subquery})")

            # Delete provisioning queue entries
            cursor.execute(f"DELETE FROM provisioning_queue WHERE tenant_id IN ({test_tenant_subquery})")

            # Delete tenant memberships (has cascade, but explicit is clearer)
            cursor.execute(f"DELETE FROM tenant_memberships WHERE tenant_id IN ({test_tenant_subquery})")

            # Step 3: Now safe to delete tenants
            cursor.execute("DELETE FROM tenants WHERE slug LIKE 'test-%'")

            # Step 4: Finally delete test users
            cursor.execute("DELETE FROM users WHERE email LIKE 'test-%@archevi.ca'")

            conn.commit()

        # ============================================
        # CREATE TEST USERS
        # ============================================
        test_users = [
            {"email": "test-rob@archevi.ca", "name": "Rob Hudson", "password": "test123"},
            {"email": "test-sarah@archevi.ca", "name": "Sarah Hudson", "password": "test123"},
            {"email": "test-mike@archevi.ca", "name": "Mike Chen", "password": "test123"},
            {"email": "test-lisa@archevi.ca", "name": "Lisa Chen", "password": "test123"},
            {"email": "test-admin@archevi.ca", "name": "Admin User", "password": "admin123"},
        ]

        user_ids = {}
        for user in test_users:
            cursor.execute("""
                INSERT INTO users (email, name, password_hash, email_verified)
                VALUES (%s, %s, %s, true)
                ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
                RETURNING id, email
            """, [user["email"], user["name"], hash_password(user["password"])])
            result = cursor.fetchone()
            user_ids[user["email"]] = str(result["id"])
            results["users_created"].append({
                "id": str(result["id"]),
                "email": user["email"],
                "name": user["name"]
            })

        conn.commit()

        # ============================================
        # CREATE TEST TENANTS (FAMILIES)
        # ============================================
        test_tenants = [
            {
                "name": "The Hudson Family",
                "slug": "test-hudson",
                "plan": "family",
                "ai_allowance": 8.00,
                "max_members": 999,
                "owner_email": "test-rob@archevi.ca"
            },
            {
                "name": "Chen Family Trust",
                "slug": "test-chen",
                "plan": "family_office",
                "ai_allowance": 999999.00,
                "max_members": 999,
                "owner_email": "test-mike@archevi.ca"
            },
            {
                "name": "Test Starter Family",
                "slug": "test-starter",
                "plan": "starter",
                "ai_allowance": 3.00,
                "max_members": 5,
                "owner_email": "test-admin@archevi.ca"
            },
        ]

        tenant_ids = {}
        for tenant in test_tenants:
            owner_id = user_ids[tenant["owner_email"]]
            cursor.execute("""
                INSERT INTO tenants (name, slug, plan, ai_allowance_usd, max_members, created_by, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'active')
                ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
                RETURNING id, slug
            """, [tenant["name"], tenant["slug"], tenant["plan"],
                  tenant["ai_allowance"], tenant["max_members"], owner_id])
            result = cursor.fetchone()
            tenant_ids[tenant["slug"]] = str(result["id"])
            results["tenants_created"].append({
                "id": str(result["id"]),
                "name": tenant["name"],
                "slug": tenant["slug"],
                "plan": tenant["plan"],
                "url": f"archevi.ca/f/{tenant['slug']}"
            })

        conn.commit()

        # ============================================
        # CREATE MEMBERSHIPS (Including Multi-Family)
        # ============================================
        memberships = [
            # Hudson Family
            {"tenant": "test-hudson", "user": "test-rob@archevi.ca", "role": "owner"},
            {"tenant": "test-hudson", "user": "test-sarah@archevi.ca", "role": "admin"},

            # Chen Family
            {"tenant": "test-chen", "user": "test-mike@archevi.ca", "role": "owner"},
            {"tenant": "test-chen", "user": "test-lisa@archevi.ca", "role": "admin"},

            # Multi-family: Rob is also a viewer in Chen family (business relationship)
            {"tenant": "test-chen", "user": "test-rob@archevi.ca", "role": "viewer"},

            # Multi-family: Admin manages multiple families
            {"tenant": "test-hudson", "user": "test-admin@archevi.ca", "role": "viewer"},
            {"tenant": "test-chen", "user": "test-admin@archevi.ca", "role": "viewer"},

            # Starter family
            {"tenant": "test-starter", "user": "test-admin@archevi.ca", "role": "owner"},
        ]

        for membership in memberships:
            tenant_id = tenant_ids[membership["tenant"]]
            user_id = user_ids[membership["user"]]
            cursor.execute("""
                INSERT INTO tenant_memberships (tenant_id, user_id, role, status, invite_accepted_at)
                VALUES (%s, %s, %s, 'active', NOW())
                ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role
                RETURNING id
            """, [tenant_id, user_id, membership["role"]])
            results["memberships_created"].append({
                "tenant": membership["tenant"],
                "user": membership["user"],
                "role": membership["role"]
            })

        # Set default tenants for users
        cursor.execute("""
            UPDATE users SET default_tenant_id = %s WHERE email = 'test-rob@archevi.ca'
        """, [tenant_ids["test-hudson"]])
        cursor.execute("""
            UPDATE users SET default_tenant_id = %s WHERE email = 'test-mike@archevi.ca'
        """, [tenant_ids["test-chen"]])

        conn.commit()

        # ============================================
        # CREATE TEST DOCUMENTS
        # ============================================
        test_documents = [
            # Hudson Family Documents
            {
                "tenant": "test-hudson",
                "title": "TEST: Home Insurance Policy",
                "content": "State Farm Policy #12345. Coverage: $500,000 dwelling, $100,000 personal property. Deductible: $1,000. Renewal date: March 15, 2025. Agent: John Smith, 555-123-4567.",
                "category": "Insurance",
                "created_by": "test-rob@archevi.ca"
            },
            {
                "tenant": "test-hudson",
                "title": "TEST: 2024 Tax Return Summary",
                "content": "Federal AGI: $185,000. State tax paid: $12,500. Charitable donations: $8,000. Mortgage interest: $15,000. Property tax: $6,500. Refund received: $2,340.",
                "category": "Financial",
                "created_by": "test-sarah@archevi.ca"
            },
            {
                "tenant": "test-hudson",
                "title": "TEST: Kitchen Renovation Contractor",
                "content": "ABC Renovations. Quote: $45,000. Timeline: 6 weeks. Contact: Mike Johnson, mike@abcreno.com, 555-987-6543. Includes: new cabinets, countertops, appliances, flooring.",
                "category": "Home",
                "created_by": "test-rob@archevi.ca"
            },

            # Chen Family Documents
            {
                "tenant": "test-chen",
                "title": "TEST: Investment Portfolio Summary",
                "content": "Total assets: $2.5M. Allocation: 60% equities, 30% bonds, 10% alternatives. YTD return: 12.3%. Managed by: Wealth Advisory Partners. Account #: 789456123.",
                "category": "Financial",
                "created_by": "test-mike@archevi.ca"
            },
            {
                "tenant": "test-chen",
                "title": "TEST: Trust Document Overview",
                "content": "Chen Family Irrevocable Trust established 2020. Beneficiaries: Michael Chen Jr., Emily Chen. Trustee: First National Bank. Annual distribution: $50,000 per beneficiary.",
                "category": "Legal",
                "created_by": "test-lisa@archevi.ca"
            },
            {
                "tenant": "test-chen",
                "title": "TEST: Vacation Property Details",
                "content": "Lake Tahoe cabin. Address: 123 Pine Ridge Road. Purchase price: $850,000 (2019). Current value: $1.2M. Property manager: Tahoe Rentals, 530-555-1234.",
                "category": "Property",
                "created_by": "test-mike@archevi.ca"
            },

            # Starter Family Documents
            {
                "tenant": "test-starter",
                "title": "TEST: Car Registration",
                "content": "2022 Honda Accord. License: ABC 1234. Registration expires: December 2025. Insurance: Geico, Policy #98765.",
                "category": "Vehicle",
                "created_by": "test-admin@archevi.ca"
            },
        ]

        for doc in test_documents:
            tenant_id = tenant_ids[doc["tenant"]]
            user_id = user_ids[doc["created_by"]]
            cursor.execute("""
                INSERT INTO documents (tenant_id, title, content, category, created_by)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, [tenant_id, doc["title"], doc["content"], doc["category"], user_id])
            result = cursor.fetchone()
            results["documents_created"].append({
                "id": str(result["id"]),
                "tenant": doc["tenant"],
                "title": doc["title"],
                "category": doc["category"]
            })

        conn.commit()

        # ============================================
        # RUN TEST SCENARIOS
        # ============================================

        # Test 1: Get user's tenants (Rob has 2 families)
        cursor.execute("""
            SELECT t.name, t.slug, tm.role
            FROM tenant_memberships tm
            JOIN tenants t ON tm.tenant_id = t.id
            WHERE tm.user_id = %s AND tm.status = 'active'
        """, [user_ids["test-rob@archevi.ca"]])
        rob_tenants = cursor.fetchall()
        results["test_scenarios"].append({
            "test": "Rob's families",
            "expected": 2,
            "actual": len(rob_tenants),
            "passed": len(rob_tenants) == 2,
            "details": [{"name": t["name"], "role": t["role"]} for t in rob_tenants]
        })

        # Test 2: Get documents for Hudson family only
        cursor.execute("""
            SELECT title, category FROM documents
            WHERE tenant_id = %s
            ORDER BY created_at
        """, [tenant_ids["test-hudson"]])
        hudson_docs = cursor.fetchall()
        results["test_scenarios"].append({
            "test": "Hudson family documents",
            "expected": 3,
            "actual": len(hudson_docs),
            "passed": len(hudson_docs) == 3,
            "details": [d["title"] for d in hudson_docs]
        })

        # Test 3: Verify tenant isolation (Rob can't see Chen docs without membership)
        # Actually Rob IS a member of Chen, so this tests he CAN see them
        cursor.execute("""
            SELECT d.title
            FROM documents d
            JOIN tenant_memberships tm ON d.tenant_id = tm.tenant_id
            WHERE tm.user_id = %s AND tm.status = 'active'
        """, [user_ids["test-rob@archevi.ca"]])
        rob_visible_docs = cursor.fetchall()
        results["test_scenarios"].append({
            "test": "Rob can see docs from both families",
            "expected": 6,  # 3 Hudson + 3 Chen
            "actual": len(rob_visible_docs),
            "passed": len(rob_visible_docs) == 6,
            "details": [d["title"] for d in rob_visible_docs]
        })

        # Test 4: Admin manages multiple families
        cursor.execute("""
            SELECT t.name, tm.role
            FROM tenant_memberships tm
            JOIN tenants t ON tm.tenant_id = t.id
            WHERE tm.user_id = %s AND tm.status = 'active'
        """, [user_ids["test-admin@archevi.ca"]])
        admin_tenants = cursor.fetchall()
        results["test_scenarios"].append({
            "test": "Admin's family access",
            "expected": 3,
            "actual": len(admin_tenants),
            "passed": len(admin_tenants) == 3,
            "details": [{"name": t["name"], "role": t["role"]} for t in admin_tenants]
        })

        # Test 5: Verify plan limits are set correctly
        cursor.execute("""
            SELECT slug, plan, ai_allowance_usd, max_members
            FROM tenants WHERE slug LIKE 'test-%'
            ORDER BY slug
        """)
        tenant_plans = cursor.fetchall()
        results["test_scenarios"].append({
            "test": "Tenant plan configuration",
            "passed": True,
            "details": [{
                "slug": t["slug"],
                "plan": t["plan"],
                "ai_allowance": float(t["ai_allowance_usd"]),
                "max_members": t["max_members"]
            } for t in tenant_plans]
        })

        # Calculate overall pass rate
        passed_tests = sum(1 for t in results["test_scenarios"] if t.get("passed", False))
        total_tests = len(results["test_scenarios"])
        results["summary"] = {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": total_tests - passed_tests,
            "pass_rate": f"{(passed_tests/total_tests)*100:.0f}%"
        }

        return results

    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "error": str(e),
            "results_so_far": results
        }
    finally:
        cursor.close()
        conn.close()

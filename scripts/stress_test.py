#!/usr/bin/env python3
"""
Multi-Tenant Stress Test for Archevi
=====================================

Simulates 3 different families with different document types and query patterns,
running concurrent requests to stress test the local Windmill + RAG infrastructure.

Metrics collected:
- Response times (p50, p95, p99)
- Throughput (queries/second)
- Error rates
- Token usage and cost estimates
- Concurrent connection handling

Usage:
    python stress_test.py [--queries N] [--concurrency N] [--duration SECONDS]
"""

import asyncio
import aiohttp
import json
import time
import random
import statistics
import argparse
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional
import uuid

# Configuration - load from environment
from config import WINDMILL_URL, WINDMILL_WORKSPACE as WORKSPACE, get_windmill_token
WINDMILL_TOKEN = get_windmill_token()

# Test Families Configuration
TEST_FAMILIES = [
    {
        "name": "The Smith Family",
        "slug": f"stress-smith-{uuid.uuid4().hex[:6]}",
        "plan": "starter",
        "focus": "medical",  # Primary document focus
        "documents": [
            {"title": "Annual Physical Results 2024", "category": "medical", "content": "Patient: John Smith. Date: March 15, 2024. Blood pressure: 120/80. Cholesterol: 185 mg/dL. Blood glucose: 95 mg/dL. BMI: 24.2. Doctor's notes: Patient is in good health. Recommend continuing current exercise routine. Schedule follow-up in 12 months."},
            {"title": "Sarah's Dental Records", "category": "medical", "content": "Patient: Sarah Smith (age 12). Dental exam date: February 2024. No cavities found. Orthodontic evaluation: May benefit from braces in 1-2 years. Next cleaning scheduled for August 2024."},
            {"title": "Family Health Insurance Policy", "category": "insurance", "content": "Blue Cross Blue Shield Family Plan. Policy #: BCBS-2024-789456. Coverage: $500,000 per person annually. Deductible: $1,500 family. Copay: $25 primary care, $50 specialist. Effective: January 1, 2024 - December 31, 2024."},
            {"title": "Prescription Records Q1 2024", "category": "medical", "content": "John Smith: Lisinopril 10mg daily for blood pressure. Mary Smith: Synthroid 50mcg daily for thyroid. Pharmacy: CVS Main Street. Auto-refill enabled."},
            {"title": "Vaccination Records", "category": "medical", "content": "COVID-19 boosters: All family members up to date as of January 2024. Flu shots: October 2023. Sarah needs Tdap booster before starting middle school."},
        ],
        "queries": [
            "What were John's blood pressure results?",
            "When is Sarah's next dental appointment?",
            "What is our health insurance deductible?",
            "What medications does Mary take?",
            "Are the kids' vaccinations up to date?",
            "What's our insurance policy number?",
            "When was John's last physical?",
        ]
    },
    {
        "name": "The Garcia Family",
        "slug": f"stress-garcia-{uuid.uuid4().hex[:6]}",
        "plan": "family",
        "focus": "financial",  # Primary document focus
        "documents": [
            {"title": "Mortgage Statement December 2024", "category": "financial", "content": "Wells Fargo Home Mortgage. Account: 4578-XXXX-1234. Property: 456 Oak Avenue. Original loan: $425,000. Current balance: $398,542.18. Interest rate: 4.25% fixed. Monthly payment: $2,089.45. Escrow: $485.00 for taxes and insurance."},
            {"title": "2023 Tax Return Summary", "category": "financial", "content": "Garcia Family Tax Return 2023. Filing status: Married Filing Jointly. Adjusted Gross Income: $142,500. Federal tax due: $18,420. State tax due: $5,890. Refund received: $2,340. Prepared by: H&R Block. Filed: April 10, 2024."},
            {"title": "Car Loan Agreement", "category": "financial", "content": "Toyota Financial Services. Vehicle: 2023 Toyota Highlander. Loan amount: $38,500. Term: 60 months. APR: 5.9%. Monthly payment: $743.22. First payment: June 2023. Final payment: May 2028."},
            {"title": "Investment Portfolio Q4 2024", "category": "financial", "content": "Fidelity Investments. Account ending: 7891. Total value: $89,450. 401k balance: $156,780. Roth IRA: $34,200. YTD return: 12.3%. Asset allocation: 70% stocks, 25% bonds, 5% cash."},
            {"title": "Home Insurance Policy", "category": "insurance", "content": "State Farm Homeowners Policy. Policy #: SF-HO-2024-5678. Coverage: $450,000 dwelling, $225,000 personal property. Deductible: $2,500. Premium: $1,890 annually. Includes flood rider."},
            {"title": "Monthly Budget November 2024", "category": "financial", "content": "Income: $11,875. Fixed expenses: Mortgage $2,089, Car $743, Insurance $420, Utilities $280. Variable: Groceries $850, Gas $200, Entertainment $300. Savings: $1,500 to emergency fund, $500 to vacation fund."},
        ],
        "queries": [
            "What's our current mortgage balance?",
            "How much did we pay in federal taxes last year?",
            "When does our car loan end?",
            "What's our total investment portfolio value?",
            "What's our home insurance deductible?",
            "How much are we saving each month?",
            "What's our monthly mortgage payment including escrow?",
            "What's our 401k balance?",
        ]
    },
    {
        "name": "The Johnson Family",
        "slug": f"stress-johnson-{uuid.uuid4().hex[:6]}",
        "plan": "family",
        "focus": "recipes",  # Primary document focus
        "documents": [
            {"title": "Grandma's Secret Chocolate Cake", "category": "recipes", "content": "Family recipe passed down 3 generations. Ingredients: 2 cups flour, 2 cups sugar, 3/4 cup cocoa powder, 2 eggs, 1 cup buttermilk, 1 cup hot coffee, 1/2 cup vegetable oil. Bake at 350F for 30-35 minutes. Frosting: 1/2 cup butter, 3 cups powdered sugar, 1/3 cup cocoa, 3 tbsp milk."},
            {"title": "Sunday Pot Roast Recipe", "category": "recipes", "content": "Ingredients: 4lb beef chuck roast, 6 potatoes quartered, 4 carrots, 1 onion, 4 cloves garlic, 2 cups beef broth, herbs (thyme, rosemary). Sear roast on all sides. Add vegetables and broth. Cook at 300F for 3-4 hours until tender. Serves 6-8."},
            {"title": "Kids' Favorite Mac and Cheese", "category": "recipes", "content": "Ingredients: 1lb elbow macaroni, 4 tbsp butter, 1/4 cup flour, 3 cups milk, 3 cups sharp cheddar, 1 cup mozzarella. Make roux, add milk, melt cheese. Combine with pasta. Optional: top with breadcrumbs and bake 20 minutes at 375F."},
            {"title": "Auto Insurance Policy", "category": "insurance", "content": "Progressive Auto Insurance. Policy: PAI-2024-111222. Vehicles: 2021 Honda Odyssey, 2019 Ford F-150. Coverage: 100/300/100. Collision deductible: $500. Comprehensive: $250. Premium: $245/month. Good driver discount applied."},
            {"title": "Healthy Smoothie Recipes", "category": "recipes", "content": "Green Monster: 1 banana, 1 cup spinach, 1/2 cup Greek yogurt, 1 cup almond milk, 1 tbsp honey. Berry Blast: 1 cup mixed berries, 1/2 cup orange juice, 1/2 cup yogurt, ice. Tropical Sunrise: 1 cup mango, 1/2 cup pineapple, coconut water."},
            {"title": "BBQ Ribs Competition Recipe", "category": "recipes", "content": "Award-winning recipe from 2023 county fair. Dry rub: brown sugar, paprika, garlic powder, onion powder, cumin, black pepper. Apply rub night before. Smoke at 225F for 5-6 hours with hickory wood. Sauce last 30 minutes. Rest 15 minutes before serving."},
            {"title": "Holiday Cookie Collection", "category": "recipes", "content": "Sugar cookies: cream butter and sugar, add eggs and vanilla, mix dry ingredients. Chill 2 hours. Roll and cut shapes. Bake 8-10 min at 350F. Gingerbread: add molasses, ginger, cinnamon. Peanut butter blossoms: press Hershey kiss into warm cookie."},
        ],
        "queries": [
            "How do I make grandma's chocolate cake?",
            "What temperature for the pot roast?",
            "What cheese goes in the mac and cheese?",
            "What's our car insurance deductible?",
            "Give me a healthy smoothie recipe",
            "How long do I smoke the ribs?",
            "What's in the sugar cookie recipe?",
            "How do I make the chocolate cake frosting?",
        ]
    }
]

@dataclass
class QueryResult:
    """Result from a single query"""
    tenant_name: str
    query: str
    success: bool
    response_time_ms: float
    answer_length: int = 0
    sources_count: int = 0
    tool_calls_count: int = 0
    error: Optional[str] = None
    model: str = ""

@dataclass
class StressTestResults:
    """Aggregated stress test results"""
    total_queries: int = 0
    successful_queries: int = 0
    failed_queries: int = 0
    response_times: list = field(default_factory=list)
    errors: list = field(default_factory=list)
    results_by_tenant: dict = field(default_factory=dict)
    start_time: float = 0
    end_time: float = 0

    @property
    def duration_seconds(self) -> float:
        return self.end_time - self.start_time

    @property
    def queries_per_second(self) -> float:
        if self.duration_seconds > 0:
            return self.total_queries / self.duration_seconds
        return 0

    @property
    def success_rate(self) -> float:
        if self.total_queries > 0:
            return (self.successful_queries / self.total_queries) * 100
        return 0

    @property
    def p50_ms(self) -> float:
        if self.response_times:
            return statistics.median(self.response_times)
        return 0

    @property
    def p95_ms(self) -> float:
        if len(self.response_times) >= 20:
            sorted_times = sorted(self.response_times)
            idx = int(len(sorted_times) * 0.95)
            return sorted_times[idx]
        return max(self.response_times) if self.response_times else 0

    @property
    def p99_ms(self) -> float:
        if len(self.response_times) >= 100:
            sorted_times = sorted(self.response_times)
            idx = int(len(sorted_times) * 0.99)
            return sorted_times[idx]
        return max(self.response_times) if self.response_times else 0

    @property
    def avg_ms(self) -> float:
        if self.response_times:
            return statistics.mean(self.response_times)
        return 0


async def create_tenant(session: aiohttp.ClientSession, tenant_config: dict) -> Optional[str]:
    """Create a test tenant and return its ID"""
    url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/jobs/run_wait_result/p/f/chatbot/create_tenant"
    headers = {
        "Authorization": f"Bearer {WINDMILL_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "name": tenant_config["name"],
        "slug": tenant_config["slug"],
        "plan": tenant_config["plan"],
        "owner_email": f"test-{tenant_config['slug']}@archevi.test",
        "owner_name": f"Test Owner {tenant_config['name']}"
    }

    try:
        async with session.post(url, headers=headers, json=payload, timeout=30) as resp:
            result = await resp.json()
            if result.get("success"):
                print(f"  Created tenant: {tenant_config['name']} (ID: {result.get('tenant_id')})")
                return result.get("tenant_id")
            else:
                print(f"  Failed to create tenant {tenant_config['name']}: {result.get('error')}")
                return None
    except Exception as e:
        print(f"  Error creating tenant: {e}")
        return None


async def seed_document(session: aiohttp.ClientSession, tenant_id: str, doc: dict) -> bool:
    """Seed a single document for a tenant"""
    url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/jobs/run_wait_result/p/f/chatbot/embed_document_enhanced"
    headers = {
        "Authorization": f"Bearer {WINDMILL_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "title": doc["title"],
        "content": doc["content"],
        "category": doc["category"],
        "tenant_id": tenant_id,
        "auto_categorize_enabled": False,  # Use provided category
        "extract_tags_enabled": True,
        "extract_dates_enabled": True
    }

    try:
        async with session.post(url, headers=headers, json=payload, timeout=60) as resp:
            result = await resp.json()
            if result.get("document_id"):
                return True
            return False
    except Exception as e:
        print(f"    Error seeding document: {e}")
        return False


async def run_query(session: aiohttp.ClientSession, tenant_id: str, tenant_name: str, query: str, max_retries: int = 3) -> QueryResult:
    """Run a single RAG query and return results with retry logic for rate limits"""
    url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/jobs/run_wait_result/p/f/chatbot/rag_query_agent"
    headers = {
        "Authorization": f"Bearer {WINDMILL_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {
        "user_message": query,
        "tenant_id": tenant_id
    }

    for attempt in range(max_retries):
        start_time = time.perf_counter()

        try:
            async with session.post(url, headers=headers, json=payload, timeout=120) as resp:
                end_time = time.perf_counter()
                response_time_ms = (end_time - start_time) * 1000

                if resp.status == 200:
                    result = await resp.json()
                    return QueryResult(
                        tenant_name=tenant_name,
                        query=query,
                        success=True,
                        response_time_ms=response_time_ms,
                        answer_length=len(result.get("answer", "")),
                        sources_count=len(result.get("sources", [])),
                        tool_calls_count=len(result.get("tool_calls", [])),
                        model=result.get("model", "unknown")
                    )
                else:
                    error_text = await resp.text()
                    # Check for rate limit error
                    if "rate_limit" in error_text.lower() or resp.status == 429:
                        if attempt < max_retries - 1:
                            wait_time = (attempt + 1) * 2  # Exponential backoff: 2s, 4s, 6s
                            await asyncio.sleep(wait_time)
                            continue
                    return QueryResult(
                        tenant_name=tenant_name,
                        query=query,
                        success=False,
                        response_time_ms=response_time_ms,
                        error=f"HTTP {resp.status}: {error_text[:200]}"
                    )
        except asyncio.TimeoutError:
            if attempt < max_retries - 1:
                continue
            return QueryResult(
                tenant_name=tenant_name,
                query=query,
                success=False,
                response_time_ms=120000,  # Timeout
                error="Request timed out after 120 seconds"
            )
        except Exception as e:
            if attempt < max_retries - 1:
                await asyncio.sleep(1)
                continue
            return QueryResult(
                tenant_name=tenant_name,
                query=query,
                success=False,
                response_time_ms=0,
                error=str(e)
            )

    # Should not reach here, but just in case
    return QueryResult(
        tenant_name=tenant_name,
        query=query,
        success=False,
        response_time_ms=0,
        error="Max retries exceeded"
    )


async def run_stress_test(
    tenants: list[tuple[str, str, list[str]]],  # List of (tenant_id, tenant_name, queries)
    total_queries: int = 50,
    concurrency: int = 5,
    rate_limit_delay: float = 0.5  # Delay between starting queries to avoid rate limits
) -> StressTestResults:
    """Run the stress test with specified concurrency and rate limiting"""

    results = StressTestResults()
    results.start_time = time.perf_counter()

    # Create work queue with randomized queries across tenants
    work_queue = []
    for _ in range(total_queries):
        tenant_id, tenant_name, queries = random.choice(tenants)
        query = random.choice(queries)
        work_queue.append((tenant_id, tenant_name, query))

    # Shuffle for realistic mixed load
    random.shuffle(work_queue)

    print(f"\n  Running {total_queries} queries with concurrency={concurrency}...")
    print(f"  Rate limit delay: {rate_limit_delay}s between query starts")

    # Create connection pool
    connector = aiohttp.TCPConnector(limit=concurrency * 2, limit_per_host=concurrency * 2)
    async with aiohttp.ClientSession(connector=connector) as session:
        # Process in batches for controlled concurrency
        semaphore = asyncio.Semaphore(concurrency)
        rate_limiter = asyncio.Lock()
        last_query_time = [0.0]  # Mutable container for closure

        async def bounded_query(tenant_id: str, tenant_name: str, query: str) -> QueryResult:
            # Rate limiting - ensure minimum delay between query starts
            async with rate_limiter:
                now = time.perf_counter()
                elapsed = now - last_query_time[0]
                if elapsed < rate_limit_delay:
                    await asyncio.sleep(rate_limit_delay - elapsed)
                last_query_time[0] = time.perf_counter()

            async with semaphore:
                return await run_query(session, tenant_id, tenant_name, query)

        # Create all tasks
        tasks = [
            bounded_query(tenant_id, tenant_name, query)
            for tenant_id, tenant_name, query in work_queue
        ]

        # Run with progress indicator
        completed = 0
        for coro in asyncio.as_completed(tasks):
            result = await coro
            completed += 1

            results.total_queries += 1
            if result.success:
                results.successful_queries += 1
                results.response_times.append(result.response_time_ms)
            else:
                results.failed_queries += 1
                results.errors.append(result.error)

            # Track per-tenant results
            if result.tenant_name not in results.results_by_tenant:
                results.results_by_tenant[result.tenant_name] = {
                    "total": 0, "success": 0, "times": []
                }
            results.results_by_tenant[result.tenant_name]["total"] += 1
            if result.success:
                results.results_by_tenant[result.tenant_name]["success"] += 1
                results.results_by_tenant[result.tenant_name]["times"].append(result.response_time_ms)

            # Progress indicator
            if completed % 5 == 0 or completed == total_queries:
                success_rate = (results.successful_queries / results.total_queries * 100) if results.total_queries > 0 else 0
                print(f"    Progress: {completed}/{total_queries} ({success_rate:.0f}% success)")

    results.end_time = time.perf_counter()
    return results


async def cleanup_test_tenants(session: aiohttp.ClientSession, tenant_ids: list[str]):
    """Clean up test tenants after stress test"""
    print("\n[5/5] Cleaning up test data...")

    for tenant_id in tenant_ids:
        # Note: You'd need a delete_tenant endpoint for full cleanup
        # For now, we'll just note they need manual cleanup
        print(f"  Tenant {tenant_id} - mark for cleanup")


def print_report(results: StressTestResults, tenants_created: int, docs_seeded: int):
    """Print formatted stress test report"""

    print("\n" + "=" * 70)
    print("                    ARCHEVI STRESS TEST REPORT")
    print("=" * 70)
    print(f"  Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Test Duration: {results.duration_seconds:.2f} seconds")
    print(f"  Tenants Created: {tenants_created}")
    print(f"  Documents Seeded: {docs_seeded}")
    print()

    print("-" * 70)
    print("  THROUGHPUT METRICS")
    print("-" * 70)
    print(f"  Total Queries:        {results.total_queries}")
    print(f"  Successful:           {results.successful_queries}")
    print(f"  Failed:               {results.failed_queries}")
    print(f"  Success Rate:         {results.success_rate:.1f}%")
    print(f"  Queries/Second:       {results.queries_per_second:.2f}")
    print()

    print("-" * 70)
    print("  LATENCY METRICS (milliseconds)")
    print("-" * 70)
    print(f"  Average:              {results.avg_ms:.0f} ms")
    print(f"  Median (p50):         {results.p50_ms:.0f} ms")
    print(f"  95th Percentile:      {results.p95_ms:.0f} ms")
    print(f"  99th Percentile:      {results.p99_ms:.0f} ms")
    if results.response_times:
        print(f"  Min:                  {min(results.response_times):.0f} ms")
        print(f"  Max:                  {max(results.response_times):.0f} ms")
    print()

    print("-" * 70)
    print("  PER-TENANT BREAKDOWN")
    print("-" * 70)
    for tenant_name, data in results.results_by_tenant.items():
        success_rate = (data["success"] / data["total"] * 100) if data["total"] > 0 else 0
        avg_time = statistics.mean(data["times"]) if data["times"] else 0
        print(f"  {tenant_name}:")
        print(f"    Queries: {data['total']} | Success: {success_rate:.0f}% | Avg: {avg_time:.0f}ms")
    print()

    # Cost estimates (based on Groq free tier + Cohere pricing)
    print("-" * 70)
    print("  COST ESTIMATES")
    print("-" * 70)
    # Groq: FREE for llama-3.3-70b-versatile
    # Cohere Embed v4: $0.10 per 1M tokens (~500 tokens per query embedding)
    # Cohere Rerank v3.5: $2.00 per 1M search units
    embed_cost = results.successful_queries * 0.0000005  # ~500 tokens at $0.10/1M
    rerank_cost = results.successful_queries * 0.000002  # $2/1M search units
    total_cost = embed_cost + rerank_cost

    print(f"  Groq Generation:      $0.00 (FREE tier)")
    print(f"  Cohere Embeddings:    ${embed_cost:.4f}")
    print(f"  Cohere Reranking:     ${rerank_cost:.4f}")
    print(f"  Total Estimated:      ${total_cost:.4f}")
    print(f"  Cost per Query:       ${total_cost/max(results.successful_queries,1)*1000:.4f} per 1000 queries")
    print()

    if results.errors:
        print("-" * 70)
        print("  ERRORS (first 5)")
        print("-" * 70)
        for error in results.errors[:5]:
            print(f"  - {error[:100]}...")

    print("=" * 70)


async def main():
    parser = argparse.ArgumentParser(description="Archevi Multi-Tenant Stress Test")
    parser.add_argument("--queries", type=int, default=30, help="Total queries to run")
    parser.add_argument("--concurrency", type=int, default=3, help="Concurrent requests (default: 3 for rate limits)")
    parser.add_argument("--delay", type=float, default=1.0, help="Delay between queries in seconds (default: 1.0)")
    parser.add_argument("--skip-seed", action="store_true", help="Skip tenant/document creation")
    parser.add_argument("--use-existing", action="store_true", help="Use existing Hudson tenant only")
    parser.add_argument("--reuse-tenants", type=str, help="Comma-separated tenant IDs to reuse")
    args = parser.parse_args()

    print("\n" + "=" * 70)
    print("            ARCHEVI MULTI-TENANT STRESS TEST")
    print("=" * 70)
    print(f"  Configuration: {args.queries} queries, {args.concurrency} concurrent, {args.delay}s delay")
    print("=" * 70)

    connector = aiohttp.TCPConnector(limit=10)
    async with aiohttp.ClientSession(connector=connector) as session:
        tenants_to_test = []
        created_tenant_ids = []
        total_docs_seeded = 0

        if args.use_existing:
            # Use existing Hudson tenant only
            print("\n[1/4] Using existing Hudson tenant...")
            tenants_to_test.append((
                "5302d94d-4c08-459d-b49f-d211abdb4047",
                "The Hudson Family",
                ["What insurance documents do I have?", "Show me medical records", "Find recipes"]
            ))
        elif args.reuse_tenants:
            # Reuse specified tenant IDs with the TEST_FAMILIES queries
            print("\n[1/4] Reusing existing test tenants...")
            tenant_ids = [t.strip() for t in args.reuse_tenants.split(",")]
            for i, tenant_id in enumerate(tenant_ids[:len(TEST_FAMILIES)]):
                family = TEST_FAMILIES[i]
                tenants_to_test.append((tenant_id, family["name"], family["queries"]))
                print(f"  Using tenant {tenant_id} as {family['name']}")
        else:
            # Create test tenants
            print("\n[1/4] Creating test tenants...")
            for family in TEST_FAMILIES:
                tenant_id = await create_tenant(session, family)
                if tenant_id:
                    created_tenant_ids.append(tenant_id)
                    tenants_to_test.append((tenant_id, family["name"], family["queries"]))

                    # Seed documents for this tenant
                    if not args.skip_seed:
                        print(f"  Seeding documents for {family['name']}...")
                        for doc in family["documents"]:
                            success = await seed_document(session, tenant_id, doc)
                            if success:
                                total_docs_seeded += 1
                        print(f"    Seeded {len(family['documents'])} documents")

                    # Small delay between tenant creation
                    await asyncio.sleep(0.5)

        if not tenants_to_test:
            print("\nERROR: No tenants available for testing!")
            return

        print(f"\n[2/4] Test setup complete:")
        print(f"  - Tenants ready: {len(tenants_to_test)}")
        print(f"  - Documents seeded: {total_docs_seeded}")

        # Run stress test
        print(f"\n[3/4] Running stress test...")
        results = await run_stress_test(
            tenants_to_test,
            total_queries=args.queries,
            concurrency=args.concurrency,
            rate_limit_delay=args.delay
        )

        # Print report
        print(f"\n[4/4] Generating report...")
        print_report(results, len(created_tenant_ids), total_docs_seeded)

        # Note about cleanup
        if created_tenant_ids:
            print("\nNOTE: Test tenants created. To clean up, delete these tenant IDs:")
            for tid in created_tenant_ids:
                print(f"  - {tid}")


if __name__ == "__main__":
    asyncio.run(main())

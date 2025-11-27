"""
Test the RAG query by calling the Windmill script directly.
"""

import json
import urllib.request

BASE_URL = "http://localhost/api/w/family-brain"
TOKEN = "9goQa0kzfw15lT9okYDCG6HiwTmiEYfO"

def run_query(query: str):
    """Run a RAG query and return the result."""
    url = f"{BASE_URL}/jobs/run_wait_result/p/f/chatbot/rag_query"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    data = json.dumps({"query": query}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        return {"error": f"{e.code} {e.reason}", "details": error_body[:500]}
    except Exception as e:
        return {"error": str(e)}

def main():
    test_queries = [
        "What is my auto insurance policy number?",
        "When does my insurance expire?",
        "How much was the invoice from ABC Testing?",
        "Who is my doctor?",
    ]

    print("Testing Family Second Brain RAG Query")
    print("=" * 60)

    for query in test_queries:
        print(f"\nQuery: {query}")
        print("-" * 40)

        result = run_query(query)

        if "error" in result:
            print(f"ERROR: {result['error']}")
            if "details" in result:
                print(f"Details: {result['details'][:200]}")
        else:
            print(f"Answer: {result.get('answer', 'N/A')[:300]}...")
            print(f"Confidence: {result.get('confidence', 'N/A')}")
            sources = result.get('sources', [])
            if sources:
                print("Sources:")
                for s in sources:
                    print(f"  - {s.get('title', 'N/A')} ({s.get('category', 'N/A')}) - {s.get('relevance', 'N/A')}")

        print()

if __name__ == "__main__":
    main()

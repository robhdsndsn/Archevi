"""
Upload test documents to Family Second Brain via Windmill API.
This embeds each document using Cohere and stores in PostgreSQL with pgvector.
"""

import json
import urllib.request
import os

# Test documents to upload
documents = [
    {
        "title": "Family Info - Insurance, Medical, Financial",
        "content": """Test Family Document

Insurance Policy: ABC Insurance
Policy Number: 12345
Expiry Date: December 31, 2025

This is a test document to verify upload functionality works correctly.

Medical Information:
- Doctor: Dr. Smith
- Phone: 555-1234
- Last Visit: August 1, 2025

Financial Info:
- Bank: Example Bank
- Account: ****5678
- Balance: $5,000

This document contains various family information for testing the RAG system.""",
        "category": "general"
    },
    {
        "title": "Invoice from ABC Testing Corp",
        "content": """INVOICE #12345

Date: July 29, 2025
Company: ABC Testing Corp
Address: 123 Test Street, Testing City, TC 12345

Bill To:
Test Family
456 Family Lane
Family City, FC 67890

Description: OCR Testing Services
Amount: $100.00
Tax: $8.00
Total: $108.00

This is a test invoice to verify OCR functionality is working properly after installing poppler-utils and tesseract-ocr dependencies in the Docker container.""",
        "category": "invoices"
    },
    {
        "title": "Auto Insurance Policy FAM-2024-001",
        "content": """FAMILY INSURANCE POLICY

Policy Number: FAM-2024-001
Premium: $1,200 annually
Coverage: Auto insurance for family vehicle
Deductible: $500
Expiration Date: December 31, 2024

This policy covers comprehensive auto insurance for the Hudson family vehicle including collision, liability, and comprehensive coverage with a $500 deductible.""",
        "category": "insurance"
    },
    {
        "title": "Honda Civic Auto Insurance Policy INS-2024-001234",
        "content": """INSURANCE POLICY DOCUMENT

Policy Number: INS-2024-001234
Policyholder: Hudson Family
Coverage: Auto Insurance

Vehicle Information:
2021 Honda Civic
License Plate: ABC-1234

Coverage Details:
- Liability Coverage: $100,000/$300,000
- Comprehensive Coverage: $500 deductible
- Collision Coverage: $500 deductible

Policy Period: January 1, 2024 - December 31, 2024
Premium: $1,200 annually

Important Notes:
This auto insurance policy provides comprehensive coverage for the insured vehicle. Policy expires on December 31, 2024. Please renew before expiration to maintain continuous coverage.

Contact Information:
Insurance Agent: John Smith
Phone: (555) 123-4567
Email: john.smith@insurance.com""",
        "category": "insurance"
    }
]

# Windmill API config
BASE_URL = "http://localhost/api/w/family-brain"
TOKEN = "9goQa0kzfw15lT9okYDCG6HiwTmiEYfO"

def run_script(path: str, args: dict):
    """Run a Windmill script and return the result."""
    url = f"{BASE_URL}/jobs/run_wait_result/p/{path}"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }

    data = json.dumps(args).encode("utf-8")
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
    print("Uploading test documents to Family Second Brain...")
    print("=" * 60)

    for i, doc in enumerate(documents, 1):
        print(f"\n[{i}/{len(documents)}] Uploading: {doc['title'][:50]}...")

        result = run_script("f/chatbot/embed_document", {
            "title": doc["title"],
            "content": doc["content"],
            "category": doc["category"]
        })

        if "error" in result:
            print(f"  ERROR: {result['error']}")
            if "details" in result:
                print(f"  Details: {result['details'][:200]}")
        else:
            print(f"  SUCCESS: Document ID {result.get('document_id', 'N/A')}")
            print(f"  Tokens: {result.get('tokens_used', 'N/A')}")

    print("\n" + "=" * 60)
    print("Upload complete! Try asking questions in the app:")
    print("  - 'What is my auto insurance policy number?'")
    print("  - 'When does my insurance expire?'")
    print("  - 'How much was the invoice from ABC Testing?'")
    print("  - 'Who is my doctor?'")

if __name__ == "__main__":
    main()

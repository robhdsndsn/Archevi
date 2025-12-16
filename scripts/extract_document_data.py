# extract_document_data.py
# Windmill Python script for smart dynamic data extraction from documents
# Path: f/chatbot/extract_document_data
#
# requirements:
#   - cohere
#   - psycopg2-binary
#   - wmill
#   - httpx

"""
Extract structured data from documents using AI with DYNAMIC field discovery.

Instead of rigid category schemas, this approach:
1. Lets AI discover what data is actually present
2. Classifies each extracted item by type (date, amount, person, etc.)
3. Assigns importance levels to each item
4. Works well regardless of document category

Args:
    document_id (int): Document ID to extract data from
    tenant_id (str): Tenant UUID for authorization
    force_reextract (bool): Re-extract even if data exists (default: False)

Returns:
    dict: {
        success: bool,
        document_id: int,
        category: str,
        extracted_data: {
            items: list[{label, value, type, importance}],
            summary: str,
            key_dates: list,
            key_amounts: list,
            key_people: list,
            key_references: list
        },
        item_count: int,
        tokens_used: int,
        error: str (if failed)
    }
"""

import cohere
import psycopg2
from typing import Optional, Dict, Any, List
import wmill
import re
import json


# Data types for extracted items
DATA_TYPES = [
    'date',           # Any date or time
    'amount',         # Money, quantities, measurements
    'person',         # Names of people
    'organization',   # Companies, institutions, agencies
    'reference',      # Policy numbers, account numbers, IDs
    'contact',        # Phone, email, address
    'location',       # Places, addresses
    'duration',       # Time periods, frequencies
    'percentage',     # Rates, percentages
    'text',           # General text values
]

# Category hints help AI understand context but don't constrain extraction
CATEGORY_HINTS = {
    'insurance': "This appears to be an insurance document. Look for policy details, coverage, premiums, dates, beneficiaries.",
    'medical': "This appears to be a medical document. Look for patient info, providers, diagnoses, medications, appointments.",
    'financial': "This appears to be a financial document. Look for accounts, balances, transactions, institutions, dates.",
    'legal': "This appears to be a legal document. Look for parties, terms, dates, obligations, signatures.",
    'invoices': "This appears to be an invoice or receipt. Look for vendor, items, amounts, dates, payment info.",
    'recipes': "This appears to be a recipe. Look for ingredients, quantities, times, servings, instructions.",
    'education': "This appears to be an education document. Look for student info, grades, dates, institutions.",
    'travel': "This appears to be a travel document. Look for dates, destinations, confirmation numbers, travelers.",
    'general': "Analyze this document and extract all key information you can find.",
}


def build_dynamic_extraction_prompt(content: str, category: str, title: str) -> str:
    """Build extraction prompt that discovers data dynamically."""
    hint = CATEGORY_HINTS.get(category, CATEGORY_HINTS['general'])

    return f"""Analyze this document and extract ALL key information.

CONTEXT: {hint}
DOCUMENT TITLE: {title}

For EACH piece of important data you find, provide:
- label: A clear name for what this data represents (e.g., "Policy Expiry Date", "Monthly Premium", "Primary Insured")
- value: The actual value from the document
- type: One of: date, amount, person, organization, reference, contact, location, duration, percentage, text
- importance: "high" (critical info like expiry dates, totals), "medium" (useful context), or "low" (minor details)

GUIDELINES:
1. Extract what's ACTUALLY in the document - don't invent fields
2. Be specific with labels (not "Date" but "Policy Effective Date")
3. Normalize dates to YYYY-MM-DD format when possible
4. Include units for amounts when present ($, %, days, etc.)
5. Mark expiry dates, deadlines, and renewal dates as HIGH importance
6. Mark names of primary people/organizations as HIGH importance
7. Extract reference numbers, policy numbers, account numbers
8. If you find contact info (phone, email, address), include it

Also provide:
- summary: A 1-2 sentence summary of what this document is about
- document_type: Your best guess at the specific document type (e.g., "Auto Insurance Policy", "Lab Results", "Credit Card Statement")

Return ONLY valid JSON in this exact format:
{{
  "items": [
    {{"label": "...", "value": "...", "type": "...", "importance": "high|medium|low"}},
    ...
  ],
  "summary": "...",
  "document_type": "..."
}}

DOCUMENT CONTENT:
{content[:8000]}

JSON OUTPUT:"""


def extract_with_ai(content: str, category: str, title: str, co: cohere.ClientV2) -> Dict[str, Any]:
    """Use Cohere to extract data dynamically."""
    prompt = build_dynamic_extraction_prompt(content, category, title)
    response_text = ""

    try:
        print(f"[Dynamic Extraction] Starting for category: {category}")
        print(f"[Dynamic Extraction] Content length: {len(content)} chars")

        # Use command-r7b for faster extraction, or command-a for more complex docs
        # Note: command-r was deprecated Sept 2025, use command-a-03-2025 or command-r-08-2024
        model = "command-r7b-12-2024" if len(content) < 4000 else "command-a-03-2025"
        print(f"[Dynamic Extraction] Using model: {model}")

        response = co.chat(
            model=model,
            messages=[{
                "role": "user",
                "content": prompt
            }],
        )

        response_text = response.message.content[0].text.strip()
        print(f"[Dynamic Extraction] Got response: {len(response_text)} chars")

        # Parse JSON from response
        if '```json' in response_text:
            match = re.search(r'```json\s*(.*?)\s*```', response_text, re.DOTALL)
            if match:
                response_text = match.group(1)
        elif '```' in response_text:
            match = re.search(r'```\s*(.*?)\s*```', response_text, re.DOTALL)
            if match:
                response_text = match.group(1)

        # Find JSON object
        start = response_text.find('{')
        end = response_text.rfind('}') + 1
        if start >= 0 and end > start:
            json_str = response_text[start:end]
            extracted = json.loads(json_str)

            items = extracted.get('items', [])
            print(f"[Dynamic Extraction] Extracted {len(items)} items")

            # Validate and clean items
            valid_items = []
            for item in items:
                if all(k in item for k in ['label', 'value', 'type', 'importance']):
                    # Normalize type
                    item['type'] = item['type'].lower()
                    if item['type'] not in DATA_TYPES:
                        item['type'] = 'text'
                    # Normalize importance
                    item['importance'] = item['importance'].lower()
                    if item['importance'] not in ['high', 'medium', 'low']:
                        item['importance'] = 'medium'
                    # Skip empty values
                    if item['value'] and str(item['value']).strip():
                        valid_items.append(item)

            return {
                'items': valid_items,
                'summary': extracted.get('summary', ''),
                'document_type': extracted.get('document_type', ''),
                'raw_response': response_text[:500],
                'tokens': len(content.split()) + len(prompt.split()) + 200
            }
        else:
            print(f"[Dynamic Extraction] No JSON found in response")

    except json.JSONDecodeError as e:
        print(f"[Dynamic Extraction] JSON parse error: {e}")
        print(f"[Dynamic Extraction] Response was: {response_text[:300]}")
    except Exception as e:
        print(f"[Dynamic Extraction] Error: {type(e).__name__}: {e}")
        return {
            'items': [],
            'error': str(e),
            'raw_response': response_text[:500] if response_text else '',
            'tokens': 0
        }

    return {'items': [], 'tokens': 0}


def extract_patterns(content: str) -> List[Dict[str, Any]]:
    """Extract common patterns using regex (fast, no API) as fallback items."""
    items = []

    # Phone numbers
    phone_matches = re.findall(r'\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b', content)
    for phone in list(set(phone_matches))[:3]:
        items.append({
            'label': 'Phone Number',
            'value': phone,
            'type': 'contact',
            'importance': 'medium',
            'source': 'pattern'
        })

    # Emails
    email_matches = re.findall(r'\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b', content)
    for email in list(set(email_matches))[:3]:
        items.append({
            'label': 'Email Address',
            'value': email,
            'type': 'contact',
            'importance': 'medium',
            'source': 'pattern'
        })

    # Dollar amounts (large ones are likely important)
    amount_matches = re.findall(r'\$[\d,]+(?:\.\d{2})?', content)
    amounts_with_values = []
    for amt in amount_matches:
        try:
            val = float(amt.replace('$', '').replace(',', ''))
            amounts_with_values.append((amt, val))
        except:
            pass
    # Sort by value, take top amounts
    amounts_with_values.sort(key=lambda x: x[1], reverse=True)
    for amt, val in amounts_with_values[:5]:
        importance = 'high' if val >= 1000 else 'medium' if val >= 100 else 'low'
        items.append({
            'label': 'Amount',
            'value': amt,
            'type': 'amount',
            'importance': importance,
            'source': 'pattern'
        })

    # Policy/Reference numbers
    ref_matches = re.findall(r'\b([A-Z]{2,4}[-\s]?\d{6,12})\b', content)
    for ref in list(set(ref_matches))[:3]:
        items.append({
            'label': 'Reference Number',
            'value': ref,
            'type': 'reference',
            'importance': 'high',
            'source': 'pattern'
        })

    return items


def organize_extracted_data(items: List[Dict], summary: str, document_type: str) -> Dict[str, Any]:
    """Organize extracted items into a structured format."""
    result = {
        'items': items,
        'summary': summary,
        'document_type': document_type,
        'key_dates': [],
        'key_amounts': [],
        'key_people': [],
        'key_organizations': [],
        'key_references': [],
        'high_importance': [],
    }

    for item in items:
        # Group by type for quick access
        if item['type'] == 'date':
            result['key_dates'].append({'label': item['label'], 'value': item['value']})
        elif item['type'] == 'amount':
            result['key_amounts'].append({'label': item['label'], 'value': item['value']})
        elif item['type'] == 'person':
            result['key_people'].append({'label': item['label'], 'value': item['value']})
        elif item['type'] == 'organization':
            result['key_organizations'].append({'label': item['label'], 'value': item['value']})
        elif item['type'] == 'reference':
            result['key_references'].append({'label': item['label'], 'value': item['value']})

        # Collect high importance items
        if item['importance'] == 'high':
            result['high_importance'].append({'label': item['label'], 'value': item['value'], 'type': item['type']})

    return result


def main(
    document_id: int,
    tenant_id: str,
    force_reextract: bool = False,
) -> dict:
    """
    Extract structured data from a document using dynamic discovery.
    """
    if not document_id or not tenant_id:
        return {
            "success": False,
            "error": "document_id and tenant_id are required"
        }

    # Get resources
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    conn = psycopg2.connect(
        host=postgres_db['host'],
        port=postgres_db['port'],
        dbname=postgres_db['dbname'],
        user=postgres_db['user'],
        password=postgres_db['password'],
        sslmode=postgres_db.get('sslmode', 'disable')
    )

    cursor = conn.cursor()

    try:
        # Get document
        cursor.execute("""
            SELECT id, title, content, category, extracted_data
            FROM family_documents
            WHERE id = %s AND tenant_id = %s::uuid
        """, (document_id, tenant_id))

        row = cursor.fetchone()
        if not row:
            cursor.close()
            conn.close()
            return {
                "success": False,
                "error": f"Document {document_id} not found or access denied"
            }

        doc_id, title, content, category, existing_data = row

        # Check if already extracted (and has items array = v2 format)
        if existing_data and isinstance(existing_data, dict):
            if existing_data.get('items') and not force_reextract:
                cursor.close()
                conn.close()
                return {
                    "success": True,
                    "document_id": doc_id,
                    "category": category,
                    "extracted_data": existing_data,
                    "item_count": len(existing_data.get('items', [])),
                    "tokens_used": 0,
                    "already_extracted": True
                }

        # Initialize Cohere
        co = cohere.ClientV2(api_key=cohere_api_key)

        # First, extract patterns (fast, no API call)
        pattern_items = extract_patterns(content)

        # Then, use AI for dynamic extraction
        ai_result = extract_with_ai(content, category, title, co)
        ai_items = ai_result.get('items', [])
        summary = ai_result.get('summary', '')
        document_type = ai_result.get('document_type', '')

        # Merge: AI items take precedence, add pattern items that AI missed
        all_items = ai_items.copy()
        ai_values = set(str(item['value']).lower() for item in ai_items)

        for pattern_item in pattern_items:
            if str(pattern_item['value']).lower() not in ai_values:
                all_items.append(pattern_item)

        # Organize into structured format
        extracted_data = organize_extracted_data(all_items, summary, document_type)

        # Save to database
        cursor.execute("""
            UPDATE family_documents
            SET extracted_data = %s,
                updated_at = NOW()
            WHERE id = %s
        """, (json.dumps(extracted_data), doc_id))

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "document_id": doc_id,
            "category": category,
            "extracted_data": extracted_data,
            "item_count": len(all_items),
            "high_importance_count": len(extracted_data.get('high_importance', [])),
            "tokens_used": ai_result.get('tokens', 0),
            "document_type": document_type
        }

    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return {
            "success": False,
            "document_id": document_id,
            "error": str(e)
        }


def extract_batch(
    tenant_id: str,
    limit: int = 50,
    category: Optional[str] = None,
    reextract_v1: bool = False,
) -> dict:
    """
    Batch extract data from documents.

    Args:
        tenant_id: Tenant UUID
        limit: Maximum documents to process
        category: Optional category filter
        reextract_v1: Re-extract docs with old v1 format (no 'items' array)

    Returns:
        dict with processed count and results
    """
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    conn = psycopg2.connect(
        host=postgres_db['host'],
        port=postgres_db['port'],
        dbname=postgres_db['dbname'],
        user=postgres_db['user'],
        password=postgres_db['password'],
        sslmode=postgres_db.get('sslmode', 'disable')
    )

    cursor = conn.cursor()

    # Find documents to process
    if reextract_v1:
        # Re-extract docs that have old format (no 'items' key)
        query = """
            SELECT id FROM family_documents
            WHERE tenant_id = %s::uuid
              AND extracted_data IS NOT NULL
              AND extracted_data != '{}'::jsonb
              AND NOT (extracted_data ? 'items')
        """
    else:
        # Extract docs without any extracted data
        query = """
            SELECT id FROM family_documents
            WHERE tenant_id = %s::uuid
              AND (extracted_data IS NULL OR extracted_data = '{}'::jsonb)
        """

    params = [tenant_id]

    if category:
        query += " AND category = %s"
        params.append(category)

    query += " ORDER BY created_at DESC LIMIT %s"
    params.append(limit)

    cursor.execute(query, params)
    doc_ids = [row[0] for row in cursor.fetchall()]

    cursor.close()
    conn.close()

    # Process each document
    results = []
    for doc_id in doc_ids:
        result = main(doc_id, tenant_id, force_reextract=True)
        results.append({
            'document_id': doc_id,
            'success': result.get('success', False),
            'item_count': result.get('item_count', 0),
            'document_type': result.get('document_type', '')
        })

    return {
        "processed": len(results),
        "successful": sum(1 for r in results if r['success']),
        "total_items_extracted": sum(r.get('item_count', 0) for r in results),
        "results": results
    }

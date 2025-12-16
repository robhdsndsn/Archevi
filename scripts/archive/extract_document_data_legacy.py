# extract_document_data.py
# Windmill Python script for smart data extraction from documents
# Path: f/chatbot/extract_document_data
#
# requirements:
#   - cohere
#   - psycopg2-binary
#   - wmill
#   - httpx

"""
Extract structured data from documents using AI.

Analyzes document content and extracts key fields based on category:
- Insurance: policy number, coverage, deductible, expiry, provider
- Medical: patient, provider, date, diagnosis, medications
- Financial: account numbers, balances, dates, institution
- Legal: parties, dates, document type
- Invoices: vendor, amounts, dates, items
- Recipes: ingredients, prep time, servings
- General: people, dates, amounts, organizations

Args:
    document_id (int): Document ID to extract data from
    tenant_id (str): Tenant UUID for authorization
    force_reextract (bool): Re-extract even if data exists (default: False)

Returns:
    dict: {
        success: bool,
        document_id: int,
        category: str,
        extracted_data: dict,
        confidence: float,
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


# Extraction schemas per category
EXTRACTION_SCHEMAS = {
    'insurance': {
        'fields': [
            ('policy_number', 'string', 'Policy or account number'),
            ('provider', 'string', 'Insurance company name'),
            ('coverage_type', 'string', 'Type of coverage (auto, home, life, health)'),
            ('coverage_amount', 'number', 'Total coverage amount in dollars'),
            ('deductible', 'number', 'Deductible amount in dollars'),
            ('premium', 'number', 'Premium amount'),
            ('premium_frequency', 'string', 'Payment frequency (monthly, annual)'),
            ('effective_date', 'date', 'Policy start date'),
            ('expiry_date', 'date', 'Policy end/renewal date'),
            ('insured_name', 'string', 'Name of insured person/property'),
            ('beneficiaries', 'list', 'List of beneficiaries'),
        ],
    },
    'medical': {
        'fields': [
            ('patient_name', 'string', 'Patient name'),
            ('provider_name', 'string', 'Doctor or facility name'),
            ('visit_date', 'date', 'Date of visit/service'),
            ('diagnosis', 'list', 'Diagnosis codes or descriptions'),
            ('medications', 'list', 'Prescribed medications'),
            ('dosage', 'string', 'Medication dosage instructions'),
            ('next_appointment', 'date', 'Next scheduled appointment'),
            ('allergies', 'list', 'Known allergies'),
            ('blood_type', 'string', 'Blood type if mentioned'),
            ('test_results', 'string', 'Summary of test results'),
        ],
    },
    'financial': {
        'fields': [
            ('institution', 'string', 'Bank or financial institution name'),
            ('account_number', 'string', 'Account number (last 4 digits safe)'),
            ('account_type', 'string', 'Type of account (checking, savings, investment)'),
            ('balance', 'number', 'Current balance'),
            ('statement_date', 'date', 'Statement date'),
            ('statement_period', 'string', 'Period covered'),
            ('interest_rate', 'number', 'Interest rate if applicable'),
            ('transactions_summary', 'string', 'Brief transaction summary'),
        ],
    },
    'legal': {
        'fields': [
            ('document_type', 'string', 'Type of legal document'),
            ('parties', 'list', 'Parties involved'),
            ('effective_date', 'date', 'Date agreement takes effect'),
            ('expiry_date', 'date', 'Expiration date if applicable'),
            ('jurisdiction', 'string', 'Legal jurisdiction'),
            ('key_terms', 'list', 'Key terms or obligations'),
            ('witnesses', 'list', 'Witness names'),
            ('notary', 'string', 'Notary information'),
        ],
    },
    'invoices': {
        'fields': [
            ('vendor', 'string', 'Vendor/company name'),
            ('invoice_number', 'string', 'Invoice or receipt number'),
            ('invoice_date', 'date', 'Invoice date'),
            ('due_date', 'date', 'Payment due date'),
            ('subtotal', 'number', 'Subtotal amount'),
            ('tax', 'number', 'Tax amount'),
            ('total', 'number', 'Total amount'),
            ('items', 'list', 'Line items purchased'),
            ('payment_method', 'string', 'Payment method if shown'),
            ('warranty_info', 'string', 'Warranty information if present'),
        ],
    },
    'recipes': {
        'fields': [
            ('recipe_name', 'string', 'Name of the recipe'),
            ('cuisine_type', 'string', 'Type of cuisine'),
            ('prep_time', 'string', 'Preparation time'),
            ('cook_time', 'string', 'Cooking time'),
            ('total_time', 'string', 'Total time'),
            ('servings', 'number', 'Number of servings'),
            ('ingredients', 'list', 'List of ingredients'),
            ('calories', 'number', 'Calories per serving if mentioned'),
            ('difficulty', 'string', 'Difficulty level'),
            ('dietary_tags', 'list', 'Dietary tags (vegan, gluten-free, etc.)'),
        ],
    },
    'education': {
        'fields': [
            ('student_name', 'string', 'Student name'),
            ('institution', 'string', 'School or institution name'),
            ('document_type', 'string', 'Type (transcript, diploma, report card)'),
            ('date_issued', 'date', 'Date issued'),
            ('grade_level', 'string', 'Grade or year'),
            ('gpa', 'number', 'GPA if applicable'),
            ('degree', 'string', 'Degree name if applicable'),
            ('major', 'string', 'Major/field of study'),
            ('honors', 'list', 'Honors or awards'),
        ],
    },
    'travel': {
        'fields': [
            ('document_type', 'string', 'Type (passport, visa, ticket, reservation)'),
            ('traveler_name', 'string', 'Traveler name'),
            ('document_number', 'string', 'Document/confirmation number'),
            ('issue_date', 'date', 'Issue date'),
            ('expiry_date', 'date', 'Expiry date'),
            ('destination', 'string', 'Destination'),
            ('departure_date', 'date', 'Departure date'),
            ('return_date', 'date', 'Return date'),
            ('airline_hotel', 'string', 'Airline or hotel name'),
            ('nationality', 'string', 'Nationality/issuing country'),
        ],
    },
    'general': {
        'fields': [
            ('people_mentioned', 'list', 'Names of people mentioned'),
            ('organizations', 'list', 'Organizations mentioned'),
            ('dates', 'list', 'Important dates found'),
            ('amounts', 'list', 'Monetary amounts mentioned'),
            ('locations', 'list', 'Locations or addresses'),
            ('phone_numbers', 'list', 'Phone numbers found'),
            ('emails', 'list', 'Email addresses found'),
            ('key_points', 'list', 'Key points or summary items'),
        ],
    },
}


def build_extraction_prompt(content: str, category: str, title: str) -> str:
    """Build the extraction prompt for a given category."""
    schema = EXTRACTION_SCHEMAS.get(category, EXTRACTION_SCHEMAS['general'])

    fields_description = "\n".join([
        f"- {name} ({dtype}): {desc}"
        for name, dtype, desc in schema['fields']
    ])

    return f"""Extract structured data from this {category} document.

DOCUMENT TITLE: {title}

FIELDS TO EXTRACT:
{fields_description}

INSTRUCTIONS:
1. Extract only information that is explicitly stated in the document
2. Use null for fields that are not found or unclear
3. For dates, use ISO format (YYYY-MM-DD) when possible
4. For amounts, extract just the number without currency symbols
5. For lists, return an array of strings
6. Be precise - don't infer or guess values

Return ONLY a valid JSON object with the extracted fields. No explanation.

DOCUMENT CONTENT:
{content[:6000]}

JSON OUTPUT:"""


def extract_with_ai(content: str, category: str, title: str, co: cohere.ClientV2) -> Dict[str, Any]:
    """Use Cohere to extract structured data."""
    prompt = build_extraction_prompt(content, category, title)
    response_text = ""

    try:
        print(f"[AI Extraction] Starting for category: {category}")
        print(f"[AI Extraction] Content length: {len(content)} chars")

        response = co.chat(
            model="command-r7b-12-2024",  # Use faster model for extraction
            messages=[{
                "role": "user",
                "content": prompt
            }],
            temperature=0.1,  # Low temperature for consistent extraction
        )

        response_text = response.message.content[0].text.strip()
        print(f"[AI Extraction] Got response: {len(response_text)} chars")

        # Try to parse JSON from response
        # Handle potential markdown code blocks
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
            print(f"[AI Extraction] Parsed {len(extracted)} fields")

            # Clean up null values and empty strings
            cleaned = {}
            for key, value in extracted.items():
                if value is not None and value != "" and value != []:
                    cleaned[key] = value

            return {
                'data': cleaned,
                'raw_response': response_text[:500],
                'tokens': len(content.split()) + len(prompt.split()) + 100
            }
        else:
            print(f"[AI Extraction] No JSON found in response")

    except json.JSONDecodeError as e:
        print(f"[AI Extraction] JSON parse error: {e}")
        print(f"[AI Extraction] Response was: {response_text[:300]}")
    except Exception as e:
        print(f"[AI Extraction] Error: {type(e).__name__}: {e}")
        return {
            'data': {},
            'error': str(e),
            'raw_response': response_text[:500] if response_text else '',
            'tokens': 0
        }

    return {'data': {}, 'tokens': 0}


def extract_patterns(content: str) -> Dict[str, Any]:
    """Extract common patterns using regex (fast, no API)."""
    patterns = {}

    # Phone numbers
    phone_matches = re.findall(r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b', content)
    if phone_matches:
        patterns['phone_numbers'] = list(set(phone_matches[:5]))

    # Emails
    email_matches = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', content)
    if email_matches:
        patterns['emails'] = list(set(email_matches[:5]))

    # Dollar amounts
    amount_matches = re.findall(r'\$[\d,]+(?:\.\d{2})?', content)
    if amount_matches:
        patterns['amounts'] = list(set(amount_matches[:10]))

    # Dates (various formats)
    date_matches = re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', content)
    date_matches += re.findall(r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b', content, re.IGNORECASE)
    if date_matches:
        patterns['dates_found'] = list(set(date_matches[:10]))

    # Policy/account numbers (alphanumeric patterns)
    policy_matches = re.findall(r'\b[A-Z]{2,4}[-\s]?\d{6,12}\b', content)
    if policy_matches:
        patterns['reference_numbers'] = list(set(policy_matches[:5]))

    return patterns


def main(
    document_id: int,
    tenant_id: str,
    force_reextract: bool = False,
) -> dict:
    """
    Extract structured data from a document.
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

        # Check if already extracted
        if existing_data and existing_data != {} and not force_reextract:
            cursor.close()
            conn.close()
            return {
                "success": True,
                "document_id": doc_id,
                "category": category,
                "extracted_data": existing_data,
                "confidence": 1.0,
                "tokens_used": 0,
                "already_extracted": True
            }

        # Initialize Cohere
        co = cohere.ClientV2(api_key=cohere_api_key)

        # First, extract patterns (fast)
        pattern_data = extract_patterns(content)

        # Then, use AI for structured extraction
        ai_result = extract_with_ai(content, category, title, co)
        ai_data = ai_result.get('data', {})

        # Merge pattern data with AI data (AI takes precedence)
        merged_data = {**pattern_data, **ai_data}

        # Calculate confidence based on how many fields were extracted
        schema = EXTRACTION_SCHEMAS.get(category, EXTRACTION_SCHEMAS['general'])
        expected_fields = len(schema['fields'])
        extracted_fields = len([v for v in merged_data.values() if v])
        confidence = min(0.95, extracted_fields / max(expected_fields, 1))

        # Save to database
        cursor.execute("""
            UPDATE family_documents
            SET extracted_data = %s,
                updated_at = NOW()
            WHERE id = %s
        """, (json.dumps(merged_data), doc_id))

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "document_id": doc_id,
            "category": category,
            "extracted_data": merged_data,
            "confidence": round(confidence, 2),
            "tokens_used": ai_result.get('tokens', 0),
            "fields_extracted": extracted_fields
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
) -> dict:
    """
    Batch extract data from documents that don't have extracted_data.

    Args:
        tenant_id: Tenant UUID
        limit: Maximum documents to process
        category: Optional category filter

    Returns:
        dict with processed count and results
    """
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

    # Find documents without extracted data
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
        result = main(doc_id, tenant_id, force_reextract=False)
        results.append({
            'document_id': doc_id,
            'success': result.get('success', False),
            'fields_extracted': result.get('fields_extracted', 0)
        })

    return {
        "processed": len(results),
        "successful": sum(1 for r in results if r['success']),
        "results": results
    }

# generate_timeline_events.py
# Windmill Python script for extracting timeline events from documents using AI
# Path: f/chatbot/generate_timeline_events
#
# requirements:
#   - psycopg2-binary
#   - groq
#   - wmill

"""
Extract timeline events from a document using AI and store them in the database.

This script analyzes document content and extracts significant dates and events,
storing them in the timeline_events table for visualization.

Args:
    document_id (str): The document UUID to extract events from
    tenant_id (str): Tenant UUID for multi-tenant isolation
    user_id (int): User performing the extraction (for audit)

Returns:
    dict: {
        success: bool,
        events_created: int,
        events: list[dict],
        error: str (if failed)
    }
"""

import psycopg2
import json
from datetime import datetime
from typing import Optional
import wmill
from groq import Groq


# Event type mapping for categorization
EVENT_TYPE_KEYWORDS = {
    'birth': ['born', 'birth', 'birthday', 'date of birth', 'dob'],
    'death': ['death', 'died', 'deceased', 'passed away', 'obituary'],
    'wedding': ['married', 'marriage', 'wedding', 'spouse', 'wed'],
    'anniversary': ['anniversary'],
    'graduation': ['graduated', 'graduation', 'degree', 'diploma'],
    'medical': ['medical', 'doctor', 'hospital', 'diagnosis', 'treatment', 'prescription', 'appointment'],
    'legal': ['legal', 'court', 'lawsuit', 'contract', 'agreement', 'deed', 'will', 'power of attorney'],
    'financial': ['financial', 'bank', 'investment', 'loan', 'mortgage', 'tax', 'statement'],
    'insurance': ['insurance', 'policy', 'coverage', 'premium', 'claim'],
    'purchase': ['purchase', 'bought', 'acquired', 'sale'],
    'travel': ['travel', 'trip', 'vacation', 'flight', 'passport'],
    'milestone': ['milestone', 'achievement', 'award', 'promotion'],
}


def extract_events_with_ai(content: str, document_title: str, category: str) -> list[dict]:
    """Use Groq AI to extract timeline events from document content."""

    groq_api_key = wmill.get_variable("f/chatbot/GROQ_API_KEY")
    client = Groq(api_key=groq_api_key)

    system_prompt = """You are an expert at extracting timeline events from documents.
Analyze the document and extract ALL significant dates and events.

For each event found, return a JSON object with:
- event_date: ISO format date (YYYY-MM-DD). If only year known, use YYYY-01-01. If only month/year, use YYYY-MM-01.
- event_end_date: Optional end date for periods (e.g., insurance coverage end)
- event_type: One of: birth, death, wedding, anniversary, graduation, medical, legal, financial, insurance, purchase, travel, milestone, photo, other
- title: Short descriptive title (max 100 chars)
- description: Brief description with key details
- family_member_name: Name of person involved (if mentioned)
- confidence: Your confidence in the extraction (0.0 to 1.0)

Return a JSON array of events. If no events found, return empty array [].
Focus on significant dates - not every date mentioned is an event."""

    user_prompt = f"""Document Title: {document_title}
Category: {category}

Document Content:
{content[:8000]}  # Limit to avoid token limits

Extract all timeline events from this document."""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)

        # Handle both {"events": [...]} and direct array formats
        if isinstance(result, list):
            return result
        elif isinstance(result, dict) and 'events' in result:
            return result['events']
        else:
            return []

    except Exception as e:
        print(f"AI extraction error: {e}")
        return []


def parse_date(date_str: str) -> Optional[str]:
    """Parse various date formats into YYYY-MM-DD."""
    if not date_str:
        return None

    # Common date formats to try
    formats = [
        '%Y-%m-%d',
        '%Y/%m/%d',
        '%m/%d/%Y',
        '%d/%m/%Y',
        '%B %d, %Y',
        '%b %d, %Y',
        '%Y-%m',
        '%Y',
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(date_str.strip(), fmt)
            return dt.strftime('%Y-%m-%d')
        except ValueError:
            continue

    return None


def main(
    document_id: str,
    tenant_id: str,
    user_id: Optional[int] = None,
) -> dict:
    """Extract timeline events from a document."""

    if not document_id or not tenant_id:
        return {"success": False, "error": "document_id and tenant_id are required"}

    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    try:
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        cursor = conn.cursor()

        # Get document content
        cursor.execute("""
            SELECT title, content, category, extracted_data
            FROM documents
            WHERE id = %s AND tenant_id = %s
        """, (document_id, tenant_id))

        doc = cursor.fetchone()
        if not doc:
            return {"success": False, "error": "Document not found"}

        title, content, category, extracted_data = doc

        if not content:
            return {"success": False, "error": "Document has no content to analyze"}

        # Extract events using AI
        ai_events = extract_events_with_ai(content, title, category or 'general')

        # Also check extracted_data for dates (from smart extraction)
        if extracted_data and isinstance(extracted_data, dict):
            # Add expiry date as event if present
            if extracted_data.get('expiry_date'):
                expiry_date = parse_date(str(extracted_data['expiry_date']))
                if expiry_date:
                    ai_events.append({
                        'event_date': expiry_date,
                        'event_type': 'insurance' if category == 'insurance' else 'legal',
                        'title': f'{title} - Expiration',
                        'description': f'Document expires on this date',
                        'confidence': 0.95,
                    })

            # Add effective date if present
            if extracted_data.get('effective_date'):
                eff_date = parse_date(str(extracted_data['effective_date']))
                if eff_date:
                    ai_events.append({
                        'event_date': eff_date,
                        'event_type': category or 'other',
                        'title': f'{title} - Effective Date',
                        'description': f'Document becomes effective',
                        'confidence': 0.95,
                    })

        # Insert events into database
        events_created = []
        for event in ai_events:
            event_date = parse_date(event.get('event_date', ''))
            if not event_date:
                continue  # Skip events without valid dates

            event_end_date = parse_date(event.get('event_end_date'))
            event_type = event.get('event_type', 'other')
            event_title = event.get('title', '')[:255]
            description = event.get('description', '')
            family_member_name = event.get('family_member_name')
            confidence = event.get('confidence', 0.7)

            # Validate event_type
            valid_types = ['birth', 'death', 'wedding', 'anniversary', 'graduation',
                          'medical', 'legal', 'financial', 'insurance', 'purchase',
                          'travel', 'milestone', 'photo', 'other']
            if event_type not in valid_types:
                event_type = 'other'

            cursor.execute("""
                INSERT INTO timeline_events (
                    tenant_id, event_date, event_end_date, event_type,
                    title, description, document_id, family_member_name,
                    source, confidence, extracted_data, created_by
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                tenant_id, event_date, event_end_date, event_type,
                event_title, description, document_id, family_member_name,
                'extracted', confidence, json.dumps(event), user_id
            ))

            event_id = cursor.fetchone()[0]
            events_created.append({
                'id': event_id,
                'event_date': event_date,
                'event_type': event_type,
                'title': event_title,
                'confidence': confidence,
            })

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "events_created": len(events_created),
            "events": events_created,
            "message": f"Extracted {len(events_created)} events from document"
        }

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Extraction failed: {str(e)}"}

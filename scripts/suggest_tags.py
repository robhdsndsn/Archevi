# suggest_tags.py
# Windmill Python script for AI-powered tag and category suggestions
# Path: f/chatbot/suggest_tags
#
# requirements:
#   - cohere
#   - psycopg2-binary
#   - wmill
#   - httpx

"""
Suggest tags and category for document content before embedding.

This is a lightweight endpoint for the frontend to call during document upload
to get AI suggestions before the user confirms and embeds the document.

Args:
    content (str): Document text content (first 3000 chars used)
    title (str, optional): Document title for context
    tenant_id (str): Tenant UUID for fetching existing tags
    include_existing_tags (bool): Whether to suggest from existing tags (default: True)

Returns:
    dict: {
        suggested_category: str,
        category_confidence: float,
        suggested_tags: list[str],
        existing_tags_matched: list[str],  # Tags that already exist in tenant
        new_tags_suggested: list[str],     # New tags AI suggested
        expiry_dates: list[dict],
        tokens_used: int
    }
"""

import cohere
import psycopg2
from typing import Optional, List, Dict, Any
import wmill
import re
import json
from datetime import datetime


# Category definitions with keywords
CATEGORY_PROFILES = {
    'recipes': {
        'keywords': ['recipe', 'ingredients', 'cooking', 'bake', 'tablespoon', 'cup', 'teaspoon',
                     'preheat', 'oven', 'mix', 'stir', 'cuisine', 'meal', 'dinner', 'breakfast'],
    },
    'medical': {
        'keywords': ['medical', 'health', 'doctor', 'prescription', 'diagnosis', 'medication',
                     'symptoms', 'treatment', 'hospital', 'patient', 'vaccine', 'blood', 'allergy'],
    },
    'financial': {
        'keywords': ['account', 'bank', 'investment', 'tax', 'income', 'expense', 'budget',
                     'payment', 'loan', 'mortgage', 'interest', 'portfolio', 'stock', 'dividend'],
    },
    'insurance': {
        'keywords': ['insurance', 'policy', 'coverage', 'premium', 'claim', 'deductible',
                     'beneficiary', 'liability', 'insured', 'underwriting', 'renewal'],
    },
    'invoices': {
        'keywords': ['invoice', 'bill', 'receipt', 'payment', 'due date', 'amount due',
                     'purchase', 'order', 'quantity', 'unit price', 'subtotal', 'total'],
    },
    'family_history': {
        'keywords': ['family', 'genealogy', 'ancestor', 'heritage', 'generation', 'marriage',
                     'birth', 'death', 'memorial', 'tradition', 'history', 'story', 'memory'],
    },
    'legal': {
        'keywords': ['legal', 'contract', 'agreement', 'attorney', 'court', 'law', 'will',
                     'estate', 'trust', 'power of attorney', 'notary', 'witness', 'deed'],
    },
    'education': {
        'keywords': ['school', 'education', 'diploma', 'certificate', 'grade', 'transcript',
                     'course', 'student', 'teacher', 'graduation', 'degree', 'university'],
    },
    'travel': {
        'keywords': ['passport', 'visa', 'travel', 'flight', 'hotel', 'reservation', 'booking',
                     'itinerary', 'ticket', 'destination', 'vacation', 'trip'],
    },
    'personal': {
        'keywords': ['personal', 'journal', 'diary', 'notes', 'memo', 'reminder', 'list',
                     'goals', 'plans', 'ideas'],
    },
    'general': {
        'keywords': [],
    }
}

# Date patterns for expiry detection
EXPIRY_PATTERNS = [
    (r'expir(?:es?|ation|y)[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'expiry'),
    (r'expir(?:es?|ation|y)[\s:]*(\w+\s+\d{1,2},?\s+\d{4})', 'expiry'),
    (r'valid\s+(?:until|through|thru)[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'validity'),
    (r'renew(?:al)?[\s:]+(?:date|by)?[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'renewal'),
    (r'due[\s:]+(?:date|by)?[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'due_date'),
    (r'policy\s+period[\s:]+.*?to[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'policy_end'),
]


def detect_category(content: str) -> Dict[str, Any]:
    """Detect document category using keyword matching."""
    content_lower = content.lower()
    keyword_scores = {}

    for category, profile in CATEGORY_PROFILES.items():
        if category == 'general':
            continue
        score = sum(1 for kw in profile['keywords'] if kw in content_lower)
        if score > 0:
            keyword_scores[category] = score

    if keyword_scores:
        max_category = max(keyword_scores, key=keyword_scores.get)
        max_score = keyword_scores[max_category]
        confidence = min(0.95, 0.4 + (max_score * 0.1))
        return {
            'category': max_category,
            'confidence': round(confidence, 2)
        }

    return {
        'category': 'general',
        'confidence': 0.3
    }


def extract_pattern_tags(content: str) -> List[str]:
    """Extract tags using pattern matching (fast, no API call)."""
    tags = set()
    content_lower = content.lower()

    # Document type indicators
    patterns = {
        'identity': ['passport', 'visa', 'driver license', 'id card'],
        'health': ['prescription', 'medication', 'doctor', 'diagnosis', 'medical'],
        'payment': ['invoice', 'receipt', 'payment', 'bill'],
        'legal': ['contract', 'agreement', 'signature', 'notary'],
        'warranty': ['warranty', 'guarantee'],
        'insurance': ['insurance', 'policy', 'coverage', 'claim'],
        'tax': ['tax', 'irs', 'cra', 'return', 'w-2', 't4'],
        'banking': ['bank', 'account', 'statement', 'balance'],
        'property': ['deed', 'mortgage', 'property', 'real estate'],
        'vehicle': ['car', 'vehicle', 'registration', 'vin'],
        'education': ['diploma', 'certificate', 'transcript', 'degree'],
        'recipe': ['recipe', 'ingredients', 'cooking', 'bake'],
    }

    for tag, keywords in patterns.items():
        if any(kw in content_lower for kw in keywords):
            tags.add(tag)

    return list(tags)


def extract_ai_tags(content: str, co: cohere.ClientV2, existing_tags: List[str]) -> List[str]:
    """Extract tags using Cohere AI."""
    try:
        truncated = content[:2500]

        # Build prompt with existing tags for consistency
        existing_tags_hint = ""
        if existing_tags:
            existing_tags_hint = f"\n\nExisting tags in this family's collection (prefer these when relevant): {', '.join(existing_tags[:20])}"

        response = co.chat(
            model="command-r7b-12-2024",
            messages=[{
                "role": "user",
                "content": f"""Analyze this document and suggest 3-5 relevant tags. Return ONLY a JSON array of lowercase single-word or hyphenated tags.

Good tags are specific and useful for searching, like: insurance, tax-2024, medical, recipe, warranty, legal, banking, property

Document title context and content:
{truncated}{existing_tags_hint}

Return format: ["tag1", "tag2", "tag3"]"""
            }]
        )

        response_text = response.message.content[0].text.strip()

        # Extract JSON array
        match = re.search(r'\[.*?\]', response_text, re.DOTALL)
        if match:
            tags = json.loads(match.group())
            return [t.lower().strip().replace(' ', '-') for t in tags if isinstance(t, str) and len(t) < 30]
    except Exception:
        pass

    return []


def extract_expiry_dates(content: str) -> List[Dict[str, Any]]:
    """Extract expiry/due dates from content."""
    dates_found = []
    content_lower = content.lower()

    for pattern, date_type in EXPIRY_PATTERNS:
        matches = re.finditer(pattern, content_lower)
        for match in matches:
            date_str = match.group(1)
            # Try to parse the date
            parsed_date = None
            for fmt in ['%m/%d/%Y', '%m-%d-%Y', '%d/%m/%Y', '%m/%d/%y', '%B %d, %Y', '%B %d %Y']:
                try:
                    parsed_date = datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
                    break
                except ValueError:
                    continue

            dates_found.append({
                'date': parsed_date or date_str,
                'type': date_type,
                'confidence': 0.85 if parsed_date else 0.5
            })

    # Deduplicate
    seen = set()
    unique = []
    for d in dates_found:
        if d['date'] not in seen:
            seen.add(d['date'])
            unique.append(d)

    return unique[:3]


def main(
    content: str,
    tenant_id: str,
    title: Optional[str] = None,
    include_existing_tags: bool = True,
) -> dict:
    """
    Suggest tags and category for document content.
    """
    if not content or not content.strip():
        return {
            "suggested_category": "general",
            "category_confidence": 0.0,
            "suggested_tags": [],
            "existing_tags_matched": [],
            "new_tags_suggested": [],
            "expiry_dates": [],
            "tokens_used": 0,
            "error": "Content cannot be empty"
        }

    if not tenant_id:
        return {
            "suggested_category": "general",
            "category_confidence": 0.0,
            "suggested_tags": [],
            "existing_tags_matched": [],
            "new_tags_suggested": [],
            "expiry_dates": [],
            "tokens_used": 0,
            "error": "tenant_id is required"
        }

    # Truncate content for efficiency
    content_truncated = content[:3000]

    # Add title to content for better context
    if title:
        content_truncated = f"Title: {title}\n\n{content_truncated}"

    # Get resources
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    co = cohere.ClientV2(api_key=cohere_api_key)

    # Get existing tags for this tenant
    existing_tags = []
    if include_existing_tags:
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

            # Get unique tags from this tenant's documents
            # Note: Uses family_documents table (legacy) which has tenant_id column added
            cursor.execute("""
                SELECT DISTINCT jsonb_array_elements_text(metadata->'tags') as tag
                FROM family_documents
                WHERE tenant_id = %s::uuid
                  AND metadata->'tags' IS NOT NULL
                ORDER BY tag
                LIMIT 50
            """, (tenant_id,))

            existing_tags = [row[0] for row in cursor.fetchall()]
            cursor.close()
            conn.close()
        except Exception:
            pass

    # Detect category
    category_result = detect_category(content_truncated)

    # Extract tags - combine pattern and AI methods
    pattern_tags = extract_pattern_tags(content_truncated)
    ai_tags = extract_ai_tags(content_truncated, co, existing_tags)

    # Combine and deduplicate
    all_suggested = list(set(pattern_tags + ai_tags))

    # Separate into existing vs new
    existing_tags_set = set(existing_tags)
    existing_matched = [t for t in all_suggested if t in existing_tags_set]
    new_suggested = [t for t in all_suggested if t not in existing_tags_set]

    # Extract expiry dates
    expiry_dates = extract_expiry_dates(content_truncated)

    # Estimate tokens (rough approximation)
    tokens_used = len(content_truncated.split()) + 100  # prompt overhead

    return {
        "suggested_category": category_result['category'],
        "category_confidence": category_result['confidence'],
        "suggested_tags": all_suggested[:7],  # Max 7 tags
        "existing_tags_matched": existing_matched,
        "new_tags_suggested": new_suggested,
        "expiry_dates": expiry_dates,
        "tokens_used": tokens_used
    }

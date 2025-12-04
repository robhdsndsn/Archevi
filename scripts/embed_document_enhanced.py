# embed_document_enhanced.py
# Windmill Python script for enhanced document embedding with AI features
# Path: f/chatbot/embed_document_enhanced
#
# requirements:
#   Core dependencies
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - numpy
#   - wmill
#   Cohere SDK dependencies
#   - fastavro
#   - tokenizers
#   - types-requests
#   Tokenizers/HuggingFace chain
#   - huggingface-hub
#   - filelock
#   - fsspec
#   - packaging
#   - pyyaml
#   - tqdm
#   Requests chain
#   - requests
#   - urllib3
#   - charset-normalizer
#   HTTP client chain (httpx -> httpcore -> h11)
#   - httpx
#   - httpx-sse
#   - httpcore
#   - h11
#   - anyio
#   - sniffio
#   - idna
#   - certifi
#   Pydantic chain
#   - pydantic
#   - pydantic-core
#   - annotated-types
#   - typing_extensions
#   - typing_inspection

"""
Enhanced document embedding with AI-powered features:
- Auto-categorization using embedding similarity
- Smart tag extraction
- Expiry date detection
- Confidence scoring

Args:
    title (str): Document title
    content (str): Document text content
    tenant_id (str): Tenant UUID for multi-tenant isolation (required)
    category (str, optional): Category - if not provided, will be auto-detected
    source_file (str, optional): Original filename if uploaded
    created_by (str, optional): User who added the document
    auto_categorize (bool): Whether to auto-detect category (default: True if no category)
    extract_tags (bool): Whether to extract smart tags (default: True)
    extract_dates (bool): Whether to extract expiry dates (default: True)

Returns:
    dict: {
        document_id: int,
        message: str,
        tokens_used: int,
        category: str,
        suggested_category: str (if different from provided),
        category_confidence: float,
        tags: list[str],
        expiry_dates: list[dict],  # [{date: str, type: str, confidence: float}]
        ai_features_used: list[str]
    }
"""

import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
from typing import Optional, List, Dict, Any
import wmill
import re
from datetime import datetime
import json
import hashlib


# Category definitions with example keywords for similarity matching
CATEGORY_PROFILES = {
    'recipes': {
        'keywords': ['recipe', 'ingredients', 'cooking', 'bake', 'tablespoon', 'cup', 'teaspoon',
                     'preheat', 'oven', 'mix', 'stir', 'cuisine', 'meal', 'dinner', 'breakfast'],
        'description': 'Cooking recipes, meal plans, and food preparation instructions'
    },
    'medical': {
        'keywords': ['medical', 'health', 'doctor', 'prescription', 'diagnosis', 'medication',
                     'symptoms', 'treatment', 'hospital', 'patient', 'vaccine', 'blood', 'allergy'],
        'description': 'Medical records, prescriptions, health documents'
    },
    'financial': {
        'keywords': ['account', 'bank', 'investment', 'tax', 'income', 'expense', 'budget',
                     'payment', 'loan', 'mortgage', 'interest', 'portfolio', 'stock', 'dividend'],
        'description': 'Financial statements, tax documents, investment records'
    },
    'insurance': {
        'keywords': ['insurance', 'policy', 'coverage', 'premium', 'claim', 'deductible',
                     'beneficiary', 'liability', 'insured', 'underwriting', 'renewal'],
        'description': 'Insurance policies, claims, coverage documents'
    },
    'invoices': {
        'keywords': ['invoice', 'bill', 'receipt', 'payment', 'due date', 'amount due',
                     'purchase', 'order', 'quantity', 'unit price', 'subtotal', 'total'],
        'description': 'Bills, invoices, receipts, purchase orders'
    },
    'family_history': {
        'keywords': ['family', 'genealogy', 'ancestor', 'heritage', 'generation', 'marriage',
                     'birth', 'death', 'memorial', 'tradition', 'history', 'story', 'memory'],
        'description': 'Family history, genealogy, memoirs, traditions'
    },
    'legal': {
        'keywords': ['legal', 'contract', 'agreement', 'attorney', 'court', 'law', 'will',
                     'estate', 'trust', 'power of attorney', 'notary', 'witness', 'deed'],
        'description': 'Legal documents, contracts, wills, agreements'
    },
    'education': {
        'keywords': ['school', 'education', 'diploma', 'certificate', 'grade', 'transcript',
                     'course', 'student', 'teacher', 'graduation', 'degree', 'university'],
        'description': 'Educational records, certificates, transcripts'
    },
    'travel': {
        'keywords': ['passport', 'visa', 'travel', 'flight', 'hotel', 'reservation', 'booking',
                     'itinerary', 'ticket', 'destination', 'vacation', 'trip'],
        'description': 'Travel documents, passports, visas, itineraries'
    },
    'general': {
        'keywords': [],
        'description': 'General documents that do not fit other categories'
    }
}

# Date patterns for expiry detection
EXPIRY_PATTERNS = [
    # Expiry/Expiration patterns
    (r'expir(?:es?|ation|y)[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'expiry'),
    (r'expir(?:es?|ation|y)[\s:]*(\w+\s+\d{1,2},?\s+\d{4})', 'expiry'),
    (r'valid\s+(?:until|through|thru)[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'validity'),
    (r'valid\s+(?:until|through|thru)[\s:]*(\w+\s+\d{1,2},?\s+\d{4})', 'validity'),
    # Renewal patterns
    (r'renew(?:al)?[\s:]+(?:date|by)?[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'renewal'),
    (r'renew(?:al)?[\s:]+(?:date|by)?[\s:]*(\w+\s+\d{1,2},?\s+\d{4})', 'renewal'),
    # Due date patterns
    (r'due[\s:]+(?:date|by)?[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'due_date'),
    (r'due[\s:]+(?:date|by)?[\s:]*(\w+\s+\d{1,2},?\s+\d{4})', 'due_date'),
    # Policy/License period
    (r'policy\s+period[\s:]+.*?to[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'policy_end'),
    (r'effective\s+(?:until|through)[\s:]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', 'effective_end'),
]


def extract_tags_from_content(content: str, co: cohere.ClientV2, existing_tags: List[str] = None) -> List[str]:
    """
    Extract meaningful tags from document content using Cohere.
    Uses a lightweight prompt to extract key topics.
    """
    # First try pattern-based extraction for common document types
    pattern_tags = set()

    content_lower = content.lower()

    # Check for document type indicators
    if any(word in content_lower for word in ['passport', 'visa']):
        pattern_tags.add('identity')
    if any(word in content_lower for word in ['prescription', 'medication', 'doctor']):
        pattern_tags.add('health')
    if any(word in content_lower for word in ['invoice', 'receipt', 'payment']):
        pattern_tags.add('payment')
    if any(word in content_lower for word in ['contract', 'agreement', 'signature']):
        pattern_tags.add('legal')
    if any(word in content_lower for word in ['warranty', 'guarantee']):
        pattern_tags.add('warranty')
    if any(word in content_lower for word in ['insurance', 'policy', 'coverage']):
        pattern_tags.add('insurance')
    if any(word in content_lower for word in ['tax', 'irs', 'cra', 'return']):
        pattern_tags.add('tax')

    # If we found pattern tags, return them (saves API call)
    if len(pattern_tags) >= 2:
        return list(pattern_tags)[:5]

    # Use Cohere for more sophisticated extraction
    try:
        # Truncate content for efficiency
        truncated = content[:2000] if len(content) > 2000 else content

        response = co.chat(
            model="command-r7b-12-2024",
            messages=[{
                "role": "user",
                "content": f"""Extract 3-5 relevant tags for this document. Return ONLY a JSON array of lowercase single-word tags.

Document:
{truncated}

Return format: ["tag1", "tag2", "tag3"]"""
            }]
        )

        # Parse the response
        response_text = response.message.content[0].text.strip()

        # Try to extract JSON array
        match = re.search(r'\[.*?\]', response_text, re.DOTALL)
        if match:
            tags = json.loads(match.group())
            # Clean and validate tags
            clean_tags = [t.lower().strip() for t in tags if isinstance(t, str) and len(t) < 30]
            # Combine with pattern tags
            all_tags = list(set(clean_tags) | pattern_tags)
            return all_tags[:5]
    except Exception:
        pass

    return list(pattern_tags)[:5] if pattern_tags else []


def extract_expiry_dates(content: str) -> List[Dict[str, Any]]:
    """
    Extract expiry dates, renewal dates, and due dates from document content.
    """
    dates_found = []
    content_lower = content.lower()

    for pattern, date_type in EXPIRY_PATTERNS:
        matches = re.finditer(pattern, content_lower)
        for match in matches:
            date_str = match.group(1)
            dates_found.append({
                'raw_date': date_str,
                'type': date_type,
                'confidence': 0.8 if date_type in ['expiry', 'due_date'] else 0.6
            })

    # Try to parse and normalize dates
    normalized = []
    for d in dates_found:
        try:
            # Try common date formats
            for fmt in ['%m/%d/%Y', '%m-%d-%Y', '%d/%m/%Y', '%d-%m-%Y',
                       '%m/%d/%y', '%m-%d-%y', '%B %d, %Y', '%B %d %Y']:
                try:
                    parsed = datetime.strptime(d['raw_date'], fmt)
                    normalized.append({
                        'date': parsed.strftime('%Y-%m-%d'),
                        'type': d['type'],
                        'confidence': d['confidence']
                    })
                    break
                except ValueError:
                    continue
        except Exception:
            # If parsing fails, still include the raw date
            normalized.append({
                'date': d['raw_date'],
                'type': d['type'],
                'confidence': d['confidence'] * 0.5  # Lower confidence for unparsed
            })

    # Deduplicate by date
    seen = set()
    unique = []
    for d in normalized:
        if d['date'] not in seen:
            seen.add(d['date'])
            unique.append(d)

    return unique[:5]  # Max 5 dates


def clean_ocr_text(content: str) -> str:
    """
    Clean up OCR artifacts from scanned document text.
    Fixes common issues like:
    - Excessive spacing between letters ("De cember" -> "December")
    - Broken words across lines
    - Multiple spaces between words
    - Garbled punctuation
    """
    if not content:
        return content

    # Step 1: Fix single-letter spacing patterns (OCR often splits words)
    # Pattern: lowercase letter + space + lowercase letter (within words)
    # Example: "De cember" -> "December", "con tinuing" -> "continuing"

    # First, normalize line endings
    text = content.replace('\r\n', '\n').replace('\r', '\n')

    # Step 2: Fix letter-space-letter patterns that are likely broken words
    # We look for patterns like "a b c" that should be "abc"
    # But preserve intentional spaces between actual words

    lines = text.split('\n')
    cleaned_lines = []

    for line in lines:
        # Skip empty lines
        if not line.strip():
            cleaned_lines.append('')
            continue

        # Fix excessive spacing within words
        # Pattern: single letter + space + single letter (repeatedly)
        # "D e c e m b e r" -> "December"

        # First pass: collapse single-character sequences
        # Match: letter, space, letter, space... where each segment is 1-2 chars
        words = []
        current_word = []

        parts = line.split()
        i = 0
        while i < len(parts):
            part = parts[i]

            # Check if this looks like a split word (1-3 chars, followed by more 1-3 char parts)
            if len(part) <= 3 and i + 1 < len(parts):
                # Look ahead to see if we have a sequence of short fragments
                fragments = [part]
                j = i + 1
                while j < len(parts) and len(parts[j]) <= 3:
                    fragments.append(parts[j])
                    j += 1

                # If we found multiple short fragments in a row (3+), likely a split word
                if len(fragments) >= 3:
                    # Join them together
                    joined = ''.join(fragments)
                    # Validate it looks like a word (mostly letters)
                    if sum(c.isalpha() for c in joined) >= len(joined) * 0.7:
                        words.append(joined)
                        i = j
                        continue

            words.append(part)
            i += 1

        # Second pass: fix partial splits like "De cember" -> "December"
        # Look for lowercase letter ending + space + lowercase starting
        merged_words = []
        i = 0
        while i < len(words):
            word = words[i]

            # Check if this word and next should be merged
            # Criteria: word ends with lowercase, next starts with lowercase,
            # and combining them makes a real-looking word
            if i + 1 < len(words):
                next_word = words[i + 1]
                # Check for partial word patterns
                if (len(word) >= 1 and len(next_word) >= 2 and
                    word[-1].islower() and next_word[0].islower() and
                    not word.endswith((',', '.', ':', ';', '!', '?'))):
                    # Try combining
                    combined = word + next_word
                    # If combined word is reasonable length and mostly alpha, merge
                    if len(combined) <= 20 and sum(c.isalpha() for c in combined) >= len(combined) * 0.8:
                        merged_words.append(combined)
                        i += 2
                        continue

            merged_words.append(word)
            i += 1

        cleaned_lines.append(' '.join(merged_words))

    result = '\n'.join(cleaned_lines)

    # Step 3: Fix common OCR character substitutions
    # (keeping this minimal to avoid over-correction)
    replacements = [
        ('  ', ' '),  # Double spaces to single
        (' .', '.'),  # Space before period
        (' ,', ','),  # Space before comma
        (' :', ':'),  # Space before colon
        ('( ', '('),  # Space after open paren
        (' )', ')'),  # Space before close paren
    ]

    for old, new in replacements:
        while old in result:
            result = result.replace(old, new)

    return result.strip()


def compute_content_hash(content: str, title: str) -> str:
    """
    Compute a SHA-256 hash of the document content for duplicate detection.
    Uses normalized content (lowercase, whitespace-trimmed) for consistency.
    """
    # Normalize content: lowercase, strip whitespace, remove extra spaces
    normalized = ' '.join(content.lower().split())
    normalized_title = ' '.join(title.lower().split())
    # Combine title and content for the hash
    combined = f"{normalized_title}||{normalized}"
    return hashlib.sha256(combined.encode('utf-8')).hexdigest()


def check_for_duplicate(conn, tenant_id: str, content_hash: str) -> Optional[Dict[str, Any]]:
    """
    Check if a document with the same content hash already exists for this tenant.
    Returns the existing document info if found, None otherwise.
    """
    cursor = conn.cursor()
    try:
        # Check metadata->content_hash for exact matches
        cursor.execute("""
            SELECT id, title, category, created_at
            FROM family_documents
            WHERE tenant_id = %s
              AND metadata->>'content_hash' = %s
            LIMIT 1
        """, (tenant_id, content_hash))

        row = cursor.fetchone()
        if row:
            return {
                'id': row[0],
                'title': row[1],
                'category': row[2],
                'created_at': row[3].isoformat() if row[3] else None
            }
        return None
    finally:
        cursor.close()


def auto_categorize(content: str, co: cohere.ClientV2, conn) -> Dict[str, Any]:
    """
    Auto-detect document category using embedding similarity with category exemplars.
    """
    # First, try keyword-based detection (fast, free)
    content_lower = content.lower()
    keyword_scores = {}

    for category, profile in CATEGORY_PROFILES.items():
        if category == 'general':
            continue
        score = sum(1 for kw in profile['keywords'] if kw in content_lower)
        if score > 0:
            keyword_scores[category] = score

    # If we have a clear winner from keywords (score >= 3), use that
    if keyword_scores:
        max_category = max(keyword_scores, key=keyword_scores.get)
        max_score = keyword_scores[max_category]
        if max_score >= 3:
            confidence = min(0.9, 0.5 + (max_score * 0.1))
            return {
                'category': max_category,
                'confidence': confidence,
                'method': 'keyword'
            }

    # If keywords are ambiguous, use embedding similarity
    try:
        # Get embedding for the content
        response = co.embed(
            texts=[content[:5000]],  # First 5000 chars
            model="embed-v4.0",
            input_type="search_query",
            embedding_types=["float"],
            output_dimension=1024
        )
        query_embedding = response.embeddings.float_[0]

        # Get category exemplar embeddings from database
        cursor = conn.cursor()
        cursor.execute("""
            SELECT category, embedding
            FROM family_documents
            WHERE embedding IS NOT NULL
            GROUP BY category, embedding
            LIMIT 50
        """)

        category_similarities = {}
        for row in cursor.fetchall():
            cat = row[0]
            emb = row[1]
            # Calculate cosine similarity
            dot_product = sum(a * b for a, b in zip(query_embedding, emb))
            norm_q = sum(a * a for a in query_embedding) ** 0.5
            norm_e = sum(a * a for a in emb) ** 0.5
            similarity = dot_product / (norm_q * norm_e) if norm_q * norm_e > 0 else 0

            if cat not in category_similarities:
                category_similarities[cat] = []
            category_similarities[cat].append(similarity)

        cursor.close()

        # Average similarities per category
        avg_similarities = {
            cat: sum(sims) / len(sims)
            for cat, sims in category_similarities.items()
        }

        if avg_similarities:
            best_category = max(avg_similarities, key=avg_similarities.get)
            confidence = avg_similarities[best_category]
            return {
                'category': best_category,
                'confidence': confidence,
                'method': 'embedding'
            }
    except Exception:
        pass

    # Fallback to keyword scores if we have any
    if keyword_scores:
        max_category = max(keyword_scores, key=keyword_scores.get)
        return {
            'category': max_category,
            'confidence': 0.5,
            'method': 'keyword_fallback'
        }

    return {
        'category': 'general',
        'confidence': 0.3,
        'method': 'default'
    }


def main(
    title: str,
    content: str,
    tenant_id: str,
    category: Optional[str] = None,
    source_file: Optional[str] = None,
    created_by: Optional[str] = None,
    assigned_to: Optional[int] = None,
    visibility: Optional[str] = 'everyone',
    auto_categorize_enabled: bool = True,
    extract_tags_enabled: bool = True,
    extract_dates_enabled: bool = True,
) -> dict:
    """
    Enhanced document embedding with AI-powered features.
    """
    # Validate inputs
    if not title or not title.strip():
        raise ValueError("Title cannot be empty")
    if not content or not content.strip():
        raise ValueError("Content cannot be empty")
    if not tenant_id or not tenant_id.strip():
        raise ValueError("tenant_id is required for multi-tenant isolation")

    valid_categories = ['recipes', 'medical', 'financial', 'family_history', 'general',
                        'insurance', 'invoices', 'legal', 'education', 'travel']

    # Clean up OCR artifacts before processing
    # This fixes common issues like "De cember" -> "December", excessive spacing, etc.
    content = clean_ocr_text(content)

    # Fetch resources from Windmill
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    # Initialize Cohere client
    co = cohere.ClientV2(api_key=cohere_api_key)

    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host=postgres_db['host'],
        port=postgres_db['port'],
        dbname=postgres_db['dbname'],
        user=postgres_db['user'],
        password=postgres_db['password'],
        sslmode=postgres_db.get('sslmode', 'disable')
    )
    register_vector(conn)

    # Check for duplicate content BEFORE doing any expensive AI operations
    content_hash = compute_content_hash(content.strip(), title.strip())
    existing_doc = check_for_duplicate(conn, tenant_id.strip(), content_hash)

    if existing_doc:
        conn.close()
        return {
            "document_id": None,
            "message": f"Duplicate document detected. This content already exists as '{existing_doc['title']}' (ID: {existing_doc['id']})",
            "is_duplicate": True,
            "existing_document": existing_doc,
            "tokens_used": 0,
            "category": existing_doc['category'],
            "suggested_category": None,
            "category_confidence": 1.0,
            "tags": [],
            "expiry_dates": [],
            "ai_features_used": []
        }

    ai_features_used = []
    result = {
        'tags': [],
        'expiry_dates': [],
        'suggested_category': None,
        'category_confidence': 1.0,
        'content_hash': content_hash  # Store for future duplicate detection
    }

    # Auto-categorize if no category provided or if enabled
    final_category = category
    if not category or (auto_categorize_enabled and category == 'general'):
        cat_result = auto_categorize(content, co, conn)
        if not category:
            final_category = cat_result['category']
        result['suggested_category'] = cat_result['category']
        result['category_confidence'] = cat_result['confidence']
        ai_features_used.append(f"auto_categorize:{cat_result['method']}")

    if final_category not in valid_categories:
        final_category = 'general'

    # Extract tags
    if extract_tags_enabled:
        tags = extract_tags_from_content(content, co)
        result['tags'] = tags
        if tags:
            ai_features_used.append('smart_tags')

    # Extract expiry dates
    if extract_dates_enabled:
        dates = extract_expiry_dates(content)
        result['expiry_dates'] = dates
        if dates:
            ai_features_used.append('expiry_detection')

    # Generate embedding
    try:
        response = co.embed(
            texts=[content],
            model="embed-v4.0",
            input_type="search_document",
            embedding_types=["float"],
            output_dimension=1024
        )
        embedding = response.embeddings.float_[0]
        tokens_used = response.meta.billed_units.input_tokens if response.meta and response.meta.billed_units else len(content.split())
    except Exception as e:
        conn.close()
        raise RuntimeError(f"Cohere API error: {str(e)}")

    # Store document with enhanced metadata
    try:
        cursor = conn.cursor()

        # Prepare metadata JSON (includes content_hash for duplicate detection)
        # Convert numpy floats to Python floats for JSON serialization
        metadata = {
            'tags': result['tags'],
            'expiry_dates': result['expiry_dates'],
            'ai_features': ai_features_used,
            'category_confidence': float(result['category_confidence']),
            'content_hash': result['content_hash']  # SHA-256 hash for duplicate detection
        }

        # Validate visibility
        valid_visibility = ['everyone', 'adults_only', 'admins_only', 'private']
        final_visibility = visibility if visibility in valid_visibility else 'everyone'

        # Insert document with embedding and metadata
        cursor.execute("""
            INSERT INTO family_documents (title, content, category, source_file, created_by, embedding, metadata, tenant_id, assigned_to, visibility)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (title.strip(), content.strip(), final_category, source_file, created_by,
              embedding, json.dumps(metadata), tenant_id.strip(), assigned_to, final_visibility))

        document_id = cursor.fetchone()[0]

        # Log API usage
        estimated_cost = tokens_used * 0.0000001
        cursor.execute("""
            INSERT INTO api_usage_log (operation, tokens_used, cost_usd)
            VALUES ('embed_enhanced', %s, %s)
        """, (tokens_used, estimated_cost))

        conn.commit()
        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        conn.close()
        raise RuntimeError(f"Database error: {str(e)}")

    return {
        "document_id": document_id,
        "message": f"Document '{title}' successfully embedded with AI features",
        "is_duplicate": False,
        "existing_document": None,
        "tokens_used": tokens_used,
        "category": final_category,
        "suggested_category": result['suggested_category'],
        "category_confidence": result['category_confidence'],
        "tags": result['tags'],
        "expiry_dates": result['expiry_dates'],
        "ai_features_used": ai_features_used,
        "assigned_to": assigned_to,
        "visibility": final_visibility
    }

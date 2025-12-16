# embed_document_from_storage.py
# Windmill Python script for embedding documents stored in Supabase Storage
# Path: f/chatbot/embed_document_from_storage
#
# requirements:
#   Core dependencies
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - numpy
#   - wmill
#   - pypdf
#   - httpx==0.27.2
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
Embed documents from Supabase Storage with AI-powered features.

This unified endpoint:
1. Fetches file from Supabase Storage
2. Extracts text (PDF, images via OCR, or plain text)
3. Runs enhanced embedding with auto-categorization, tags, expiry dates
4. Stores document with storage_path for future reference

Args:
    storage_path (str): Path to the file in Supabase Storage
    title (str): Document title
    tenant_id (str): Tenant UUID for multi-tenant isolation
    category (str, optional): Category - if not provided, will be auto-detected
    created_by (str, optional): User who added the document
    assigned_to (int, optional): Family member ID to assign document to
    visibility (str): Document visibility level (default: 'everyone')
    ocr_language (str): Language hint for OCR (default: 'eng')
    auto_categorize_enabled (bool): Whether to auto-detect category (default: True)
    extract_tags_enabled (bool): Whether to extract smart tags (default: True)
    extract_dates_enabled (bool): Whether to extract expiry dates (default: True)

Returns:
    dict: {
        document_id: int,
        message: str,
        storage_path: str,
        extracted_text_preview: str,
        file_type: str,
        pages: int,
        tokens_used: int,
        category: str,
        suggested_category: str,
        category_confidence: float,
        tags: list[str],
        expiry_dates: list[dict],
        ai_features_used: list[str]
    }
"""

import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
import httpx
import wmill
import io
import base64
from typing import Optional, List, Dict, Any
import json
import hashlib
import re
from datetime import datetime


# Category definitions with example keywords for similarity matching
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
        'keywords': ['personal', 'note', 'reminder', 'idea', 'thought', 'journal', 'diary'],
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


def get_supabase_file(storage_path: str, supabase_url: str, supabase_key: str) -> tuple[bytes, str]:
    """Download a file from Supabase Storage."""
    bucket = "documents"
    url = f"{supabase_url}/storage/v1/object/{bucket}/{storage_path}"

    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "apikey": supabase_key
    }

    with httpx.Client(timeout=120.0) as client:
        response = client.get(url, headers=headers)
        response.raise_for_status()
        content_type = response.headers.get("content-type", "application/octet-stream")
        return response.content, content_type


def extract_pdf_text(file_bytes: bytes) -> tuple[str, int]:
    """Extract text from a PDF file using pypdf."""
    from pypdf import PdfReader

    pdf_file = io.BytesIO(file_bytes)
    reader = PdfReader(pdf_file)

    pages = len(reader.pages)
    text_parts = []

    for i, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        if page_text.strip():
            text_parts.append(f"--- Page {i + 1} ---\n{page_text}")

    return "\n\n".join(text_parts), pages


def extract_image_text_ocr(file_bytes: bytes, content_type: str, co: cohere.ClientV2, language: str = "eng") -> str:
    """Extract text from an image using Cohere's vision capabilities."""
    base64_image = base64.b64encode(file_bytes).decode("utf-8")

    if "png" in content_type:
        media_type = "image/png"
    elif "webp" in content_type:
        media_type = "image/webp"
    else:
        media_type = "image/jpeg"

    response = co.chat(
        model="command-r-plus",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": base64_image
                        }
                    },
                    {
                        "type": "text",
                        "text": f"""Extract ALL text from this image. This is a scanned document.

Language hint: {language}

Instructions:
1. Extract every word visible in the image
2. Preserve the original structure/layout as much as possible
3. Include headers, body text, and any small print
4. If you see dates, amounts, or numbers, include them exactly as shown

Return ONLY the extracted text, no commentary."""
                    }
                ]
            }
        ]
    )

    return response.message.content[0].text.strip()


def clean_ocr_text(content: str) -> str:
    """Clean up OCR artifacts from scanned document text."""
    if not content:
        return content

    text = content.replace('\r\n', '\n').replace('\r', '\n')
    lines = text.split('\n')
    cleaned_lines = []

    for line in lines:
        if not line.strip():
            cleaned_lines.append('')
            continue

        words = []
        parts = line.split()
        i = 0
        while i < len(parts):
            part = parts[i]
            if len(part) <= 3 and i + 1 < len(parts):
                fragments = [part]
                j = i + 1
                while j < len(parts) and len(parts[j]) <= 3:
                    fragments.append(parts[j])
                    j += 1
                if len(fragments) >= 3:
                    joined = ''.join(fragments)
                    if sum(c.isalpha() for c in joined) >= len(joined) * 0.7:
                        words.append(joined)
                        i = j
                        continue
            words.append(part)
            i += 1

        cleaned_lines.append(' '.join(words))

    result = '\n'.join(cleaned_lines)

    replacements = [('  ', ' '), (' .', '.'), (' ,', ','), (' :', ':')]
    for old, new in replacements:
        while old in result:
            result = result.replace(old, new)

    return result.strip()


def compute_content_hash(content: str, title: str) -> str:
    """Compute a SHA-256 hash of the document content for duplicate detection."""
    normalized = ' '.join(content.lower().split())
    normalized_title = ' '.join(title.lower().split())
    combined = f"{normalized_title}||{normalized}"
    return hashlib.sha256(combined.encode('utf-8')).hexdigest()


def check_for_duplicate(conn, tenant_id: str, content_hash: str) -> Optional[Dict[str, Any]]:
    """Check if a document with the same content hash already exists."""
    cursor = conn.cursor()
    try:
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
    """Auto-detect document category using keyword matching and embedding similarity."""
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
        if max_score >= 3:
            confidence = min(0.9, 0.5 + (max_score * 0.1))
            return {
                'category': max_category,
                'confidence': confidence,
                'method': 'keyword'
            }

    # Use embedding similarity if keywords inconclusive
    try:
        response = co.embed(
            texts=[content[:5000]],
            model="embed-v4.0",
            input_type="search_query",
            embedding_types=["float"],
            output_dimension=1024
        )
        query_embedding = response.embeddings.float_[0]

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
            dot_product = sum(a * b for a, b in zip(query_embedding, emb))
            norm_q = sum(a * a for a in query_embedding) ** 0.5
            norm_e = sum(a * a for a in emb) ** 0.5
            similarity = dot_product / (norm_q * norm_e) if norm_q * norm_e > 0 else 0

            if cat not in category_similarities:
                category_similarities[cat] = []
            category_similarities[cat].append(similarity)

        cursor.close()

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


def extract_tags_from_content(content: str, co: cohere.ClientV2) -> List[str]:
    """Extract meaningful tags from document content."""
    pattern_tags = set()
    content_lower = content.lower()

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

    if len(pattern_tags) >= 2:
        return list(pattern_tags)[:5]

    try:
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

        response_text = response.message.content[0].text.strip()
        match = re.search(r'\[.*?\]', response_text, re.DOTALL)
        if match:
            tags = json.loads(match.group())
            clean_tags = [t.lower().strip() for t in tags if isinstance(t, str) and len(t) < 30]
            all_tags = list(set(clean_tags) | pattern_tags)
            return all_tags[:5]
    except Exception:
        pass

    return list(pattern_tags)[:5] if pattern_tags else []


def extract_expiry_dates(content: str) -> List[Dict[str, Any]]:
    """Extract expiry dates, renewal dates, and due dates from document content."""
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

    normalized = []
    for d in dates_found:
        try:
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
            normalized.append({
                'date': d['raw_date'],
                'type': d['type'],
                'confidence': d['confidence'] * 0.5
            })

    seen = set()
    unique = []
    for d in normalized:
        if d['date'] not in seen:
            seen.add(d['date'])
            unique.append(d)

    return unique[:5]


def main(
    storage_path: str,
    title: str,
    tenant_id: str,
    category: Optional[str] = None,
    created_by: Optional[str] = None,
    assigned_to: Optional[int] = None,
    visibility: str = 'everyone',
    ocr_language: str = 'eng',
    auto_categorize_enabled: bool = True,
    extract_tags_enabled: bool = True,
    extract_dates_enabled: bool = True,
) -> dict:
    """
    Embed a document from Supabase Storage with AI-powered features.
    """
    # Validate inputs
    if not storage_path or not storage_path.strip():
        raise ValueError("storage_path is required")
    if not title or not title.strip():
        raise ValueError("title is required")
    if not tenant_id or not tenant_id.strip():
        raise ValueError("tenant_id is required")

    valid_categories = ['recipes', 'medical', 'financial', 'family_history', 'general',
                        'insurance', 'invoices', 'legal', 'education', 'travel', 'personal']
    valid_visibility = ['everyone', 'adults_only', 'admins_only', 'private']

    # Get credentials from Windmill
    supabase_url = wmill.get_variable("f/chatbot/supabase_url")
    supabase_key = wmill.get_variable("f/chatbot/supabase_service_key")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    # Initialize clients
    co = cohere.ClientV2(api_key=cohere_api_key)

    # Download file from Supabase
    try:
        file_bytes, content_type = get_supabase_file(storage_path, supabase_url, supabase_key)
    except httpx.HTTPError as e:
        raise RuntimeError(f"Failed to download file from storage: {str(e)}")

    # Extract text based on file type
    extracted_text = ""
    pages = 0
    file_type = "unknown"

    storage_path_lower = storage_path.lower()

    if storage_path_lower.endswith(".pdf") or "pdf" in content_type:
        file_type = "pdf"
        extracted_text, pages = extract_pdf_text(file_bytes)

        # Check if PDF is scanned (very little text)
        if len(extracted_text.strip()) < 100 and pages > 0:
            # Try OCR on the PDF (simplified - in production would render pages to images)
            file_type = "pdf_scanned"

    elif any(storage_path_lower.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]) or content_type.startswith("image/"):
        file_type = "image"
        extracted_text = extract_image_text_ocr(file_bytes, content_type, co, ocr_language)
        pages = 1

    elif any(storage_path_lower.endswith(ext) for ext in [".txt", ".md"]) or "text" in content_type:
        file_type = "text"
        try:
            extracted_text = file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            extracted_text = file_bytes.decode("latin-1")
        pages = 1

    else:
        raise ValueError(f"Unsupported file type: {content_type}")

    if not extracted_text or not extracted_text.strip():
        raise ValueError("No text could be extracted from the file")

    # Clean OCR artifacts
    extracted_text = clean_ocr_text(extracted_text)

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

    # Check for duplicate content
    content_hash = compute_content_hash(extracted_text.strip(), title.strip())
    existing_doc = check_for_duplicate(conn, tenant_id.strip(), content_hash)

    if existing_doc:
        conn.close()
        return {
            "document_id": None,
            "message": f"Duplicate document detected. This content already exists as '{existing_doc['title']}' (ID: {existing_doc['id']})",
            "is_duplicate": True,
            "existing_document": existing_doc,
            "storage_path": storage_path,
            "file_type": file_type,
            "pages": pages,
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
    }

    # Auto-categorize
    final_category = category
    if not category or (auto_categorize_enabled and category == 'general'):
        cat_result = auto_categorize(extracted_text, co, conn)
        if not category:
            final_category = cat_result['category']
        result['suggested_category'] = cat_result['category']
        result['category_confidence'] = cat_result['confidence']
        ai_features_used.append(f"auto_categorize:{cat_result['method']}")

    if final_category not in valid_categories:
        final_category = 'general'

    # Extract tags
    if extract_tags_enabled:
        tags = extract_tags_from_content(extracted_text, co)
        result['tags'] = tags
        if tags:
            ai_features_used.append('smart_tags')

    # Extract expiry dates
    if extract_dates_enabled:
        dates = extract_expiry_dates(extracted_text)
        result['expiry_dates'] = dates
        if dates:
            ai_features_used.append('expiry_detection')

    # Generate embedding
    try:
        response = co.embed(
            texts=[extracted_text],
            model="embed-v4.0",
            input_type="search_document",
            embedding_types=["float"],
            output_dimension=1024
        )
        embedding = response.embeddings.float_[0]
        tokens_used = response.meta.billed_units.input_tokens if response.meta and response.meta.billed_units else len(extracted_text.split())
    except Exception as e:
        conn.close()
        raise RuntimeError(f"Cohere API error: {str(e)}")

    # Store document
    try:
        cursor = conn.cursor()

        metadata = {
            'tags': result['tags'],
            'expiry_dates': result['expiry_dates'],
            'ai_features': ai_features_used,
            'category_confidence': float(result['category_confidence']),
            'content_hash': content_hash,
            'storage_path': storage_path,
            'file_type': file_type,
            'pages': pages,
            'source': 'supabase_storage'
        }

        final_visibility = visibility if visibility in valid_visibility else 'everyone'

        cursor.execute("""
            INSERT INTO family_documents (title, content, category, source_file, created_by, embedding, metadata, tenant_id, assigned_to, visibility)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (title.strip(), extracted_text.strip(), final_category, storage_path, created_by,
              embedding, json.dumps(metadata), tenant_id.strip(), assigned_to, final_visibility))

        document_id = cursor.fetchone()[0]

        # Log API usage
        estimated_cost = tokens_used * 0.0000001
        cursor.execute("""
            INSERT INTO api_usage_log (operation, tokens_used, cost_usd)
            VALUES ('embed_from_storage', %s, %s)
        """, (tokens_used, estimated_cost))

        conn.commit()
        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        conn.close()
        raise RuntimeError(f"Database error: {str(e)}")

    return {
        "document_id": document_id,
        "message": f"Document '{title}' successfully embedded from storage",
        "is_duplicate": False,
        "existing_document": None,
        "storage_path": storage_path,
        "extracted_text_preview": extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text,
        "full_text_length": len(extracted_text),
        "file_type": file_type,
        "pages": pages,
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

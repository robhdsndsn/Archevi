# extract_text_from_storage.py
# Windmill Python script for extracting text from files stored in Supabase Storage
# Path: f/chatbot/extract_text_from_storage
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
Extract text from files stored in Supabase Storage.
Supports:
- PDF files (via pypdf)
- Images (via Cohere vision/OCR)
- Text files (direct read)

This script fetches a file from Supabase Storage using the storage path,
extracts the text content, and optionally updates the document's embedding.

Args:
    storage_path (str): Path to the file in Supabase Storage (e.g., "tenant_id/timestamp_filename.pdf")
    document_id (int, optional): If provided, updates the existing document with extracted text
    tenant_id (str): Tenant UUID for multi-tenant isolation
    language (str, optional): OCR language hint (default: "eng")
    update_embedding (bool): Whether to regenerate the embedding (default: True)

Returns:
    dict: {
        extracted_text: str,
        file_type: str,
        pages: int (for PDFs),
        tokens_used: int,
        document_updated: bool,
        message: str
    }
"""

import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
import httpx
import wmill
import io
import base64
from typing import Optional
import json
import hashlib


def get_supabase_file(storage_path: str, supabase_url: str, supabase_key: str) -> tuple[bytes, str]:
    """
    Download a file from Supabase Storage.
    Returns the file bytes and content type.
    """
    bucket = "documents"
    url = f"{supabase_url}/storage/v1/object/{bucket}/{storage_path}"

    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "apikey": supabase_key
    }

    with httpx.Client(timeout=60.0) as client:
        response = client.get(url, headers=headers)
        response.raise_for_status()

        content_type = response.headers.get("content-type", "application/octet-stream")
        return response.content, content_type


def extract_pdf_text(file_bytes: bytes) -> tuple[str, int]:
    """
    Extract text from a PDF file using pypdf.
    Returns the extracted text and page count.
    """
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
    """
    Extract text from an image using Cohere's vision capabilities.
    """
    # Convert to base64 for Cohere
    base64_image = base64.b64encode(file_bytes).decode("utf-8")

    # Determine media type
    if "png" in content_type:
        media_type = "image/png"
    elif "webp" in content_type:
        media_type = "image/webp"
    else:
        media_type = "image/jpeg"

    # Use Cohere chat with vision
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
5. If the text is in {language}, transcribe it in that language

Return ONLY the extracted text, no commentary."""
                    }
                ]
            }
        ]
    )

    return response.message.content[0].text.strip()


def compute_content_hash(content: str, title: str) -> str:
    """
    Compute a SHA-256 hash of the document content for duplicate detection.
    """
    normalized = ' '.join(content.lower().split())
    normalized_title = ' '.join((title or '').lower().split())
    combined = f"{normalized_title}||{normalized}"
    return hashlib.sha256(combined.encode('utf-8')).hexdigest()


def update_document_content(
    conn,
    document_id: int,
    extracted_text: str,
    co: cohere.ClientV2,
    update_embedding: bool = True,
    new_title: str = None
) -> dict:
    """
    Update a document with extracted text and optionally regenerate embedding.
    """
    cursor = conn.cursor()

    # Get current document info
    cursor.execute("""
        SELECT title, content, metadata
        FROM family_documents
        WHERE id = %s
    """, (document_id,))

    row = cursor.fetchone()
    if not row:
        cursor.close()
        return {"updated": False, "error": "Document not found"}

    title, old_content, metadata = row
    metadata = metadata or {}

    # Use new_title if provided, otherwise keep existing (or use empty string)
    final_title = new_title if new_title else (title or '')

    # Compute new content hash
    content_hash = compute_content_hash(extracted_text, final_title)
    metadata['content_hash'] = content_hash
    metadata['text_extracted'] = True
    metadata['extraction_source'] = 'storage'

    tokens_used = 0

    if update_embedding:
        # Generate new embedding
        response = co.embed(
            texts=[extracted_text],
            model="embed-v4.0",
            input_type="search_document",
            embedding_types=["float"],
            output_dimension=1024
        )
        embedding = response.embeddings.float_[0]
        tokens_used = response.meta.billed_units.input_tokens if response.meta and response.meta.billed_units else len(extracted_text.split())

        cursor.execute("""
            UPDATE family_documents
            SET title = COALESCE(NULLIF(%s, ''), title),
                content = %s, embedding = %s, metadata = %s, updated_at = NOW()
            WHERE id = %s
        """, (new_title, extracted_text, embedding, json.dumps(metadata), document_id))
    else:
        cursor.execute("""
            UPDATE family_documents
            SET title = COALESCE(NULLIF(%s, ''), title),
                content = %s, metadata = %s, updated_at = NOW()
            WHERE id = %s
        """, (new_title, extracted_text, json.dumps(metadata), document_id))

    conn.commit()
    cursor.close()

    return {"updated": True, "tokens_used": tokens_used}


def main(
    storage_path: str,
    tenant_id: str,
    document_id: Optional[int] = None,
    language: str = "eng",
    update_embedding: bool = True,
    title: str = None
) -> dict:
    """
    Extract text from a file stored in Supabase Storage.

    Args:
        title: If provided, updates the document title (useful for documents uploaded without title)
    """
    # Validate inputs
    if not storage_path or not storage_path.strip():
        raise ValueError("storage_path is required")
    if not tenant_id or not tenant_id.strip():
        raise ValueError("tenant_id is required")

    # Get Supabase credentials from Windmill
    supabase_url = wmill.get_variable("f/chatbot/supabase_url")
    supabase_key = wmill.get_variable("f/chatbot/supabase_service_key")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    # Initialize Cohere client
    co = cohere.ClientV2(api_key=cohere_api_key)

    # Download file from Supabase
    try:
        file_bytes, content_type = get_supabase_file(storage_path, supabase_url, supabase_key)
    except httpx.HTTPError as e:
        return {
            "extracted_text": None,
            "file_type": None,
            "pages": 0,
            "tokens_used": 0,
            "document_updated": False,
            "message": f"Failed to download file: {str(e)}"
        }

    # Determine file type and extract text
    extracted_text = ""
    pages = 0
    file_type = "unknown"
    tokens_used = 0

    storage_path_lower = storage_path.lower()

    if storage_path_lower.endswith(".pdf") or "pdf" in content_type:
        # PDF extraction
        file_type = "pdf"
        try:
            extracted_text, pages = extract_pdf_text(file_bytes)
        except Exception as e:
            return {
                "extracted_text": None,
                "file_type": file_type,
                "pages": 0,
                "tokens_used": 0,
                "document_updated": False,
                "message": f"PDF extraction failed: {str(e)}"
            }

    elif any(storage_path_lower.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp"]) or content_type.startswith("image/"):
        # Image OCR
        file_type = "image"
        try:
            extracted_text = extract_image_text_ocr(file_bytes, content_type, co, language)
            pages = 1
        except Exception as e:
            return {
                "extracted_text": None,
                "file_type": file_type,
                "pages": 0,
                "tokens_used": 0,
                "document_updated": False,
                "message": f"Image OCR failed: {str(e)}"
            }

    elif any(storage_path_lower.endswith(ext) for ext in [".txt", ".md"]) or "text" in content_type:
        # Plain text
        file_type = "text"
        try:
            extracted_text = file_bytes.decode("utf-8")
            pages = 1
        except UnicodeDecodeError:
            extracted_text = file_bytes.decode("latin-1")
            pages = 1

    else:
        return {
            "extracted_text": None,
            "file_type": content_type,
            "pages": 0,
            "tokens_used": 0,
            "document_updated": False,
            "message": f"Unsupported file type: {content_type}"
        }

    # If document_id provided, update the document
    document_updated = False
    if document_id and extracted_text:
        postgres_db = wmill.get_resource("f/chatbot/postgres_db")
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        register_vector(conn)

        result = update_document_content(conn, document_id, extracted_text, co, update_embedding, title)
        document_updated = result.get("updated", False)
        tokens_used = result.get("tokens_used", 0)

        conn.close()

    return {
        "extracted_text": extracted_text[:1000] + "..." if len(extracted_text) > 1000 else extracted_text,
        "full_text_length": len(extracted_text),
        "file_type": file_type,
        "pages": pages,
        "tokens_used": tokens_used,
        "document_updated": document_updated,
        "message": f"Successfully extracted {len(extracted_text)} characters from {file_type} file"
    }

# process_zip_upload.py
# Windmill Python script for bulk document upload via ZIP file
# Path: f/chatbot/process_zip_upload
#
# requirements:
#   - wmill
#   - httpx
#   - psycopg2-binary
#   - cohere
#   - pgvector
#   - numpy

"""
Process a ZIP file containing multiple documents for batch embedding.

Supported file types:
- PDF (.pdf) - text extraction
- Text (.txt, .md) - direct content
- Images (.jpg, .png, .webp) - placeholder for future OCR

Args:
    zip_content_base64 (str): Base64-encoded ZIP file content
    tenant_id (str): Tenant UUID for multi-tenant isolation
    default_category (str, optional): Default category if not detectable
    auto_categorize (bool): Enable AI auto-categorization (default: True)
    extract_tags (bool): Enable AI tag extraction (default: True)
    visibility (str): Default visibility for all documents (default: 'everyone')
    assigned_to (int, optional): Default family member assignment

Returns:
    dict: {
        success: bool,
        total_files: int,
        processed: int,
        failed: int,
        skipped: int,
        results: list[{filename, status, document_id?, error?, category?}]
    }
"""

import wmill
import base64
import zipfile
import io
import os
from typing import Optional, List, Dict, Any
import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
import numpy as np
import re


# Supported file extensions
SUPPORTED_EXTENSIONS = {'.pdf', '.txt', '.md', '.docx'}
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'}
SKIP_EXTENSIONS = {'.ds_store', '.gitkeep', '.gitignore'}


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF bytes using basic method."""
    try:
        # Try PyPDF2 if available
        try:
            import PyPDF2
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            text_parts = []
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            return '\n\n'.join(text_parts)
        except ImportError:
            pass

        # Fallback: try pdfplumber
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                text_parts = []
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)
                return '\n\n'.join(text_parts)
        except ImportError:
            pass

        # Last resort: basic text extraction
        content = pdf_bytes.decode('latin-1', errors='ignore')
        # Extract text between stream markers (very basic)
        text_parts = re.findall(r'\((.*?)\)', content)
        return ' '.join(text_parts[:1000])  # Limit to prevent huge output

    except Exception as e:
        return f"[PDF extraction error: {str(e)}]"


def get_title_from_filename(filename: str) -> str:
    """Generate a clean title from filename."""
    # Remove extension
    name = os.path.splitext(filename)[0]
    # Remove common prefixes/patterns
    name = re.sub(r'^(scan|doc|document|img|image|photo)[-_]?', '', name, flags=re.I)
    # Replace underscores and hyphens with spaces
    name = re.sub(r'[-_]+', ' ', name)
    # Clean up multiple spaces
    name = re.sub(r'\s+', ' ', name).strip()
    # Title case if all lowercase
    if name.islower():
        name = name.title()
    return name or filename


def main(
    zip_content_base64: str,
    tenant_id: str,
    default_category: str = "general",
    auto_categorize: bool = True,
    extract_tags: bool = True,
    visibility: str = "everyone",
    assigned_to: Optional[int] = None
) -> Dict[str, Any]:
    """Process ZIP file and embed all supported documents."""

    results = []
    processed = 0
    failed = 0
    skipped = 0

    # Decode ZIP content
    try:
        zip_bytes = base64.b64decode(zip_content_base64)
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to decode ZIP content: {str(e)}",
            "total_files": 0,
            "processed": 0,
            "failed": 1,
            "skipped": 0,
            "results": []
        }

    # Get database connection
    try:
        db_resource = wmill.get_resource("u/admin/archevi_postgres")
        conn = psycopg2.connect(db_resource["connection_string"])
    except:
        postgres_db = wmill.get_resource("f/chatbot/postgres_db")
        conn = psycopg2.connect(
            host=postgres_db["host"],
            port=postgres_db["port"],
            dbname=postgres_db["dbname"],
            user=postgres_db["user"],
            password=postgres_db["password"],
            sslmode=postgres_db.get("sslmode", "disable")
        )

    register_vector(conn)

    # Get Cohere client
    cohere_key = wmill.get_variable("f/chatbot/COHERE_API_KEY")
    co = cohere.ClientV2(api_key=cohere_key)

    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes), 'r') as zf:
            file_list = zf.namelist()
            total_files = len([f for f in file_list if not f.endswith('/')])

            for filename in file_list:
                # Skip directories
                if filename.endswith('/'):
                    continue

                # Skip hidden/system files
                basename = os.path.basename(filename).lower()
                if basename.startswith('.') or basename.startswith('__'):
                    skipped += 1
                    results.append({
                        "filename": filename,
                        "status": "skipped",
                        "reason": "Hidden or system file"
                    })
                    continue

                # Check extension
                ext = os.path.splitext(filename)[1].lower()

                if ext in SKIP_EXTENSIONS:
                    skipped += 1
                    results.append({
                        "filename": filename,
                        "status": "skipped",
                        "reason": "System file"
                    })
                    continue

                if ext in IMAGE_EXTENSIONS:
                    skipped += 1
                    results.append({
                        "filename": filename,
                        "status": "skipped",
                        "reason": "Image files require OCR (not yet supported in bulk upload)"
                    })
                    continue

                if ext not in SUPPORTED_EXTENSIONS:
                    skipped += 1
                    results.append({
                        "filename": filename,
                        "status": "skipped",
                        "reason": f"Unsupported file type: {ext}"
                    })
                    continue

                try:
                    # Read file content
                    file_bytes = zf.read(filename)

                    # Extract text based on file type
                    if ext == '.pdf':
                        content = extract_text_from_pdf(file_bytes)
                    elif ext in {'.txt', '.md'}:
                        content = file_bytes.decode('utf-8', errors='replace')
                    elif ext == '.docx':
                        # Basic DOCX support - extract text from XML
                        try:
                            import zipfile as zf_inner
                            with zf_inner.ZipFile(io.BytesIO(file_bytes)) as docx:
                                xml_content = docx.read('word/document.xml').decode('utf-8')
                                # Extract text between <w:t> tags
                                content = ' '.join(re.findall(r'<w:t[^>]*>([^<]+)</w:t>', xml_content))
                        except:
                            content = "[DOCX extraction failed]"
                    else:
                        content = file_bytes.decode('utf-8', errors='replace')

                    # Skip if no meaningful content
                    if not content or len(content.strip()) < 10:
                        skipped += 1
                        results.append({
                            "filename": filename,
                            "status": "skipped",
                            "reason": "No extractable text content"
                        })
                        continue

                    # Generate title
                    title = get_title_from_filename(os.path.basename(filename))

                    # Truncate content if too long (Cohere has limits)
                    max_content_length = 50000
                    if len(content) > max_content_length:
                        content = content[:max_content_length] + "\n\n[Content truncated...]"

                    # Generate embedding
                    embed_response = co.embed(
                        texts=[content[:8000]],  # Cohere embed limit
                        model="embed-english-v3.0",
                        input_type="search_document",
                        embedding_types=["float"]
                    )
                    embedding = embed_response.embeddings.float_[0]

                    # Determine category (simple heuristic or use provided)
                    category = default_category
                    category_confidence = 0.0

                    if auto_categorize:
                        # Simple keyword-based categorization
                        content_lower = content.lower()
                        if any(w in content_lower for w in ['insurance', 'policy', 'premium', 'coverage', 'claim']):
                            category = 'insurance'
                            category_confidence = 0.7
                        elif any(w in content_lower for w in ['medical', 'doctor', 'hospital', 'prescription', 'diagnosis', 'patient']):
                            category = 'medical'
                            category_confidence = 0.7
                        elif any(w in content_lower for w in ['invoice', 'receipt', 'payment', 'amount due', 'total']):
                            category = 'invoices'
                            category_confidence = 0.7
                        elif any(w in content_lower for w in ['tax', 'income', 'deduction', 'cra', 'irs', 'w-2', 't4']):
                            category = 'taxes'
                            category_confidence = 0.7
                        elif any(w in content_lower for w in ['contract', 'agreement', 'hereby', 'whereas', 'party']):
                            category = 'legal'
                            category_confidence = 0.6
                        elif any(w in content_lower for w in ['recipe', 'ingredient', 'tablespoon', 'teaspoon', 'bake', 'cook']):
                            category = 'recipes'
                            category_confidence = 0.8

                    # Insert into database
                    with conn.cursor() as cur:
                        cur.execute("""
                            INSERT INTO family_documents
                            (tenant_id, title, content, category, source_file, embedding, visibility, assigned_to)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            RETURNING id
                        """, [
                            tenant_id,
                            title,
                            content,
                            category,
                            filename,
                            np.array(embedding),
                            visibility,
                            assigned_to
                        ])
                        doc_id = cur.fetchone()[0]
                        conn.commit()

                    processed += 1
                    results.append({
                        "filename": filename,
                        "status": "success",
                        "document_id": doc_id,
                        "title": title,
                        "category": category,
                        "category_confidence": category_confidence,
                        "content_length": len(content)
                    })

                except Exception as e:
                    failed += 1
                    results.append({
                        "filename": filename,
                        "status": "failed",
                        "error": str(e)
                    })
                    conn.rollback()

        return {
            "success": True,
            "total_files": total_files,
            "processed": processed,
            "failed": failed,
            "skipped": skipped,
            "results": results
        }

    except zipfile.BadZipFile:
        return {
            "success": False,
            "error": "Invalid ZIP file",
            "total_files": 0,
            "processed": 0,
            "failed": 1,
            "skipped": 0,
            "results": []
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "total_files": 0,
            "processed": processed,
            "failed": failed + 1,
            "skipped": skipped,
            "results": results
        }
    finally:
        conn.close()

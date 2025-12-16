# process_pdf_pages.py
# Windmill Python script for processing PDF pages into visual embeddings
# Path: f/chatbot/process_pdf_pages
#
# requirements:
#   - pymupdf
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - wmill
#   - pillow

"""
Process a PDF document: render pages as images and create visual embeddings.

This enables visual search of scanned documents, charts, diagrams, and handwritten notes
using Cohere Embed v4's image understanding capabilities.

Args:
    document_id (int): ID of the PDF document to process
    tenant_id (str): UUID of the tenant
    pdf_content (str): Base64-encoded PDF file content
    max_pages (int): Maximum pages to process (default: 50, for cost control)
    page_size (int): Target page image size in pixels (default: 512)

Returns:
    dict: {
        success: bool,
        document_id: int,
        pages_processed: int,
        total_pages: int,
        total_tokens: int,
        cost_usd: float,
        error: str (if failed)
    }
"""

import base64
import io
import fitz  # PyMuPDF
import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
from PIL import Image
import wmill
from typing import Optional


def render_page_to_image(page: fitz.Page, target_size: int = 512) -> bytes:
    """
    Render a PDF page to a JPEG image.

    Args:
        page: PyMuPDF page object
        target_size: Target dimension for the longer side

    Returns:
        JPEG image as bytes
    """
    # Calculate zoom factor to achieve target size
    rect = page.rect
    max_dim = max(rect.width, rect.height)
    zoom = target_size / max_dim if max_dim > 0 else 1.0

    # Render page to pixmap
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)

    # Convert to PIL Image then JPEG
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

    # Save as JPEG with good quality
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85, optimize=True)
    return buffer.getvalue()


def embed_image(co: cohere.Client, image_bytes: bytes) -> tuple[list[float], int]:
    """
    Create embedding for an image using Cohere Embed v4.

    Args:
        co: Cohere client
        image_bytes: JPEG image bytes

    Returns:
        Tuple of (embedding vector, token count)
    """
    # Convert to base64 data URI
    b64_image = base64.b64encode(image_bytes).decode('utf-8')
    data_uri = f"data:image/jpeg;base64,{b64_image}"

    # Call Cohere Embed v4
    response = co.embed(
        model="embed-v4.0",
        input_type="image",
        embedding_types=["float"],
        images=[data_uri]
    )

    embedding = response.embeddings.float[0]

    # Get token count - handle various response structures
    tokens = 1  # Default to 1 image
    if hasattr(response, 'meta') and response.meta:
        if hasattr(response.meta, 'billed_units') and response.meta.billed_units:
            if hasattr(response.meta.billed_units, 'images') and response.meta.billed_units.images:
                tokens = response.meta.billed_units.images

    return embedding, tokens


def main(
    document_id: int,
    tenant_id: str,
    pdf_content: str,
    max_pages: int = 50,
    page_size: int = 512
) -> dict:
    """Process PDF pages and create visual embeddings."""

    if not document_id or not tenant_id or not pdf_content:
        return {"success": False, "error": "document_id, tenant_id, and pdf_content are required"}

    # Get resources
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    # Initialize Cohere client
    co = cohere.Client(cohere_api_key)

    total_tokens = 0
    pages_processed = 0

    try:
        # Decode PDF
        pdf_bytes = base64.b64decode(pdf_content)
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)

        # Limit pages for cost control
        pages_to_process = min(total_pages, max_pages)

        # Connect to database
        conn = psycopg2.connect(
            host=postgres_db['host'],
            port=postgres_db['port'],
            dbname=postgres_db['dbname'],
            user=postgres_db['user'],
            password=postgres_db['password'],
            sslmode=postgres_db.get('sslmode', 'disable')
        )
        register_vector(conn)
        cursor = conn.cursor()

        # Process each page
        for page_num in range(pages_to_process):
            page = doc[page_num]

            # Render page to image
            image_bytes = render_page_to_image(page, page_size)
            b64_image = base64.b64encode(image_bytes).decode('utf-8')

            # Get page dimensions
            rect = page.rect

            # Check if page has text or is mostly images
            text = page.get_text().strip()
            has_text = len(text) > 50
            has_images = len(page.get_images()) > 0

            # Create visual embedding
            embedding, tokens = embed_image(co, image_bytes)
            total_tokens += tokens

            # Insert or update page record
            cursor.execute("""
                INSERT INTO document_pages (
                    document_id, tenant_id, page_number,
                    page_image, embedding, ocr_text,
                    width, height, has_text, has_images,
                    embedding_tokens
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (document_id, page_number)
                DO UPDATE SET
                    page_image = EXCLUDED.page_image,
                    embedding = EXCLUDED.embedding,
                    ocr_text = EXCLUDED.ocr_text,
                    width = EXCLUDED.width,
                    height = EXCLUDED.height,
                    has_text = EXCLUDED.has_text,
                    has_images = EXCLUDED.has_images,
                    embedding_tokens = EXCLUDED.embedding_tokens,
                    processed_at = NOW()
            """, (
                document_id, tenant_id, page_num + 1,  # 1-indexed
                b64_image, embedding, text[:5000] if text else None,
                int(rect.width), int(rect.height), has_text, has_images,
                tokens
            ))

            pages_processed += 1

        # Update document metadata
        cursor.execute("""
            UPDATE family_documents
            SET pdf_page_count = %s,
                has_page_embeddings = TRUE,
                updated_at = NOW()
            WHERE id = %s
        """, (total_pages, document_id))

        conn.commit()
        cursor.close()
        conn.close()
        doc.close()

        # Calculate cost (Cohere: ~$0.0004 per image at ~1000 tokens)
        cost_usd = total_tokens * 0.0000004

        return {
            "success": True,
            "document_id": document_id,
            "pages_processed": pages_processed,
            "total_pages": total_pages,
            "total_tokens": total_tokens,
            "cost_usd": round(cost_usd, 6)
        }

    except fitz.FileDataError as e:
        return {"success": False, "error": f"Invalid PDF: {str(e)}"}
    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Failed to process PDF: {str(e)}"}

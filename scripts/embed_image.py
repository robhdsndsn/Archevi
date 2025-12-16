# embed_image.py
# Windmill Python script for image embedding (visual search)
# Path: f/chatbot/embed_image
#
# requirements:
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - wmill
#   - httpx
#   - pillow

"""
Embed an image for visual search using Cohere Embed v4.

This is an OPT-IN feature - users must explicitly enable visual search.
Images are resized to 512x512 max to control costs.

Cohere Embed v4 Image Pricing:
- ~1,610 tokens per 512x512 image
- $0.47 per million image tokens
- ~$0.00076 per image

Args:
    document_id (int): ID of the document to add image embedding to
    tenant_id (str): UUID of the tenant (family)
    image_content (str): Base64-encoded image data

Returns:
    dict: {
        success: bool,
        document_id: int,
        image_tokens: int,
        cost_usd: float,
        error: str (if failed)
    }
"""

import base64
import io
import cohere
import psycopg2
from pgvector.psycopg2 import register_vector
from typing import Optional
import wmill

# Try to import PIL for image resizing
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


def resize_image(image_bytes: bytes, max_size: int = 512) -> bytes:
    """
    Resize image to max_size x max_size while maintaining aspect ratio.
    Returns JPEG bytes for consistent format and smaller size.
    """
    if not HAS_PIL:
        # If PIL not available, return original (will cost more)
        return image_bytes

    img = Image.open(io.BytesIO(image_bytes))

    # Convert to RGB if necessary (handles PNG with alpha, etc.)
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    # Resize maintaining aspect ratio
    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

    # Save as JPEG
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=85)
    return output.getvalue()


def main(
    document_id: int,
    tenant_id: str,
    image_content: str,
) -> dict:
    """
    Add image embedding to an existing document for visual search.
    """
    if not document_id:
        return {"success": False, "error": "document_id is required"}
    if not tenant_id:
        return {"success": False, "error": "tenant_id is required"}
    if not image_content:
        return {"success": False, "error": "image_content is required"}

    # Get credentials from Windmill
    postgres_db = wmill.get_resource("f/chatbot/postgres_db")
    cohere_api_key = wmill.get_variable("f/chatbot/cohere_api_key")

    # Decode base64 image
    try:
        if image_content.startswith("data:"):
            # Extract base64 part from data URL
            image_content = image_content.split(",", 1)[1]
        image_bytes = base64.b64decode(image_content)
    except Exception as e:
        return {"success": False, "error": f"Invalid base64 image: {str(e)}"}

    # Resize image to control costs
    try:
        resized_bytes = resize_image(image_bytes, max_size=512)
        resized_b64 = base64.b64encode(resized_bytes).decode('utf-8')
    except Exception as e:
        return {"success": False, "error": f"Image processing failed: {str(e)}"}

    # Generate image embedding using Cohere Embed v4
    try:
        co = cohere.ClientV2(api_key=cohere_api_key)

        # Embed the image
        response = co.embed(
            model="embed-v4.0",
            input_type="image",
            embedding_types=["float"],
            images=[f"data:image/jpeg;base64,{resized_b64}"],
            output_dimension=1024  # Match text embedding dimension
        )

        image_embedding = response.embeddings.float_[0]

        # Calculate tokens used (approximate based on image size)
        # 512x512 ≈ 1,610 tokens
        image_tokens = 1610
        cost_usd = image_tokens * 0.00000047  # $0.47 per million

    except cohere.errors.CohereAPIError as e:
        return {"success": False, "error": f"Cohere API error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Embedding failed: {str(e)}"}

    # Update document in database
    try:
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

        # Verify document belongs to tenant
        cursor.execute("""
            SELECT id FROM family_documents
            WHERE id = %s AND tenant_id = %s::uuid
        """, (document_id, tenant_id))

        if not cursor.fetchone():
            cursor.close()
            conn.close()
            return {"success": False, "error": "Document not found or access denied"}

        # Update document with image embedding
        cursor.execute("""
            UPDATE family_documents
            SET image_embedding = %s,
                has_image_embedding = TRUE,
                image_url = %s,
                content_type = CASE
                    WHEN content IS NOT NULL AND content != '' THEN 'mixed'
                    ELSE 'image'
                END,
                updated_at = NOW()
            WHERE id = %s AND tenant_id = %s::uuid
        """, (
            image_embedding,
            f"data:image/jpeg;base64,{resized_b64}",
            document_id,
            tenant_id
        ))

        # Log API usage
        cursor.execute("""
            INSERT INTO api_usage_log (operation, tokens_used, cost_usd)
            VALUES ('embed_image', %s, %s)
        """, (image_tokens, cost_usd))

        conn.commit()
        cursor.close()
        conn.close()

    except psycopg2.Error as e:
        return {"success": False, "error": f"Database error: {str(e)}"}

    return {
        "success": True,
        "document_id": document_id,
        "image_tokens": image_tokens,
        "cost_usd": round(cost_usd, 6)
    }

# process_email_forward.py
# Windmill Python script for processing forwarded emails into documents
# Path: f/chatbot/process_email_forward
#
# This script is triggered by Windmill's email trigger feature.
# Users forward emails to save@archevi.ca to add them to their family vault.
#
# requirements:
#   Core dependencies
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - numpy
#   - wmill
#   - resend
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
#   PDF parsing
#   - pypdf

"""
Process emails forwarded to save@archevi.ca and save them as documents.

This script receives emails via Windmill's email trigger and:
1. Verifies the sender is a registered family member
2. Extracts email subject as title, body as content
3. Processes any PDF/image attachments
4. Calls embed_document_enhanced to save with AI features
5. Sends a confirmation email back to the sender

Windmill Email Trigger provides:
- raw_email: Complete email string
- parsed_email: Object with headers, text_body, html_body, attachments
- email_extra_args: Optional query parameters (e.g., category=medical)

Returns:
    dict: {
        success: bool,
        document_id: int (if successful),
        message: str,
        attachments_processed: int,
        error: str (if failed)
    }
"""

import psycopg2
from typing import Optional, Dict, Any, List
import wmill
import re
from datetime import datetime
import json
from email.utils import parseaddr
import cohere
from pgvector.psycopg2 import register_vector
import hashlib


def extract_sender_email(parsed_email: Dict) -> Optional[str]:
    """Extract and normalize sender email from parsed email headers."""
    headers = parsed_email.get('headers', {})

    # Try common header names
    from_header = headers.get('from') or headers.get('From') or headers.get('FROM')

    if not from_header:
        return None

    # Parse email address from "Name <email>" format
    name, email = parseaddr(from_header)

    if email:
        return email.lower().strip()

    return None


def verify_sender(conn, sender_email: str) -> Optional[Dict]:
    """
    Verify sender is a registered family member and get their details.
    Returns member info if found, None if not authorized.
    """
    cursor = conn.cursor()

    # Check which column exists (tenant_id for production, family_id for local)
    cursor.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'family_members' AND column_name IN ('tenant_id', 'family_id')
    """)
    columns = [row[0] for row in cursor.fetchall()]
    tenant_column = 'tenant_id' if 'tenant_id' in columns else 'family_id'

    cursor.execute(f"""
        SELECT id, name, email, role, {tenant_column}, COALESCE(member_type, 'adult')
        FROM family_members
        WHERE LOWER(email) = LOWER(%s)
          AND is_active = true
          AND password_hash IS NOT NULL
    """, (sender_email,))

    row = cursor.fetchone()
    cursor.close()

    if row:
        return {
            'id': row[0],
            'name': row[1],
            'email': row[2],
            'role': row[3],
            'tenant_id': str(row[4]) if row[4] else None,
            'member_type': row[5] or 'adult'
        }

    return None


def extract_email_content(parsed_email: Dict) -> Dict[str, str]:
    """
    Extract clean text content from email.
    Prefers text_body, falls back to stripping HTML from html_body.
    """
    text_body = parsed_email.get('text_body', '')
    html_body = parsed_email.get('html_body', '')

    content = text_body.strip() if text_body else ''

    # If no text body, try to extract from HTML
    if not content and html_body:
        # Basic HTML stripping (for simple cases)
        # Remove script and style tags with content
        content = re.sub(r'<script[^>]*>.*?</script>', '', html_body, flags=re.DOTALL | re.IGNORECASE)
        content = re.sub(r'<style[^>]*>.*?</style>', '', content, flags=re.DOTALL | re.IGNORECASE)
        # Remove HTML tags
        content = re.sub(r'<[^>]+>', ' ', content)
        # Decode HTML entities
        content = content.replace('&nbsp;', ' ').replace('&amp;', '&')
        content = content.replace('&lt;', '<').replace('&gt;', '>')
        content = content.replace('&quot;', '"').replace('&#39;', "'")
        # Clean up whitespace
        content = re.sub(r'\s+', ' ', content).strip()

    return {
        'text': content,
        'has_html': bool(html_body)
    }


def extract_subject(parsed_email: Dict) -> str:
    """Extract and clean email subject for use as document title."""
    headers = parsed_email.get('headers', {})
    subject = headers.get('subject') or headers.get('Subject') or headers.get('SUBJECT') or ''

    # Remove common forward/reply prefixes
    subject = re.sub(r'^(fw:|fwd:|re:|fwd\s+|fw\s+|re\s+)+', '', subject, flags=re.IGNORECASE).strip()

    # Clean up any remaining leading/trailing whitespace or colons
    subject = subject.strip(': ')

    # Fallback if subject is empty
    if not subject:
        subject = f"Email from {datetime.now().strftime('%Y-%m-%d %H:%M')}"

    # Truncate if too long
    if len(subject) > 200:
        subject = subject[:197] + '...'

    return subject


def process_attachments(parsed_email: Dict, tenant_id: str, conn, co) -> List[Dict]:
    """
    Process email attachments (PDFs and images).
    Returns list of processed documents with their content.
    """
    attachments = parsed_email.get('attachments', [])
    processed = []

    for attachment in attachments:
        # Attachments are uploaded to S3 by Windmill and provided as { s3: "path" }
        if not isinstance(attachment, dict):
            continue

        s3_path = attachment.get('s3')
        filename = attachment.get('filename', 'attachment')
        content_type = attachment.get('content_type', '')

        if not s3_path:
            continue

        # Determine attachment type
        is_pdf = content_type == 'application/pdf' or filename.lower().endswith('.pdf')
        is_image = content_type.startswith('image/') or filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))

        if is_pdf:
            # Read PDF from S3 and extract text
            try:
                pdf_content = wmill.read_s3_file(s3_path)
                if pdf_content:
                    # Use pypdf to extract text
                    from pypdf import PdfReader
                    from io import BytesIO

                    reader = PdfReader(BytesIO(pdf_content))
                    text_parts = []
                    for page in reader.pages:
                        text = page.extract_text()
                        if text:
                            text_parts.append(text)

                    if text_parts:
                        processed.append({
                            'filename': filename,
                            'type': 'pdf',
                            'content': '\n\n'.join(text_parts),
                            'page_count': len(reader.pages)
                        })
            except Exception as e:
                processed.append({
                    'filename': filename,
                    'type': 'pdf',
                    'error': str(e)
                })

        elif is_image:
            # For images, we note them but OCR would need client-side processing
            # or a separate OCR service integration
            processed.append({
                'filename': filename,
                'type': 'image',
                's3_path': s3_path,
                'note': 'Image attachments require OCR - content not extracted'
            })

    return processed


def send_confirmation_email(
    recipient_email: str,
    recipient_name: str,
    document_title: str,
    document_id: int,
    category: str,
    tags: List[str],
    attachments_count: int
) -> bool:
    """Send confirmation email to the sender."""
    try:
        import resend
        resend_api_key = wmill.get_variable("u/admin/resend_api_key")

        if not resend_api_key:
            return False

        resend.api_key = resend_api_key

        tags_html = ''
        if tags:
            tags_html = f"""
            <p style="margin: 8px 0;">
                <strong>Tags:</strong> {', '.join(tags)}
            </p>
            """

        attachments_html = ''
        if attachments_count > 0:
            attachments_html = f"""
            <p style="margin: 8px 0;">
                <strong>Attachments processed:</strong> {attachments_count}
            </p>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #111; margin: 0; font-size: 24px;">Archevi</h1>
            </div>

            <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h2 style="color: #166534; margin: 0 0 8px 0; font-size: 18px;">
                    Document Saved Successfully
                </h2>
                <p style="margin: 0; color: #15803d;">
                    Your forwarded email has been added to your family vault.
                </p>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0;">
                    <strong>Title:</strong> {document_title}
                </p>
                <p style="margin: 8px 0;">
                    <strong>Category:</strong> {category.replace('_', ' ').title()}
                </p>
                {tags_html}
                {attachments_html}
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
                <a href="https://archevi.ca"
                   style="background: #000; color: #fff; padding: 12px 24px;
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                    View in Archevi
                </a>
            </div>

            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />

            <p style="color: #999; font-size: 12px; text-align: center;">
                You received this because you forwarded an email to save@archevi.ca
            </p>
        </body>
        </html>
        """

        resend.Emails.send({
            "from": "Archevi <hello@archevi.com>",
            "to": recipient_email,
            "subject": f"[Archevi] Document saved: {document_title[:50]}",
            "html": html
        })

        return True
    except Exception:
        return False


def send_rejection_email(recipient_email: str, reason: str) -> bool:
    """Send rejection email when email cannot be processed."""
    try:
        import resend
        resend_api_key = wmill.get_variable("u/admin/resend_api_key")

        if not resend_api_key:
            return False

        resend.api_key = resend_api_key

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #111; margin: 0; font-size: 24px;">Archevi</h1>
            </div>

            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <h2 style="color: #991b1b; margin: 0 0 8px 0; font-size: 18px;">
                    Could Not Save Document
                </h2>
                <p style="margin: 0; color: #dc2626;">
                    {reason}
                </p>
            </div>

            <p>
                If you believe this is an error, please:
            </p>
            <ul>
                <li>Make sure you're forwarding from your registered email address</li>
                <li>Check that your Archevi account is active</li>
                <li>Contact support if the issue persists</li>
            </ul>

            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />

            <p style="color: #999; font-size: 12px; text-align: center;">
                This email was sent because someone tried to forward to save@archevi.ca
            </p>
        </body>
        </html>
        """

        resend.Emails.send({
            "from": "Archevi <hello@archevi.com>",
            "to": recipient_email,
            "subject": "[Archevi] Could not save your document",
            "html": html
        })

        return True
    except Exception:
        return False


def main(
    raw_email: str = "",
    parsed_email: Optional[Dict] = None,
    email_extra_args: Optional[Dict] = None
) -> dict:
    """
    Process a forwarded email and save it as a document.

    This is triggered by Windmill's email trigger when someone sends
    an email to save@archevi.ca (or the configured email address).
    """
    if not parsed_email:
        return {
            "success": False,
            "error": "No parsed email data received"
        }

    # Extract sender email
    sender_email = extract_sender_email(parsed_email)
    if not sender_email:
        return {
            "success": False,
            "error": "Could not extract sender email address"
        }

    # Get database connection
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
    register_vector(conn)

    co = cohere.ClientV2(api_key=cohere_api_key)

    # Verify sender is a registered family member
    member = verify_sender(conn, sender_email)

    if not member:
        conn.close()
        # Send rejection email
        send_rejection_email(
            sender_email,
            "Your email address is not registered with an Archevi family vault. "
            "Please forward emails from your registered account."
        )
        return {
            "success": False,
            "error": f"Sender {sender_email} is not a registered family member",
            "sender": sender_email
        }

    if not member.get('tenant_id'):
        conn.close()
        send_rejection_email(
            sender_email,
            "Your account is not associated with a family vault. "
            "Please contact support."
        )
        return {
            "success": False,
            "error": f"Member {sender_email} has no tenant_id",
            "sender": sender_email
        }

    # Extract email content
    subject = extract_subject(parsed_email)
    email_content = extract_email_content(parsed_email)

    if not email_content['text'] and not parsed_email.get('attachments'):
        conn.close()
        send_rejection_email(
            sender_email,
            "The forwarded email appears to be empty. "
            "Please forward an email with text content or attachments."
        )
        return {
            "success": False,
            "error": "Email has no content",
            "sender": sender_email
        }

    # Process attachments
    attachments = process_attachments(parsed_email, member['tenant_id'], conn, co)
    attachments_with_content = [a for a in attachments if a.get('content')]

    # Combine email body with attachment content
    content_parts = []

    if email_content['text']:
        content_parts.append(f"--- Email Body ---\n{email_content['text']}")

    for att in attachments_with_content:
        content_parts.append(f"\n--- Attachment: {att['filename']} ---\n{att['content']}")

    full_content = '\n\n'.join(content_parts)

    if not full_content.strip():
        conn.close()
        return {
            "success": False,
            "error": "No extractable content from email or attachments",
            "sender": sender_email
        }

    # Parse extra arguments (e.g., category from email address)
    category = None
    visibility = 'everyone'

    if email_extra_args:
        category = email_extra_args.get('category')
        visibility = email_extra_args.get('visibility', 'everyone')

    # Call embed_document_enhanced logic inline (to avoid Windmill script-to-script call complexity)
    # This is a simplified version - for production, consider refactoring to share code

    try:
        # Import the enhanced embedding logic
        # Generate embedding
        response = co.embed(
            texts=[full_content[:8000]],  # Truncate for embedding
            model="embed-v4.0",
            input_type="search_document",
            embedding_types=["float"],
            output_dimension=1024
        )
        embedding = response.embeddings.float_[0]
        tokens_used = response.meta.billed_units.input_tokens if response.meta and response.meta.billed_units else len(full_content.split())

        # Auto-categorize based on content keywords
        final_category = category or auto_detect_category(full_content)

        # Extract tags
        tags = extract_simple_tags(full_content)

        # Compute content hash for duplicate detection
        content_hash = hashlib.sha256(
            f"{subject.lower()}||{' '.join(full_content.lower().split())}".encode()
        ).hexdigest()

        # Check for duplicates
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, title FROM family_documents
            WHERE tenant_id = %s AND metadata->>'content_hash' = %s
            LIMIT 1
        """, (member['tenant_id'], content_hash))

        existing = cursor.fetchone()
        if existing:
            cursor.close()
            conn.close()
            return {
                "success": False,
                "error": f"Duplicate document - this email was already saved as '{existing[1]}' (ID: {existing[0]})",
                "is_duplicate": True,
                "existing_id": existing[0],
                "sender": sender_email
            }

        # Prepare metadata
        metadata = {
            'tags': tags,
            'expiry_dates': [],
            'ai_features': ['email_forward', 'auto_categorize'],
            'category_confidence': 0.7,
            'content_hash': content_hash,
            'source': 'email_forward',
            'original_sender': sender_email,
            'attachments_count': len(attachments_with_content)
        }

        # Insert document
        cursor.execute("""
            INSERT INTO family_documents (
                title, content, category, source_file, created_by,
                embedding, metadata, tenant_id, visibility
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            subject,
            full_content,
            final_category,
            'email_forward',
            member['name'],
            embedding,
            json.dumps(metadata),
            member['tenant_id'],
            visibility
        ))

        document_id = cursor.fetchone()[0]

        # Log API usage
        cursor.execute("""
            INSERT INTO api_usage_log (operation, tokens_used, cost_usd)
            VALUES ('email_forward', %s, %s)
        """, (tokens_used, tokens_used * 0.0000001))

        conn.commit()
        cursor.close()
        conn.close()

        # Send confirmation email
        send_confirmation_email(
            sender_email,
            member['name'],
            subject,
            document_id,
            final_category,
            tags,
            len(attachments_with_content)
        )

        return {
            "success": True,
            "document_id": document_id,
            "title": subject,
            "category": final_category,
            "tags": tags,
            "tokens_used": tokens_used,
            "attachments_processed": len(attachments_with_content),
            "sender": sender_email,
            "member_name": member['name']
        }

    except Exception as e:
        conn.close()
        return {
            "success": False,
            "error": f"Failed to process email: {str(e)}",
            "sender": sender_email
        }


def auto_detect_category(content: str) -> str:
    """Simple keyword-based category detection."""
    content_lower = content.lower()

    category_keywords = {
        'medical': ['medical', 'health', 'doctor', 'prescription', 'hospital', 'patient', 'diagnosis'],
        'financial': ['bank', 'account', 'investment', 'tax', 'statement', 'payment', 'invoice'],
        'insurance': ['insurance', 'policy', 'coverage', 'premium', 'claim', 'deductible'],
        'legal': ['legal', 'contract', 'agreement', 'attorney', 'law', 'court'],
        'education': ['school', 'education', 'grade', 'student', 'course', 'diploma'],
        'travel': ['passport', 'visa', 'flight', 'hotel', 'booking', 'travel'],
        'invoices': ['invoice', 'receipt', 'bill', 'payment due', 'amount due'],
        'recipes': ['recipe', 'ingredients', 'cooking', 'tablespoon', 'teaspoon', 'bake'],
    }

    scores = {}
    for category, keywords in category_keywords.items():
        scores[category] = sum(1 for kw in keywords if kw in content_lower)

    if scores:
        best = max(scores, key=scores.get)
        if scores[best] >= 2:
            return best

    return 'general'


def extract_simple_tags(content: str) -> List[str]:
    """Extract simple tags based on content patterns."""
    tags = set()
    content_lower = content.lower()

    # Pattern-based tag extraction
    tag_patterns = {
        'urgent': ['urgent', 'asap', 'immediate', 'deadline'],
        'important': ['important', 'critical', 'priority'],
        'receipt': ['receipt', 'purchase', 'transaction'],
        'appointment': ['appointment', 'meeting', 'schedule'],
        'reminder': ['reminder', 'don\'t forget', 'remember'],
        'confirmation': ['confirmation', 'confirmed', 'booking'],
        'statement': ['statement', 'balance', 'summary'],
        'notification': ['notification', 'alert', 'notice'],
    }

    for tag, keywords in tag_patterns.items():
        if any(kw in content_lower for kw in keywords):
            tags.add(tag)

    return list(tags)[:5]

# parse_pdf.py
# Windmill Python script for parsing PDF files
# Path: f/chatbot/parse_pdf
#
# requirements:
#   - pypdf
#   - wmill

"""
Parse a PDF file and extract its text content.

Args:
    file_content (str): Base64-encoded PDF file content
    filename (str): Original filename for reference

Returns:
    dict: {
        success: bool,
        text: str (extracted text),
        page_count: int,
        filename: str,
        error: str (if failed)
    }
"""

import base64
import io
from pypdf import PdfReader


def main(file_content: str, filename: str = "document.pdf") -> dict:
    """
    Parse a PDF file and extract text content.
    """
    if not file_content:
        return {"success": False, "error": "No file content provided", "text": "", "page_count": 0, "filename": filename}

    try:
        # Decode base64 content
        # Handle data URL format if present
        if file_content.startswith("data:"):
            # Extract base64 part after the comma
            file_content = file_content.split(",", 1)[1]

        pdf_bytes = base64.b64decode(file_content)

        # Open PDF from bytes
        pdf_reader = PdfReader(io.BytesIO(pdf_bytes))

        # Extract text from all pages
        text_parts = []
        for page_num, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            if text and text.strip():
                text_parts.append(f"--- Page {page_num + 1} ---\n{text}")

        page_count = len(pdf_reader.pages)

        full_text = "\n\n".join(text_parts)

        if not full_text.strip():
            return {
                "success": False,
                "error": "Could not extract any text from PDF. The PDF may be image-based or encrypted.",
                "text": "",
                "page_count": page_count,
                "filename": filename
            }

        return {
            "success": True,
            "text": full_text,
            "page_count": page_count,
            "filename": filename
        }

    except base64.binascii.Error as e:
        return {"success": False, "error": f"Invalid base64 encoding: {str(e)}", "text": "", "page_count": 0, "filename": filename}
    except Exception as e:
        return {"success": False, "error": f"Failed to parse PDF: {str(e)}", "text": "", "page_count": 0, "filename": filename}

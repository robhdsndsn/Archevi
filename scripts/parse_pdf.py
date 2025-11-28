# parse_pdf.py
# Windmill Python script for parsing PDF files
# Path: f/chatbot/parse_pdf
#
# requirements:
#   - pymupdf
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
import fitz  # PyMuPDF
import io


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
        pdf_document = fitz.open(stream=pdf_bytes, filetype="pdf")

        # Extract text from all pages
        text_parts = []
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            text = page.get_text()
            if text.strip():
                text_parts.append(f"--- Page {page_num + 1} ---\n{text}")

        page_count = len(pdf_document)
        pdf_document.close()

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
    except fitz.FileDataError as e:
        return {"success": False, "error": f"Invalid or corrupted PDF file: {str(e)}", "text": "", "page_count": 0, "filename": filename}
    except Exception as e:
        return {"success": False, "error": f"Failed to parse PDF: {str(e)}", "text": "", "page_count": 0, "filename": filename}

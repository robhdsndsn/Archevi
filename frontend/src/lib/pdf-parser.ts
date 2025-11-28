import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface PDFParseResult {
  success: boolean;
  text?: string;
  pageCount?: number;
  filename?: string;
  error?: string;
}

/**
 * Parse a PDF file client-side using PDF.js
 * @param file - The File object to parse
 * @returns ParseResult with extracted text and metadata
 */
export async function parsePDF(file: File): Promise<PDFParseResult> {
  const filename = file.name;

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const pageCount = pdf.numPages;
    const textParts: string[] = [];

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items into page text
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');

      if (pageText.trim()) {
        textParts.push(`--- Page ${pageNum} ---\n${pageText}`);
      }
    }

    const fullText = textParts.join('\n\n');

    if (!fullText.trim()) {
      return {
        success: false,
        error: 'Could not extract any text from PDF. The PDF may be image-based or scanned.',
        text: '',
        pageCount,
        filename,
      };
    }

    return {
      success: true,
      text: fullText,
      pageCount,
      filename,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    // Handle specific PDF.js errors
    if (errorMessage.includes('Invalid PDF')) {
      return {
        success: false,
        error: 'Invalid or corrupted PDF file',
        text: '',
        pageCount: 0,
        filename,
      };
    }

    if (errorMessage.includes('password')) {
      return {
        success: false,
        error: 'PDF is password protected',
        text: '',
        pageCount: 0,
        filename,
      };
    }

    return {
      success: false,
      error: `Failed to parse PDF: ${errorMessage}`,
      text: '',
      pageCount: 0,
      filename,
    };
  }
}

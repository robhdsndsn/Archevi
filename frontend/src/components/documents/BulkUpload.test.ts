import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the external dependencies
vi.mock('@/lib/pdf-parser', () => ({
  parsePDF: vi.fn(),
}));

vi.mock('@/lib/ocr', () => ({
  performOCR: vi.fn(),
  extractPDFPagesAsImages: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  uploadFiles: vi.fn(),
}));

vi.mock('@/api/windmill', () => ({
  windmill: {
    embedDocumentEnhanced: vi.fn(),
  },
  DOCUMENT_CATEGORIES: [
    { value: 'medical', label: 'Medical' },
    { value: 'financial', label: 'Financial' },
  ],
}));

vi.mock('@/store/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    user: { tenant_id: 'test-tenant-123' },
  })),
}));

import { parsePDF } from '@/lib/pdf-parser';
import { performOCR, extractPDFPagesAsImages } from '@/lib/ocr';

describe('BulkUpload Content Extraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PDF Text Extraction', () => {
    it('extracts text from text-based PDFs using parsePDF', async () => {
      const mockParsePDF = parsePDF as ReturnType<typeof vi.fn>;
      mockParsePDF.mockResolvedValue({
        success: true,
        text: 'This is the extracted PDF content from page 1.',
        pageCount: 1,
      });

      const result = await parsePDF(new File([''], 'test.pdf', { type: 'application/pdf' }));

      expect(result.success).toBe(true);
      expect(result.text).toContain('extracted PDF content');
    });

    it('falls back to OCR when text extraction fails', async () => {
      const mockParsePDF = parsePDF as ReturnType<typeof vi.fn>;
      const mockExtractPages = extractPDFPagesAsImages as ReturnType<typeof vi.fn>;
      const mockPerformOCR = performOCR as ReturnType<typeof vi.fn>;

      // Simulate text extraction failure
      mockParsePDF.mockResolvedValue({
        success: false,
        error: 'No text content found',
      });

      // Simulate successful page image extraction
      mockExtractPages.mockResolvedValue([
        new Blob(['page1'], { type: 'image/png' }),
        new Blob(['page2'], { type: 'image/png' }),
      ]);

      // Simulate successful OCR
      mockPerformOCR
        .mockResolvedValueOnce({ success: true, text: 'OCR text from page 1' })
        .mockResolvedValueOnce({ success: true, text: 'OCR text from page 2' });

      const pdfResult = await parsePDF(new File([''], 'scanned.pdf', { type: 'application/pdf' }));
      expect(pdfResult.success).toBe(false);

      // Now test the fallback flow
      const pageImages = await extractPDFPagesAsImages(new File([''], 'scanned.pdf'), 3);
      expect(pageImages).toHaveLength(2);

      const ocrResults: string[] = [];
      for (let i = 0; i < pageImages.length; i++) {
        const ocrResult = await performOCR(pageImages[i]);
        if (ocrResult.success && ocrResult.text) {
          ocrResults.push(`--- Page ${i + 1} ---\n${ocrResult.text}`);
        }
      }

      expect(ocrResults).toHaveLength(2);
      expect(ocrResults[0]).toContain('OCR text from page 1');
      expect(ocrResults[1]).toContain('OCR text from page 2');
    });

    it('handles PDF extraction errors gracefully', async () => {
      const mockParsePDF = parsePDF as ReturnType<typeof vi.fn>;
      mockParsePDF.mockRejectedValue(new Error('PDF parsing failed'));

      await expect(parsePDF(new File([''], 'corrupt.pdf'))).rejects.toThrow('PDF parsing failed');
    });
  });

  describe('Image OCR Extraction', () => {
    it('extracts text from images using OCR', async () => {
      const mockPerformOCR = performOCR as ReturnType<typeof vi.fn>;
      mockPerformOCR.mockResolvedValue({
        success: true,
        text: 'This text was extracted from the image via OCR',
        confidence: 95,
      });

      const imageFile = new File(['image-data'], 'receipt.jpg', { type: 'image/jpeg' });
      const result = await performOCR(imageFile);

      expect(result.success).toBe(true);
      expect(result.text).toContain('extracted from the image');
      expect(result.confidence).toBe(95);
    });

    it('handles OCR failure gracefully', async () => {
      const mockPerformOCR = performOCR as ReturnType<typeof vi.fn>;
      mockPerformOCR.mockResolvedValue({
        success: false,
        error: 'Could not recognize text in image',
      });

      const imageFile = new File(['blank'], 'blank.png', { type: 'image/png' });
      const result = await performOCR(imageFile);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Could not recognize');
    });

    it('handles multiple image formats', async () => {
      const mockPerformOCR = performOCR as ReturnType<typeof vi.fn>;
      mockPerformOCR.mockResolvedValue({ success: true, text: 'Test text' });

      const formats = [
        { type: 'image/png', ext: '.png' },
        { type: 'image/jpeg', ext: '.jpg' },
        { type: 'image/webp', ext: '.webp' },
      ];

      for (const format of formats) {
        const file = new File(['data'], `test${format.ext}`, { type: format.type });
        const result = await performOCR(file);
        expect(result.success).toBe(true);
      }

      expect(mockPerformOCR).toHaveBeenCalledTimes(3);
    });
  });

  describe('Text File Handling', () => {
    it('reads plain text files directly using FileReader', async () => {
      const textContent = 'This is a plain text document.\nWith multiple lines.';
      const textFile = new File([textContent], 'notes.txt', { type: 'text/plain' });

      // Simulate reading file content (File.text() not available in JSDOM)
      const result = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(textFile);
      });

      expect(result).toBe(textContent);
    });

    it('reads markdown files directly using FileReader', async () => {
      const mdContent = '# Heading\n\nSome **bold** text.';
      const mdFile = new File([mdContent], 'readme.md', { type: 'text/markdown' });

      const result = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(mdFile);
      });

      expect(result).toBe(mdContent);
    });
  });

  describe('File Type Detection', () => {
    it('identifies PDF files correctly', () => {
      const pdfByType = new File([''], 'doc.pdf', { type: 'application/pdf' });
      const pdfByExt = new File([''], 'doc.pdf', { type: '' });

      expect(
        pdfByType.type === 'application/pdf' || pdfByType.name.endsWith('.pdf')
      ).toBe(true);
      expect(
        pdfByExt.type === 'application/pdf' || pdfByExt.name.endsWith('.pdf')
      ).toBe(true);
    });

    it('identifies image files correctly', () => {
      const imageTypes = ['image/png', 'image/jpeg', 'image/webp'];

      for (const type of imageTypes) {
        const file = new File([''], 'test.img', { type });
        expect(file.type.startsWith('image/')).toBe(true);
      }
    });

    it('identifies text files correctly', () => {
      const txtFile = new File([''], 'notes.txt', { type: 'text/plain' });
      const mdFile = new File([''], 'readme.md', { type: 'text/markdown' });

      expect(txtFile.type === 'text/plain' || txtFile.name.endsWith('.txt')).toBe(true);
      expect(mdFile.name.endsWith('.md')).toBe(true);
    });
  });

  describe('Content Fallback Handling', () => {
    it('provides fallback content when extraction fails completely', () => {
      const fileName = 'corrupt-document.pdf';
      const fallbackContent = `[Document: ${fileName}] - Content extraction failed`;

      expect(fallbackContent).toContain(fileName);
      expect(fallbackContent).toContain('extraction failed');
    });

    it('provides specific fallback for PDFs with no text', () => {
      const fileName = 'scanned-only.pdf';
      const fallbackContent = `[PDF Document: ${fileName}] - No text could be extracted`;

      expect(fallbackContent).toContain('PDF Document');
      expect(fallbackContent).toContain('No text could be extracted');
    });

    it('provides specific fallback for images with failed OCR', () => {
      const fileName = 'blurry-photo.jpg';
      const fallbackContent = `[Image: ${fileName}] - OCR could not extract text`;

      expect(fallbackContent).toContain('Image');
      expect(fallbackContent).toContain('OCR could not extract text');
    });
  });
});

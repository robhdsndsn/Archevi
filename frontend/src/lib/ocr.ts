import { createWorker, type Worker, OEM, PSM } from 'tesseract.js';

export interface OCRResult {
  success: boolean;
  text?: string;
  confidence?: number;
  pageCount?: number;
  error?: string;
}

export interface OCRProgress {
  status: string;
  progress: number;
}

let worker: Worker | null = null;

/**
 * Initialize the Tesseract worker (lazy loading)
 */
async function getWorker(): Promise<Worker> {
  if (!worker) {
    worker = await createWorker('eng', OEM.LSTM_ONLY, {
      logger: (m) => {
        // Can be used for progress tracking
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    // Configure for document scanning
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO, // Automatic page segmentation
    });
  }
  return worker;
}

/**
 * Perform OCR on an image file
 * @param file - Image file (PNG, JPG, WEBP, etc.)
 * @param onProgress - Optional progress callback
 */
export async function performOCR(
  file: File,
  onProgress?: (progress: OCRProgress) => void
): Promise<OCRResult> {
  const supportedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/gif'];

  if (!supportedTypes.includes(file.type)) {
    return {
      success: false,
      error: `Unsupported image format. Supported: ${supportedTypes.join(', ')}`,
    };
  }

  try {
    onProgress?.({ status: 'Loading OCR engine...', progress: 0 });

    const tesseractWorker = await getWorker();

    onProgress?.({ status: 'Processing image...', progress: 20 });

    // Read file as data URL
    const imageData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });

    onProgress?.({ status: 'Recognizing text...', progress: 40 });

    // Perform OCR
    const result = await tesseractWorker.recognize(imageData);

    onProgress?.({ status: 'Complete', progress: 100 });

    const text = result.data.text.trim();
    const confidence = result.data.confidence;

    if (!text) {
      return {
        success: false,
        error: 'No text detected in image. Try a clearer image or different angle.',
        confidence,
      };
    }

    return {
      success: true,
      text,
      confidence,
      pageCount: 1,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown OCR error';
    return {
      success: false,
      error: `OCR failed: ${errorMessage}`,
    };
  }
}

/**
 * Perform OCR on multiple images (e.g., scanned pages)
 */
export async function performBatchOCR(
  files: File[],
  onProgress?: (progress: OCRProgress, pageNumber: number, totalPages: number) => void
): Promise<OCRResult> {
  if (files.length === 0) {
    return { success: false, error: 'No files provided' };
  }

  const results: string[] = [];
  let totalConfidence = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(
      { status: `Processing page ${i + 1} of ${files.length}...`, progress: (i / files.length) * 100 },
      i + 1,
      files.length
    );

    const result = await performOCR(file);

    if (!result.success) {
      // Continue with other pages even if one fails
      results.push(`--- Page ${i + 1} (OCR failed: ${result.error}) ---\n`);
      continue;
    }

    results.push(`--- Page ${i + 1} ---\n${result.text}`);
    totalConfidence += result.confidence || 0;
  }

  const combinedText = results.join('\n\n');
  const avgConfidence = files.length > 0 ? totalConfidence / files.length : 0;

  if (!combinedText.trim()) {
    return {
      success: false,
      error: 'No text detected in any of the images',
    };
  }

  return {
    success: true,
    text: combinedText,
    confidence: avgConfidence,
    pageCount: files.length,
  };
}

/**
 * Check if a PDF might be image-based (scanned) by attempting to extract text
 * If no text is found, it's likely a scanned PDF that needs OCR
 */
export function isPDFLikelyScanned(pdfText: string, pageCount: number): boolean {
  // If average chars per page is very low, likely scanned
  const avgCharsPerPage = pdfText.length / Math.max(pageCount, 1);
  return avgCharsPerPage < 100;
}

/**
 * Terminate the OCR worker to free memory
 */
export async function terminateOCR(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

/**
 * Extract images from a PDF for OCR processing
 * Note: This requires pdf.js to render pages as images
 */
export async function extractPDFPagesAsImages(
  file: File,
  maxPages: number = 20
): Promise<File[]> {
  const pdfjsLib = await import('pdfjs-dist');

  // Configure worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageCount = Math.min(pdf.numPages, maxPages);
  const images: File[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR

    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    }).promise;

    // Convert to blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });

    // Create file
    const imageFile = new File([blob], `page-${i}.png`, { type: 'image/png' });
    images.push(imageFile);
  }

  return images;
}

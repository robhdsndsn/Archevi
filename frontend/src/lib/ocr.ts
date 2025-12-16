import { createWorker, type Worker, OEM, PSM } from 'tesseract.js';

export interface OCRResult {
  success: boolean;
  text?: string;
  confidence?: number;
  pageCount?: number;
  error?: string;
}

/**
 * Supported OCR languages with their Tesseract codes
 * Languages are downloaded on-demand when first used
 */
export const OCR_LANGUAGES = [
  { code: 'eng', name: 'English', nativeName: 'English' },
  { code: 'fra', name: 'French', nativeName: 'Français' },
  { code: 'deu', name: 'German', nativeName: 'Deutsch' },
  { code: 'spa', name: 'Spanish', nativeName: 'Español' },
  { code: 'ita', name: 'Italian', nativeName: 'Italiano' },
  { code: 'por', name: 'Portuguese', nativeName: 'Português' },
  { code: 'nld', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'pol', name: 'Polish', nativeName: 'Polski' },
  { code: 'rus', name: 'Russian', nativeName: 'Русский' },
  { code: 'ukr', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'jpn', name: 'Japanese', nativeName: '日本語' },
  { code: 'chi_sim', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'chi_tra', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'kor', name: 'Korean', nativeName: '한국어' },
  { code: 'ara', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hin', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'tur', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'vie', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'tha', name: 'Thai', nativeName: 'ไทย' },
  { code: 'heb', name: 'Hebrew', nativeName: 'עברית' },
] as const;

export type OCRLanguageCode = typeof OCR_LANGUAGES[number]['code'];

const OCR_LANGUAGE_STORAGE_KEY = 'archevi_ocr_language';

/**
 * Get the user's preferred OCR language from localStorage
 */
export function getOCRLanguagePreference(): OCRLanguageCode {
  if (typeof window === 'undefined') return 'eng';
  const stored = localStorage.getItem(OCR_LANGUAGE_STORAGE_KEY);
  if (stored && OCR_LANGUAGES.some(l => l.code === stored)) {
    return stored as OCRLanguageCode;
  }
  return 'eng';
}

/**
 * Set the user's preferred OCR language
 */
export function setOCRLanguagePreference(code: OCRLanguageCode): void {
  localStorage.setItem(OCR_LANGUAGE_STORAGE_KEY, code);
  // Clear existing worker so next OCR uses new language
  if (worker) {
    worker.terminate();
    worker = null;
    currentLanguage = null;
  }
}

/**
 * Post-process OCR text to clean up common artifacts
 * Fixes: extra spaces, split words, orphan characters
 *
 * Conservative approach: only fix obvious issues, don't merge words aggressively
 */
export function cleanOCRText(text: string): string {
  let cleaned = text;

  // Step 1: Normalize line endings
  cleaned = cleaned.replace(/\r\n/g, '\n');

  // Step 2: Collapse multiple spaces (3+) to single space
  // Keep double spaces as they might indicate paragraph breaks
  cleaned = cleaned.replace(/[ \t]{3,}/g, ' ');

  // Step 3: Fix ONLY obvious split words (conservative patterns)
  // Pattern: Capital letter + space + lowercase letters that form common suffixes
  const splitWordFixes: [RegExp, string][] = [
    // Common split suffixes
    [/([A-Z][a-z]+) (tion|sion|ment|ness|able|ible|ing|ous|ious|ful|less|ly|er|est|ed|es|s)\b/gi, '$1$2'],
    // Single capital + space + rest of word (like "L ights")
    [/\b([A-Z]) ([a-z]{3,})\b/g, '$1$2'],
    // Word ending in space + single lowercase letter (like "Light s")
    [/\b([A-Za-z]{3,}) ([a-z])\b/g, '$1$2'],
  ];

  for (const [pattern, replacement] of splitWordFixes) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // Step 4: Fix space before punctuation
  cleaned = cleaned.replace(/ +([.,;:!?])/g, '$1');

  // Step 5: Fix space after opening brackets and before closing
  cleaned = cleaned.replace(/\( +/g, '(');
  cleaned = cleaned.replace(/ +\)/g, ')');
  cleaned = cleaned.replace(/\[ +/g, '[');
  cleaned = cleaned.replace(/ +\]/g, ']');

  // Step 6: Clean up orphan single characters on their own lines
  cleaned = cleaned.replace(/^\s*[a-zA-Z]\s*$/gm, '');

  // Step 7: Collapse multiple blank lines to max 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Step 8: Trim each line and collapse remaining multiple spaces to single
  cleaned = cleaned
    .split('\n')
    .map(line => line.trim().replace(/ {2,}/g, ' '))
    .join('\n');

  // Step 9: Final trim
  cleaned = cleaned.trim();

  return cleaned;
}

export interface OCRProgress {
  status: string;
  progress: number;
}

let worker: Worker | null = null;
let currentLanguage: OCRLanguageCode | null = null;

/**
 * Initialize the Tesseract worker (lazy loading)
 * @param language - Language code for OCR (defaults to user preference)
 */
async function getWorker(language?: OCRLanguageCode): Promise<Worker> {
  const targetLanguage = language || getOCRLanguagePreference();

  // Recreate worker if language changed
  if (worker && currentLanguage !== targetLanguage) {
    await worker.terminate();
    worker = null;
    currentLanguage = null;
  }

  if (!worker) {
    worker = await createWorker(targetLanguage, OEM.LSTM_ONLY, {
      logger: (m) => {
        // Can be used for progress tracking
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    currentLanguage = targetLanguage;

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
 * @param language - Optional language code (defaults to user preference)
 */
export async function performOCR(
  file: File,
  onProgress?: (progress: OCRProgress) => void,
  language?: OCRLanguageCode
): Promise<OCRResult> {
  const supportedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/gif'];

  if (!supportedTypes.includes(file.type)) {
    return {
      success: false,
      error: `Unsupported image format. Supported: ${supportedTypes.join(', ')}`,
    };
  }

  try {
    const langName = OCR_LANGUAGES.find(l => l.code === (language || getOCRLanguagePreference()))?.name || 'English';
    onProgress?.({ status: `Loading OCR engine (${langName})...`, progress: 0 });

    const tesseractWorker = await getWorker(language);

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

    onProgress?.({ status: 'Cleaning up text...', progress: 90 });

    // Clean up OCR artifacts (extra spaces, split words, etc.)
    const rawText = result.data.text.trim();
    const text = cleanOCRText(rawText);
    const confidence = result.data.confidence;

    onProgress?.({ status: 'Complete', progress: 100 });

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
 * @param files - Array of image files
 * @param onProgress - Optional progress callback
 * @param language - Optional language code (defaults to user preference)
 */
export async function performBatchOCR(
  files: File[],
  onProgress?: (progress: OCRProgress, pageNumber: number, totalPages: number) => void,
  language?: OCRLanguageCode
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

    const result = await performOCR(file, undefined, language);

    if (!result.success) {
      // Continue with other pages even if one fails
      results.push(`--- Page ${i + 1} (OCR failed: ${result.error}) ---\n`);
      continue;
    }

    // Text is already cleaned by performOCR
    results.push(`--- Page ${i + 1} ---\n${result.text}`);
    totalConfidence += result.confidence || 0;
  }

  // Join and do a final cleanup pass on the combined text
  const combinedText = cleanOCRText(results.join('\n\n'));
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

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Upload,
  FolderUp,
  Loader2,
  CheckCircle2,
  XCircle,
  FileText,
  File,
  HelpCircle,
  Sparkles,
  CloudUpload,
  Trash2,
  X,
} from 'lucide-react';
import { uploadFiles } from '@/lib/supabase';
import { windmill, DOCUMENT_CATEGORIES, type DocumentCategory } from '@/api/windmill';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { parsePDF } from '@/lib/pdf-parser';
import { performOCR, extractPDFPagesAsImages } from '@/lib/ocr';

interface BulkUploadProps {
  onSuccess?: () => void;
}

interface FileStatus {
  file: File;
  status: 'pending' | 'uploading' | 'extracting' | 'processing' | 'success' | 'error';
  progress: number;
  error?: string;
  storagePath?: string;
  documentId?: number;
  extractedText?: string;
}

// Default tenant for MVP
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

// Accepted file types
const ACCEPTED_TYPES = {
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/markdown': '.md',
  'image/png': '.png',
  'image/jpeg': '.jpg,.jpeg',
  'image/webp': '.webp',
};

export function BulkUpload({ onSuccess }: BulkUploadProps) {
  const { user } = useAuthStore();
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;

  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [defaultCategory, setDefaultCategory] = useState<DocumentCategory | 'auto'>('auto');
  const [autoCategorizaion, setAutoCategorization] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection
  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: FileStatus[] = [];
    const skipped: string[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      // Check if file type is accepted
      const isAccepted = Object.keys(ACCEPTED_TYPES).includes(file.type) ||
        file.name.endsWith('.pdf') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.md');

      if (isAccepted) {
        // Check if file already exists in the list
        const exists = files.some(f => f.file.name === file.name && f.file.size === file.size);
        if (!exists) {
          newFiles.push({
            file,
            status: 'pending',
            progress: 0,
          });
        }
      } else {
        skipped.push(file.name);
      }
    }

    if (skipped.length > 0) {
      toast.warning(`Skipped ${skipped.length} unsupported files`, {
        description: skipped.slice(0, 3).join(', ') + (skipped.length > 3 ? '...' : ''),
      });
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      toast.success(`Added ${newFiles.length} files`, {
        description: 'Click "Start Upload" when ready.',
      });
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [files]);

  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all files
  const clearAll = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update a specific file's status
  const updateFileStatus = (index: number, updates: Partial<FileStatus>) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  // Start the upload process
  const startUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setOverallProgress(0);

    // We iterate all files but skip non-pending ones in the loop
    let completed = 0;

    for (let i = 0; i < files.length; i++) {
      const fileStatus = files[i];
      if (fileStatus.status !== 'pending' && fileStatus.status !== 'error') {
        completed++;
        continue;
      }

      // Step 1: Upload to Supabase Storage
      updateFileStatus(i, { status: 'uploading', progress: 10 });

      try {
        const result = await uploadFiles([fileStatus.file], tenantId, (_filename, current, total) => {
          updateFileStatus(i, { progress: 10 + (40 * current / total) });
        });

        if (result.failures.length > 0) {
          updateFileStatus(i, {
            status: 'error',
            error: result.failures[0].error,
            progress: 0,
          });
          completed++;
          setOverallProgress(Math.round((completed / files.length) * 100));
          continue;
        }

        const uploadedFile = result.successes[0];
        updateFileStatus(i, {
          status: 'processing',
          progress: 50,
          storagePath: uploadedFile.path,
        });

        // Step 2: Extract content from file
        updateFileStatus(i, { status: 'extracting', progress: 55 });
        let content = '';
        const file = fileStatus.file;
        const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        const isImage = file.type.startsWith('image/');

        try {
          if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            // Text files - read directly
            content = await file.text();
          } else if (isPDF) {
            // PDF files - parse text content
            const pdfResult = await parsePDF(file);
            if (pdfResult.success && pdfResult.text) {
              content = pdfResult.text;
            } else {
              // If text extraction fails, try OCR on pages
              const pageImages = await extractPDFPagesAsImages(file, 3); // First 3 pages
              if (pageImages.length > 0) {
                const ocrResults: string[] = [];
                for (let p = 0; p < pageImages.length; p++) {
                  updateFileStatus(i, { progress: 55 + (10 * (p + 1) / pageImages.length) });
                  const ocrResult = await performOCR(pageImages[p]);
                  if (ocrResult.success && ocrResult.text) {
                    ocrResults.push(`--- Page ${p + 1} ---\n${ocrResult.text}`);
                  }
                }
                content = ocrResults.join('\n\n') || `[PDF Document: ${file.name}] - Could not extract text`;
              } else {
                content = `[PDF Document: ${file.name}] - No text could be extracted`;
              }
            }
          } else if (isImage) {
            // Images - perform OCR
            const ocrResult = await performOCR(file);
            if (ocrResult.success && ocrResult.text) {
              content = ocrResult.text;
            } else {
              content = `[Image: ${file.name}] - OCR could not extract text`;
            }
          }
        } catch (extractError) {
          console.error(`[BulkUpload] Content extraction failed for ${file.name}:`, extractError);
          // Continue with minimal content rather than failing
          content = `[Document: ${file.name}] - Content extraction failed`;
        }

        updateFileStatus(i, { progress: 70, extractedText: content });

        // Step 3: Create document in database via Windmill
        const embedResult = await windmill.embedDocumentEnhanced({
          title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          content: content,
          tenant_id: tenantId,
          category: defaultCategory === 'auto' ? undefined : defaultCategory as DocumentCategory,
          source_file: uploadedFile.path,
          auto_categorize_enabled: autoCategorizaion,
          extract_tags_enabled: true,
          extract_dates_enabled: true,
        });

        if (embedResult.is_duplicate) {
          updateFileStatus(i, {
            status: 'error',
            error: `Duplicate: matches "${embedResult.existing_document?.title}"`,
            progress: 0,
          });
        } else {
          updateFileStatus(i, {
            status: 'success',
            progress: 100,
            documentId: embedResult.document_id || undefined,
          });
        }
      } catch (err) {
        updateFileStatus(i, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
          progress: 0,
        });
      }

      completed++;
      setOverallProgress(Math.round((completed / files.length) * 100));
    }

    setIsUploading(false);

    const successCount = files.filter(f => f.status === 'success').length;
    const errorCount = files.filter(f => f.status === 'error').length;

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} documents`, {
        description: errorCount > 0 ? `${errorCount} failed` : undefined,
      });
      onSuccess?.();
    } else if (errorCount > 0) {
      toast.error('Upload failed', {
        description: `All ${errorCount} files failed to upload.`,
      });
    }
  };

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    }
    if (file.type.startsWith('image/')) {
      return <File className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  // Get status icon
  const getStatusIcon = (status: FileStatus['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-4 w-4 rounded-full bg-muted" />;
      case 'uploading':
      case 'extracting':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderUp className="h-5 w-5" />
          Bulk Upload
          <Badge variant="secondary" className="ml-2 gap-1">
            <CloudUpload className="h-3 w-3" />
            Cloud Storage
          </Badge>
        </CardTitle>
        <CardDescription>
          Upload multiple documents at once. Files are stored in cloud storage for better performance.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          ref={dropZoneRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={Object.values(ACCEPTED_TYPES).join(',')}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />
          <Upload className={`h-10 w-10 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="text-sm font-medium">
            {isDragging ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports PDF, TXT, MD, and images (PNG, JPG, WEBP)
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="default-category">Default Category</Label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-72">
                  <p className="text-sm text-muted-foreground">
                    Set a fallback category for files that can't be auto-categorized.
                    Leave empty to let AI decide.
                  </p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <Select
              value={defaultCategory}
              onValueChange={(v) => setDefaultCategory(v as DocumentCategory | 'auto')}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Auto-detect..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <Label htmlFor="auto-cat" className="font-medium">AI Auto-categorization</Label>
                <p className="text-xs text-muted-foreground">Use AI to detect categories</p>
              </div>
            </div>
            <Switch
              id="auto-cat"
              checked={autoCategorizaion}
              onCheckedChange={setAutoCategorization}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Files ({files.length})
                {successCount > 0 && <span className="text-green-500 ml-2">({successCount} done)</span>}
                {errorCount > 0 && <span className="text-destructive ml-2">({errorCount} failed)</span>}
              </Label>
              {!isUploading && (
                <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1 text-muted-foreground">
                  <Trash2 className="h-3 w-3" />
                  Clear all
                </Button>
              )}
            </div>

            <ScrollArea className="h-[200px] border rounded-md">
              <div className="p-2 space-y-1">
                {files.map((fileStatus, index) => (
                  <div
                    key={`${fileStatus.file.name}-${index}`}
                    className={`
                      flex items-center gap-2 p-2 rounded-md text-sm
                      ${fileStatus.status === 'error' ? 'bg-destructive/10' : 'bg-muted/50'}
                    `}
                  >
                    {getFileIcon(fileStatus.file)}
                    <span className="flex-1 truncate">{fileStatus.file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(fileStatus.file.size / 1024).toFixed(0)} KB
                    </span>
                    {(fileStatus.status === 'uploading' || fileStatus.status === 'processing') && (
                      <div className="w-16">
                        <Progress value={fileStatus.progress} className="h-1" />
                      </div>
                    )}
                    {getStatusIcon(fileStatus.status)}
                    {fileStatus.status === 'pending' && !isUploading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                    {fileStatus.error && (
                      <span className="text-xs text-destructive truncate max-w-[150px]" title={fileStatus.error}>
                        {fileStatus.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Overall progress */}
            {isUploading && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall progress</span>
                  <span className="font-medium">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} />
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={startUpload}
          disabled={isUploading || pendingCount === 0}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading {files.length - pendingCount} of {files.length}...
            </>
          ) : (
            <>
              <CloudUpload className="mr-2 h-4 w-4" />
              Start Upload ({pendingCount} files)
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

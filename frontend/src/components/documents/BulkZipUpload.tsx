import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Archive,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  X,
  FolderArchive,
} from 'lucide-react';
import { windmill, DOCUMENT_CATEGORIES, DOCUMENT_VISIBILITY, type DocumentCategory, type DocumentVisibility } from '@/api/windmill';
import type { ZipFileResult } from '@/api/windmill/types';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

interface BulkZipUploadProps {
  onSuccess?: () => void;
}

// Default tenant for MVP
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

type UploadState = 'idle' | 'reading' | 'uploading' | 'complete';

export function BulkZipUpload({ onSuccess }: BulkZipUploadProps) {
  const { user } = useAuthStore();
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;

  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [defaultCategory, setDefaultCategory] = useState<DocumentCategory | ''>('');
  const [visibility, setVisibility] = useState<DocumentVisibility>('everyone');
  const [error, setError] = useState<string | null>(null);

  // Results
  const [results, setResults] = useState<ZipFileResult[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    processed: number;
    failed: number;
    skipped: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setError('Please select a ZIP file');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setResults([]);
    setSummary(null);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setResults([]);
    setSummary(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setError(null);
    setUploadState('reading');

    try {
      // Read file as base64
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(selectedFile);
      });

      setUploadState('uploading');

      // Call the bulk upload API
      const result = await windmill.processZipUpload({
        zip_content_base64: base64Content,
        tenant_id: tenantId,
        default_category: defaultCategory as DocumentCategory || 'general',
        auto_categorize: true,
        extract_tags: true,
        visibility: visibility,
      });

      if (!result.success && result.error) {
        setError(result.error);
        setUploadState('idle');
        return;
      }

      setResults(result.results);
      setSummary({
        total: result.total_files,
        processed: result.processed,
        failed: result.failed,
        skipped: result.skipped,
      });
      setUploadState('complete');

      if (result.processed > 0) {
        toast.success('Bulk upload complete', {
          description: `${result.processed} of ${result.total_files} documents uploaded successfully.`,
        });
        onSuccess?.();
      } else if (result.total_files === 0) {
        toast.info('No files found', {
          description: 'The ZIP file appears to be empty or contains no supported files.',
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload ZIP file';
      setError(errorMsg);
      toast.error('Upload failed', { description: errorMsg });
      setUploadState('idle');
    }
  };

  const handleReset = () => {
    setUploadState('idle');
    setSelectedFile(null);
    setResults([]);
    setSummary(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-600">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'skipped':
        return <Badge variant="secondary">Skipped</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Bulk Upload
          <Badge variant="outline" className="ml-2">ZIP</Badge>
        </CardTitle>
        <CardDescription>
          Upload multiple documents at once from a ZIP file
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {uploadState === 'idle' && (
          <>
            {/* File selection */}
            <div className="space-y-2">
              <Label htmlFor="zip-file">ZIP File</Label>
              <div className="flex gap-2">
                <input
                  id="zip-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FolderArchive className="h-4 w-4" />
                  {selectedFile ? 'Change File' : 'Select ZIP File'}
                </Button>
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <Archive className="h-4 w-4" />
                  <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={clearFile}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Default category */}
            <div className="space-y-2">
              <Label htmlFor="default-category">
                Default Category
                <span className="text-xs text-muted-foreground ml-2">(AI will auto-detect when possible)</span>
              </Label>
              <Select
                value={defaultCategory || 'general'}
                onValueChange={(v) => setDefaultCategory(v as DocumentCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select default category" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <Label htmlFor="bulk-visibility">Default Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as DocumentVisibility)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_VISIBILITY.map((vis) => (
                    <SelectItem key={vis.value} value={vis.value}>
                      {vis.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supported formats */}
            <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground">
              <p className="font-medium mb-1">Supported file types in ZIP:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>PDF documents (.pdf)</li>
                <li>Text files (.txt, .md)</li>
                <li>Word documents (.docx)</li>
              </ul>
              <p className="mt-2 text-xs">Images will be skipped (use single upload with OCR instead)</p>
            </div>
          </>
        )}

        {(uploadState === 'reading' || uploadState === 'uploading') && (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">
                  {uploadState === 'reading' ? 'Reading ZIP file...' : 'Processing documents...'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {uploadState === 'reading'
                    ? 'Preparing files for upload'
                    : 'AI is categorizing and embedding documents'}
                </p>
              </div>
            </div>
            <Progress value={uploadState === 'reading' ? 30 : 70} className="w-full" />
          </div>
        )}

        {uploadState === 'complete' && summary && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 bg-muted rounded-md">
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-xs text-muted-foreground">Total Files</div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-md">
                <div className="text-2xl font-bold text-green-600">{summary.processed}</div>
                <div className="text-xs text-muted-foreground">Uploaded</div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md">
                <div className="text-2xl font-bold text-amber-600">{summary.skipped}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-md">
                <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>

            {/* Results list */}
            {results.length > 0 && (
              <div className="space-y-2">
                <Label>Processing Results</Label>
                <ScrollArea className="h-[300px] rounded-md border">
                  <div className="p-2 space-y-1">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                      >
                        {getStatusIcon(result.status)}
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate font-medium">
                            {result.title || result.filename}
                          </p>
                          {result.status === 'success' && result.category && (
                            <p className="text-xs text-muted-foreground">
                              Category: {result.category}
                              {result.category_confidence &&
                                ` (${Math.round(result.category_confidence * 100)}% confidence)`}
                            </p>
                          )}
                          {result.status === 'skipped' && result.reason && (
                            <p className="text-xs text-amber-600">{result.reason}</p>
                          )}
                          {result.status === 'failed' && result.error && (
                            <p className="text-xs text-red-600">{result.error}</p>
                          )}
                        </div>
                        {getStatusBadge(result.status)}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        {uploadState === 'idle' && (
          <Button
            type="button"
            className="w-full gap-2"
            disabled={!selectedFile}
            onClick={handleUpload}
          >
            <Upload className="h-4 w-4" />
            Upload ZIP File
          </Button>
        )}
        {uploadState === 'complete' && (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleReset}
          >
            <Archive className="h-4 w-4" />
            Upload Another ZIP
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

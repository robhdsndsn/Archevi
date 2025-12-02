import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Upload, FileText, Loader2, CheckCircle2, FileUp, X, Sparkles, ScanText, ChevronDown, Tag, Calendar, Brain, Camera, HelpCircle, User } from 'lucide-react';
import { windmill, DOCUMENT_CATEGORIES, type DocumentCategory, type FamilyMember } from '@/api/windmill';
import type { EmbedDocumentEnhancedResult, ExpiryDate } from '@/api/windmill/types';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { parsePDF } from '@/lib/pdf-parser';
import { performOCR, extractPDFPagesAsImages, isPDFLikelyScanned, type OCRProgress } from '@/lib/ocr';
import { CameraCapture, useHasCamera } from './CameraCapture';

interface DocumentUploadProps {
  onSuccess?: () => void;
}

// Default tenant for MVP - The Hudson Family
// TODO: Remove this when auth properly returns tenant_id
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

export function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const { user } = useAuthStore();
  // Use tenant_id from auth context, fall back to default for MVP
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<DocumentCategory | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isOCRing, setIsOCRing] = useState(false);
  const [ocrProgress, setOCRProgress] = useState<OCRProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; pageCount?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced AI features
  const [enhancedMode, setEnhancedMode] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoCategorizaion, setAutoCategorization] = useState(true);
  const [extractTags, setExtractTags] = useState(true);
  const [extractDates, setExtractDates] = useState(true);

  // Results from enhanced embedding
  const [enhancedResult, setEnhancedResult] = useState<{
    suggestedCategory?: DocumentCategory;
    categoryConfidence?: number;
    tags?: string[];
    expiryDates?: ExpiryDate[];
    aiFeatures?: string[];
  } | null>(null);

  // Camera capture state
  const [showCamera, setShowCamera] = useState(false);
  const { hasCamera } = useHasCamera();

  // Family member assignment
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch family members on mount
  useEffect(() => {
    const fetchFamilyMembers = async () => {
      setLoadingMembers(true);
      try {
        const result = await windmill.listFamilyMembers();
        if (result.success && result.members) {
          // Only show active members
          setFamilyMembers(result.members.filter(m => m.is_active));
        }
      } catch (err) {
        console.error('Failed to fetch family members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchFamilyMembers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setEnhancedResult(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    // Category is optional in enhanced mode (will be auto-detected)
    if (!enhancedMode && !category) {
      setError('Please select a category');
      return;
    }

    setIsUploading(true);

    try {
      if (enhancedMode) {
        // Use enhanced embedding with AI features
        const result: EmbedDocumentEnhancedResult = await windmill.embedDocumentEnhanced({
          title: title.trim(),
          content: content.trim(),
          tenant_id: tenantId,
          category: category as DocumentCategory || undefined,
          assigned_to: assignedTo || undefined,
          auto_categorize_enabled: autoCategorizaion,
          extract_tags_enabled: extractTags,
          extract_dates_enabled: extractDates,
        });

        // Check if this is a duplicate
        if (result.is_duplicate && result.existing_document) {
          setError(`Duplicate detected: This document already exists as "${result.existing_document.title}" (ID: ${result.existing_document.id})`);
          toast.error('Duplicate document', {
            description: `This content matches an existing document: "${result.existing_document.title}"`,
          });
          setIsUploading(false);
          return;
        }

        setEnhancedResult({
          suggestedCategory: result.suggested_category,
          categoryConfidence: result.category_confidence,
          tags: result.tags,
          expiryDates: result.expiry_dates,
          aiFeatures: result.ai_features_used,
        });

        const features = [];
        if (result.tags?.length) features.push(`${result.tags.length} tags`);
        if (result.expiry_dates?.length) features.push(`${result.expiry_dates.length} dates`);
        if (result.suggested_category) features.push(`category: ${result.suggested_category}`);

        setSuccess(`Document saved with AI enhancements: ${features.join(', ')}`);
        toast.success('Document uploaded', {
          description: `"${title}" processed with AI features.`,
        });
      } else {
        // Standard embedding
        const result = await windmill.embedDocument({
          title: title.trim(),
          content: content.trim(),
          category: category as DocumentCategory,
        });

        setSuccess(`Document "${result.message}" (ID: ${result.document_id})`);
        toast.success('Document uploaded', {
          description: `"${title}" has been added to the archive.`,
        });
      }

      setTitle('');
      setContent('');
      setCategory('');
      setAssignedTo(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onSuccess?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload document';
      setError(errorMsg);
      toast.error('Upload failed', {
        description: errorMsg,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleOCR = async (file: File) => {
    setIsOCRing(true);
    setOCRProgress({ status: 'Starting OCR...', progress: 0 });

    try {
      let ocrText = '';

      if (file.type === 'application/pdf') {
        // Extract PDF pages as images first
        setOCRProgress({ status: 'Extracting PDF pages...', progress: 10 });
        const pageImages = await extractPDFPagesAsImages(file, 10); // Max 10 pages

        // OCR each page
        const results: string[] = [];
        for (let i = 0; i < pageImages.length; i++) {
          setOCRProgress({
            status: `Processing page ${i + 1} of ${pageImages.length}...`,
            progress: 10 + (80 * (i + 1) / pageImages.length),
          });

          const result = await performOCR(pageImages[i]);
          if (result.success && result.text) {
            results.push(`--- Page ${i + 1} ---\n${result.text}`);
          }
        }
        ocrText = results.join('\n\n');
      } else {
        // Direct OCR on image
        const result = await performOCR(file, setOCRProgress);
        if (result.success && result.text) {
          ocrText = result.text;
        } else {
          throw new Error(result.error || 'OCR failed');
        }
      }

      if (ocrText) {
        setContent(ocrText);
        toast.success('OCR complete', {
          description: `Extracted ${ocrText.length} characters from scanned document.`,
        });
      } else {
        setError('No text could be extracted from the image');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'OCR failed';
      setError(errorMsg);
      toast.error('OCR failed', { description: errorMsg });
    } finally {
      setIsOCRing(false);
      setOCRProgress(null);
    }
  };

  const handleFileRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isTextFile = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md');
    const isImage = file.type.startsWith('image/');

    if (!isPDF && !isTextFile && !isImage) {
      setError('Supported formats: PDF, TXT, MD, or images (PNG, JPG, WEBP)');
      return;
    }

    // Handle images - direct OCR
    if (isImage) {
      setSelectedFile({ name: file.name, type: 'image' });
      if (!title) {
        setTitle(file.name.replace(/\.(png|jpg|jpeg|webp|gif|bmp)$/i, ''));
      }
      await handleOCR(file);
      return;
    }

    if (isPDF) {
      // Handle PDF files using client-side parsing
      setIsParsing(true);
      setSelectedFile({ name: file.name, type: 'pdf' });

      try {
        const result = await parsePDF(file);

        if (result.success && result.text) {
          // Check if PDF is likely scanned (very little text)
          if (isPDFLikelyScanned(result.text, result.pageCount || 1)) {
            // Offer OCR option
            setContent(result.text);
            setSelectedFile({ name: file.name, type: 'pdf (scanned?)', pageCount: result.pageCount });
            if (!title) {
              setTitle(file.name.replace(/\.pdf$/i, ''));
            }
            toast.info('Scanned PDF detected', {
              description: 'Limited text found. Click "Run OCR" to extract text from images.',
              action: {
                label: 'Run OCR',
                onClick: () => handleOCR(file),
              },
              duration: 10000,
            });
          } else {
            setContent(result.text);
            setSelectedFile({ name: file.name, type: 'pdf', pageCount: result.pageCount });
            if (!title) {
              setTitle(file.name.replace(/\.pdf$/i, ''));
            }
            toast.success('PDF parsed', {
              description: `Extracted text from ${result.pageCount} page${result.pageCount === 1 ? '' : 's'}.`,
            });
          }
        } else {
          setError(result.error || 'Failed to parse PDF');
          setSelectedFile(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse PDF');
        setSelectedFile(null);
      } finally {
        setIsParsing(false);
      }
    } else {
      // Handle text files
      setSelectedFile({ name: file.name, type: file.name.endsWith('.md') ? 'md' : 'txt' });
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContent(text);
        if (!title) {
          setTitle(file.name.replace(/\.(txt|md)$/i, ''));
        }
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setSelectedFile(null);
      };
      reader.readAsText(file);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setContent('');
    setEnhancedResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle camera capture
  const handleCameraCapture = async (file: File) => {
    setSelectedFile({ name: file.name, type: 'camera scan' });
    if (!title) {
      const timestamp = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setTitle(`Document scan - ${timestamp}`);
    }
    // Run OCR on the captured image
    await handleOCR(file);
    toast.success('Photo captured', {
      description: 'Running OCR to extract text...',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
          {enhancedMode && (
            <Badge variant="secondary" className="ml-2 gap-1">
              <Sparkles className="h-3 w-3" />
              AI Enhanced
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Add a new document to the Archevi knowledge base
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* AI Enhancement Toggle */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="enhanced-mode" className="font-medium">AI Enhanced Mode</Label>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          AI Enhanced Mode
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          When enabled, your document is processed by Archevi's AI to automatically:
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Categorize the document type</li>
                          <li>Extract relevant tags for better search</li>
                          <li>Detect expiry dates and deadlines</li>
                        </ul>
                        <p className="text-xs text-muted-foreground pt-1 border-t">
                          Click "Advanced AI Options" to customize which features are used.
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <p className="text-xs text-muted-foreground">Auto-categorize, extract tags & dates</p>
              </div>
            </div>
            <Switch
              id="enhanced-mode"
              checked={enhancedMode}
              onCheckedChange={setEnhancedMode}
            />
          </div>

          {/* Advanced AI Options */}
          {enhancedMode && (
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  Advanced AI Options
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="auto-cat">Auto-categorization</Label>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Auto-categorization</h4>
                          <p className="text-sm text-muted-foreground">
                            Uses AI to analyze your document and automatically assign it to the most appropriate category (insurance, medical, financial, etc.) with a confidence score.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Switch id="auto-cat" checked={autoCategorizaion} onCheckedChange={setAutoCategorization} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="extract-tags">Smart tag extraction</Label>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Smart Tag Extraction</h4>
                          <p className="text-sm text-muted-foreground">
                            AI scans your document for key topics, people, companies, and concepts, then generates relevant tags to make searching easier later.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Switch id="extract-tags" checked={extractTags} onCheckedChange={setExtractTags} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="extract-dates">Expiry date detection</Label>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Expiry Date Detection</h4>
                          <p className="text-sm text-muted-foreground">
                            Finds important dates in your document like policy expirations, renewal deadlines, and due dates. You'll get email reminders before they expire.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <Switch id="extract-dates" checked={extractDates} onCheckedChange={setExtractDates} />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400 rounded-md flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </div>
          )}

          {/* Enhanced Result Display */}
          {enhancedResult && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-md space-y-2">
              <div className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Analysis Results
              </div>
              {enhancedResult.suggestedCategory && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Category:</span>{' '}
                  <Badge variant="outline">{enhancedResult.suggestedCategory}</Badge>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({Math.round((enhancedResult.categoryConfidence || 0) * 100)}% confidence)
                  </span>
                </div>
              )}
              {enhancedResult.tags && enhancedResult.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-sm text-muted-foreground">Tags:</span>
                  {enhancedResult.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              {enhancedResult.expiryDates && enhancedResult.expiryDates.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Dates found:</span>{' '}
                  {enhancedResult.expiryDates.map((d, i) => (
                    <Badge key={i} variant="outline" className="ml-1 text-xs">
                      {d.type}: {d.date}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Grandma's Apple Pie Recipe"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Category
              {enhancedMode && <span className="text-xs text-muted-foreground ml-2">(optional - will auto-detect)</span>}
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as DocumentCategory)}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder={enhancedMode ? "Auto-detect or select..." : "Select a category"} />
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

          {/* Family Member Assignment */}
          {familyMembers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="assigned-to">
                  Assign to Family Member
                  <span className="text-xs text-muted-foreground ml-2">(optional)</span>
                </Label>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Family Member Assignment
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Assign this document to a specific family member for better organization.
                        Useful for medical records, school documents, or personal IDs.
                      </p>
                      <p className="text-xs text-muted-foreground pt-1 border-t">
                        You can filter documents by person in the Browse tab.
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <Select
                value={assignedTo?.toString() || 'none'}
                onValueChange={(v) => setAssignedTo(v === 'none' ? null : parseInt(v, 10))}
                disabled={isUploading || loadingMembers}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingMembers ? "Loading members..." : "Select a family member..."} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No assignment (general family document)</span>
                  </SelectItem>
                  {familyMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {member.name}
                        {member.role === 'admin' && (
                          <Badge variant="outline" className="text-xs ml-1">Admin</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Paste or type the document content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isUploading}
              rows={8}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileUp className="h-4 w-4 text-muted-foreground" />
              <Label
                htmlFor="file"
                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground"
              >
                Upload a file (PDF, TXT, MD, or images for OCR)
              </Label>
              <Input
                id="file"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.png,.jpg,.jpeg,.webp,.bmp,.gif"
                onChange={handleFileRead}
                disabled={isUploading || isParsing || isOCRing}
                className="hidden"
              />
              {/* Camera capture button - shown when device has camera */}
              {hasCamera && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCamera(true)}
                  disabled={isUploading || isParsing || isOCRing}
                  className="gap-1"
                >
                  <Camera className="h-4 w-4" />
                  <span className="hidden sm:inline">Scan</span>
                </Button>
              )}
            </div>

            {/* OCR Progress */}
            {isOCRing && ocrProgress && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ScanText className="h-4 w-4 animate-pulse" />
                  {ocrProgress.status}
                </div>
                <Progress value={ocrProgress.progress} className="h-2" />
              </div>
            )}

            {isParsing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing PDF...
              </div>
            )}
            {selectedFile && !isParsing && !isOCRing && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <FileText className="h-4 w-4" />
                <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedFile.type.toUpperCase()}
                  {selectedFile.pageCount && ` (${selectedFile.pageCount} pages)`}
                </Badge>
                {selectedFile.type.includes('scanned') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const file = fileInputRef.current?.files?.[0];
                      if (file) handleOCR(file);
                    }}
                    className="gap-1"
                  >
                    <ScanText className="h-3 w-3" />
                    Run OCR
                  </Button>
                )}
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
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isUploading || isParsing || isOCRing} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {enhancedMode ? 'Processing with AI...' : 'Uploading...'}
              </>
            ) : (
              <>
                {enhancedMode ? <Sparkles className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                {enhancedMode ? 'Upload with AI Enhancement' : 'Upload Document'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>

      {/* Camera capture dialog */}
      <CameraCapture
        open={showCamera}
        onOpenChange={setShowCamera}
        onCapture={handleCameraCapture}
      />
    </Card>
  );
}

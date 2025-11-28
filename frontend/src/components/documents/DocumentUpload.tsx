import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Upload, FileText, Loader2, CheckCircle2, FileUp, X } from 'lucide-react';
import { windmill, DOCUMENT_CATEGORIES, type DocumentCategory } from '@/api/windmill';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { parsePDF } from '@/lib/pdf-parser';

interface DocumentUploadProps {
  onSuccess?: () => void;
}

export function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<DocumentCategory | ''>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; type: string; pageCount?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }

    setIsUploading(true);

    try {
      const result = await windmill.embedDocument({
        title: title.trim(),
        content: content.trim(),
        category: category as DocumentCategory,
      });

      setSuccess(`Document "${result.message}" (ID: ${result.document_id})`);
      toast.success('Document uploaded', {
        description: `"${title}" has been added to the archive.`,
      });
      setTitle('');
      setContent('');
      setCategory('');
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

  const handleFileRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isTextFile = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md');

    if (!isPDF && !isTextFile) {
      setError('Supported formats: PDF, TXT, MD');
      return;
    }

    if (isPDF) {
      // Handle PDF files using client-side parsing
      setIsParsing(true);
      setSelectedFile({ name: file.name, type: 'pdf' });

      try {
        const result = await parsePDF(file);

        if (result.success && result.text) {
          setContent(result.text);
          setSelectedFile({ name: file.name, type: 'pdf', pageCount: result.pageCount });
          if (!title) {
            setTitle(file.name.replace(/\.pdf$/i, ''));
          }
          toast.success('PDF parsed', {
            description: `Extracted text from ${result.pageCount} page${result.pageCount === 1 ? '' : 's'}.`,
          });
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Document
        </CardTitle>
        <CardDescription>
          Add a new document to the Archevi knowledge base
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
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
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as DocumentCategory)}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
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
                Upload a file (PDF, TXT, or MD)
              </Label>
              <Input
                id="file"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                onChange={handleFileRead}
                disabled={isUploading || isParsing}
                className="hidden"
              />
            </div>
            {isParsing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing PDF...
              </div>
            )}
            {selectedFile && !isParsing && (
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <FileText className="h-4 w-4" />
                <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedFile.type.toUpperCase()}
                  {selectedFile.pageCount && ` (${selectedFile.pageCount} pages)`}
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
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isUploading || isParsing} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

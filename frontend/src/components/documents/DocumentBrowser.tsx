import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  FileText,
  Loader2,
  ChefHat,
  Stethoscope,
  CreditCard,
  Users,
  File,
  Shield,
  Receipt,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { windmill, DOCUMENT_CATEGORIES, type Document, type DocumentCategory } from '@/api/windmill';

const CATEGORY_ICONS: Record<DocumentCategory, React.ReactNode> = {
  recipes: <ChefHat className="h-4 w-4" />,
  medical: <Stethoscope className="h-4 w-4" />,
  financial: <CreditCard className="h-4 w-4" />,
  family_history: <Users className="h-4 w-4" />,
  general: <File className="h-4 w-4" />,
  insurance: <Shield className="h-4 w-4" />,
  invoices: <Receipt className="h-4 w-4" />,
};

interface DocumentCardProps {
  document: Document;
}

function DocumentCard({ document }: DocumentCardProps) {
  const icon = CATEGORY_ICONS[document.category] || <FileText className="h-4 w-4" />;
  const categoryLabel = DOCUMENT_CATEGORIES.find(c => c.value === document.category)?.label || document.category;

  const formattedDate = new Date(document.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const relevancePercent = Math.round(document.relevance_score * 100);

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {icon}
            <CardTitle className="text-sm font-medium truncate">
              {document.title}
            </CardTitle>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {categoryLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-xs line-clamp-3 mb-3">
          {document.content_preview}
        </CardDescription>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
          {document.relevance_score > 0 && (
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {relevancePercent}% match
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DocumentBrowser() {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    setError(null);
    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await windmill.searchDocuments({
        search_term: searchTerm.trim(),
        category: category === 'all' ? undefined : category,
        limit: 10,
      });
      setDocuments(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setDocuments([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Documents
          </CardTitle>
          <CardDescription>
            Find documents in the knowledge base using semantic search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search for recipes, medical info, financial docs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isSearching}
              />
            </div>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as DocumentCategory | 'all')}
              disabled={isSearching}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Search</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {hasSearched && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              {documents.length} {documents.length === 1 ? 'result' : 'results'} found
            </h3>
          </div>

          {documents.length === 0 ? (
            <Card className="py-12">
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-sm max-w-md">
                  Try a different search term or category, or upload some documents first.
                </p>
              </div>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-24rem)]">
              <div className="grid gap-3 md:grid-cols-2">
                {documents.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {!hasSearched && (
        <Card className="py-12">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
            <Search className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Search your knowledge base</h3>
            <p className="text-sm max-w-md">
              Enter a search term above to find documents. The search uses AI-powered
              semantic matching to find relevant content.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

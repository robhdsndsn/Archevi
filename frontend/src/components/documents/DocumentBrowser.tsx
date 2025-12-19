import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
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
  Pencil,
  Trash2,
  Eye,
  SlidersHorizontal,
  X,
  ChevronDown,
  HelpCircle,
  Scale,
  GraduationCap,
  User,
  RefreshCw,
} from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { windmill, DOCUMENT_CATEGORIES, type Document, type DocumentCategory, type FullDocument } from '@/api/windmill';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

const CATEGORY_ICONS: Record<DocumentCategory, React.ReactNode> = {
  recipes: <ChefHat className="h-4 w-4" />,
  medical: <Stethoscope className="h-4 w-4" />,
  financial: <CreditCard className="h-4 w-4" />,
  family_history: <Users className="h-4 w-4" />,
  general: <File className="h-4 w-4" />,
  insurance: <Shield className="h-4 w-4" />,
  invoices: <Receipt className="h-4 w-4" />,
  legal: <Scale className="h-4 w-4" />,
  education: <GraduationCap className="h-4 w-4" />,
  personal: <User className="h-4 w-4" />,
};

interface DocumentCardProps {
  document: Document;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number, title: string) => void;
}

function DocumentCard({ document, onView, onEdit, onDelete }: DocumentCardProps) {
  const icon = CATEGORY_ICONS[document.category] || <FileText className="h-4 w-4" />;
  const categoryLabel = DOCUMENT_CATEGORIES.find(c => c.value === document.category)?.label || document.category;

  const formattedDate = new Date(document.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const relevancePercent = Math.round(document.relevance_score * 100);

  return (
    <Card className="hover:bg-accent/50 transition-colors group">
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
      <CardContent className="space-y-3">
        <CardDescription className="text-xs line-clamp-3">
          {document.content_preview}
        </CardDescription>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </span>
          {document.relevance_score > 0 && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <span className="flex items-center gap-1 cursor-help">
                  <TrendingUp className="h-3 w-3" />
                  {relevancePercent}% match
                  <HelpCircle className="h-3 w-3 opacity-50" />
                </span>
              </HoverCardTrigger>
              <HoverCardContent className="w-64">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Relevance Score</h4>
                  <p className="text-sm text-muted-foreground">
                    This indicates how closely this document matches your search query using AI semantic similarity.
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>80%+</strong> - Highly relevant match</p>
                    <p><strong>50-79%</strong> - Moderately relevant</p>
                    <p><strong>Below 50%</strong> - Loosely related</p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
        {/* Action buttons - always visible on mobile, hover on desktop */}
        <div className="flex gap-1 pt-1 border-t opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 flex-1 sm:flex-none sm:h-8"
            onClick={() => onView(document.id)}
          >
            <Eye className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">View</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 flex-1 sm:flex-none sm:h-8"
            onClick={() => onEdit(document.id)}
          >
            <Pencil className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 flex-1 sm:flex-none sm:h-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(document.id, document.title)}
          >
            <Trash2 className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DocumentBrowser() {
  const { user } = useAuthStore();

  if (!user?.tenant_id) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to view documents.</p>
      </div>
    );
  }

  const tenantId = user.tenant_id;

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // View/Edit/Delete state
  const [viewDocument, setViewDocument] = useState<FullDocument | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDocument, setEditDocument] = useState<FullDocument | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: number; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<DocumentCategory>('general');

  const hasActiveFilters = dateFrom || dateTo || selectedTags.length > 0;

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedTags([]);
    setTagInput('');
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Allow search with just filters (no search term required if filters are active)
    if (!searchTerm.trim() && !hasActiveFilters && category === 'all') {
      setError('Please enter a search term or apply filters');
      return;
    }

    setError(null);
    setIsSearching(true);
    setHasSearched(true);

    try {
      // Use advanced search if filters are active
      if (hasActiveFilters) {
        const result = await windmill.advancedSearchDocuments({
          search_term: searchTerm.trim() || undefined,
          tenant_id: tenantId,
          category: category === 'all' ? undefined : category,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          limit: 20,
        });
        setDocuments(result.documents);
      } else {
        // Use simple search for basic queries
        const results = await windmill.searchDocuments({
          search_term: searchTerm.trim(),
          tenant_id: tenantId,
          category: category === 'all' ? undefined : category,
          limit: 20,
        });
        setDocuments(results);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setDocuments([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleView = async (id: number) => {
    setIsLoading(true);
    try {
      const result = await windmill.getDocument(id);
      if (result.success && result.document) {
        setViewDocument(result.document);
        setViewDialogOpen(true);
      } else {
        toast.error(result.error || 'Failed to load document');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (id: number) => {
    setIsLoading(true);
    try {
      const result = await windmill.getDocument(id);
      if (result.success && result.document) {
        setEditDocument(result.document);
        setEditTitle(result.document.title);
        setEditContent(result.document.content);
        setEditCategory(result.document.category);
        setEditDialogOpen(true);
      } else {
        toast.error(result.error || 'Failed to load document');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editDocument) return;

    setIsLoading(true);
    try {
      const result = await windmill.updateDocument({
        document_id: editDocument.id,
        title: editTitle !== editDocument.title ? editTitle : undefined,
        content: editContent !== editDocument.content ? editContent : undefined,
        category: editCategory !== editDocument.category ? editCategory : undefined,
      });

      if (result.success) {
        toast.success(result.message || 'Document updated');
        setEditDialogOpen(false);
        setEditDocument(null);
        // Refresh search results
        if (hasSearched && searchTerm) {
          handleSearch();
        }
      } else {
        toast.error(result.error || 'Failed to update document');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: number, title: string) => {
    setDocumentToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    setIsLoading(true);
    try {
      const result = await windmill.deleteDocument(documentToDelete.id);
      if (result.success) {
        toast.success(result.message || 'Document deleted');
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
        // Remove from local state
        setDocuments(docs => docs.filter(d => d.id !== documentToDelete.id));
      } else {
        toast.error(result.error || 'Failed to delete document');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Documents
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                Find documents in the knowledge base using semantic search
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Semantic Search</h4>
                      <p className="text-sm text-muted-foreground">
                        Unlike traditional keyword search, semantic search understands the meaning of your query. It can find documents that are conceptually related even if they don't contain the exact words you typed.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        For example, searching "car insurance" will also find documents about "auto coverage" or "vehicle policy".
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  {(dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + selectedTags.length}
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {/* Advanced Filters */}
          <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
            <CollapsibleContent className="space-y-4 pt-4 border-t">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label htmlFor="date-from" className="text-sm font-medium">From Date</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    disabled={isSearching}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-to" className="text-sm font-medium">To Date</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    disabled={isSearching}
                  />
                </div>

                {/* Tags Filter */}
                <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                  <Label htmlFor="tags" className="text-sm font-medium">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      placeholder="Add tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                      disabled={isSearching}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => addTag(tagInput)}
                      disabled={isSearching || !tagInput.trim()}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear all filters
                  </Button>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md flex items-center justify-between gap-2">
          <span>{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearch}
            className="shrink-0"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
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
              <div className="grid gap-3 sm:grid-cols-2">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
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

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewDocument && CATEGORY_ICONS[viewDocument.category]}
              {viewDocument?.title}
            </DialogTitle>
            <DialogDescription>
              {viewDocument && (
                <Badge variant="secondary" className="mt-1">
                  {DOCUMENT_CATEGORIES.find(c => c.value === viewDocument.category)?.label}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh] mt-4">
            <div className="whitespace-pre-wrap text-sm">
              {viewDocument?.content}
            </div>
          </ScrollArea>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="text-xs text-muted-foreground">
              {viewDocument?.created_at && (
                <span>Created: {new Date(viewDocument.created_at).toLocaleDateString()}</span>
              )}
              {viewDocument?.updated_at && viewDocument.updated_at !== viewDocument.created_at && (
                <span className="ml-4">Updated: {new Date(viewDocument.updated_at).toLocaleDateString()}</span>
              )}
            </div>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Make changes to your document. Content changes will update the AI search index.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Document title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={editCategory} onValueChange={(v) => setEditCategory(v as DocumentCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Document content"
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

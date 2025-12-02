import { useState, useEffect } from 'react';
import { windmill, type Document, type DocumentCategory, type FamilyMember, DOCUMENT_CATEGORIES } from '@/api/windmill';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  FileText,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  List,
  FileIcon,
  FileImage,
  FileSpreadsheet,
  Receipt,
  GraduationCap,
  Heart,
  Scale,
  Home,
  Briefcase,
  Calendar,
  Tag,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import type { FullDocument } from '@/api/windmill';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Default tenant for MVP
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

const ITEMS_PER_PAGE = 20;

// Category visual configuration
const CATEGORY_CONFIG: Record<string, { icon: typeof FileText; color: string; bgColor: string }> = {
  financial: { icon: Receipt, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950' },
  medical: { icon: Heart, color: 'text-rose-600', bgColor: 'bg-rose-50 dark:bg-rose-950' },
  legal: { icon: Scale, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950' },
  education: { icon: GraduationCap, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950' },
  property: { icon: Home, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950' },
  employment: { icon: Briefcase, color: 'text-cyan-600', bgColor: 'bg-cyan-50 dark:bg-cyan-950' },
  general: { icon: FileText, color: 'text-slate-600', bgColor: 'bg-slate-50 dark:bg-slate-950' },
};

// Document preview component that shows a visual representation
function DocumentPreview({ document, className }: { document: FullDocument; className?: string }) {
  const config = CATEGORY_CONFIG[document.category] || CATEGORY_CONFIG.general;
  const CategoryIcon = config.icon;

  // Extract first few lines for the skeleton preview
  const lines = document.content.split('\n').filter(line => line.trim()).slice(0, 12);

  return (
    <div className={`relative rounded-lg border-2 overflow-hidden ${config.bgColor} ${className}`}>
      {/* Document header */}
      <div className="bg-white dark:bg-zinc-900 border-b px-4 py-3 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${config.bgColor}`}>
          <CategoryIcon className={`h-6 w-6 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{document.title}</h4>
          <p className="text-xs text-muted-foreground capitalize">{document.category.replace(/_/g, ' ')}</p>
        </div>
      </div>

      {/* Document body - skeleton text preview */}
      <div className="p-4 space-y-2 bg-white/80 dark:bg-zinc-900/80">
        {lines.map((line, i) => {
          // Vary the width to make it look like real document lines
          const width = Math.min(100, 40 + (line.length % 60));
          return (
            <div
              key={i}
              className="h-3 rounded bg-zinc-200 dark:bg-zinc-700"
              style={{ width: `${width}%`, opacity: 1 - (i * 0.05) }}
            />
          );
        })}
        {lines.length === 0 && (
          <>
            <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-700 w-[90%]" />
            <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-700 w-[75%]" />
            <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-700 w-[85%]" />
            <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-700 w-[60%]" />
          </>
        )}
      </div>

      {/* Document footer with metadata */}
      <div className="bg-white dark:bg-zinc-900 border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {document.created_at ? new Date(document.created_at).toLocaleDateString() : 'Unknown date'}
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {document.content.length.toLocaleString()} chars
        </div>
      </div>
    </div>
  );
}

export function FamilyDocumentsList() {
  const { user } = useAuthStore();
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'created_at' | 'title' | 'category'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Family members for filtering
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Document actions state
  const [viewDocument, setViewDocument] = useState<FullDocument | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDocument, setEditDocument] = useState<FullDocument | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: number; title: string } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<DocumentCategory>('general');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await windmill.advancedSearchDocuments({
        search_term: searchTerm || undefined,
        tenant_id: tenantId,
        category: (selectedCategory || undefined) as DocumentCategory | undefined,
        assigned_to: selectedPerson || undefined,
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE,
      });

      // Sort locally since advancedSearch doesn't support sorting
      let sortedDocs = [...result.documents];
      sortedDocs.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'created_at') {
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else if (sortBy === 'title') {
          comparison = a.title.localeCompare(b.title);
        } else if (sortBy === 'category') {
          comparison = a.category.localeCompare(b.category);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      setDocuments(sortedDocs);
      setTotal(result.total);
      setHasMore(result.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [page, tenantId]);

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

  const handleSearch = () => {
    setPage(1);
    loadDocuments();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = () => {
    setPage(1);
    loadDocuments();
  };

  const toggleSort = (field: 'created_at' | 'title' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Sort effect
  useEffect(() => {
    if (documents.length > 0) {
      let sortedDocs = [...documents];
      sortedDocs.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'created_at') {
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        } else if (sortBy === 'title') {
          comparison = a.title.localeCompare(b.title);
        } else if (sortBy === 'category') {
          comparison = a.category.localeCompare(b.category);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      setDocuments(sortedDocs);
    }
  }, [sortBy, sortOrder]);

  const handleView = async (id: number) => {
    setIsActionLoading(true);
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
      setIsActionLoading(false);
    }
  };

  const handleEdit = async (id: number) => {
    setIsActionLoading(true);
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
      setIsActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editDocument) return;

    setIsActionLoading(true);
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
        loadDocuments();
      } else {
        toast.error(result.error || 'Failed to update document');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update document');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteClick = (id: number, title: string) => {
    setDocumentToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;

    setIsActionLoading(true);
    try {
      const result = await windmill.deleteDocument(documentToDelete.id);
      if (result.success) {
        toast.success(result.message || 'Document deleted');
        setDeleteDialogOpen(false);
        setDocumentToDelete(null);
        loadDocuments();
      } else {
        toast.error(result.error || 'Failed to delete document');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setIsActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              All Family Documents
            </CardTitle>
            <CardDescription>
              Browse and manage all documents in your family vault ({total} total)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadDocuments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={selectedCategory || "all"} onValueChange={(v) => { setSelectedCategory(v === "all" ? "" : v); handleFilterChange(); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Categories" />
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

          {/* Person Filter */}
          {familyMembers.length > 0 && (
            <Select
              value={selectedPerson?.toString() || "all"}
              onValueChange={(v) => { setSelectedPerson(v === "all" ? null : parseInt(v, 10)); handleFilterChange(); }}
              disabled={loadingMembers}
            >
              <SelectTrigger className="w-[150px]">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={loadingMembers ? "Loading..." : "All People"} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All People</SelectItem>
                {familyMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 border border-destructive rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* Table */}
        {loading && documents.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No documents yet</h3>
            <p className="text-sm">Upload your first document to get started.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => toggleSort('title')}
                    >
                      Title
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => toggleSort('category')}
                    >
                      Category
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => toggleSort('created_at')}
                    >
                      Created
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="max-w-[300px]">
                        <p className="font-medium truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.content_preview}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {doc.category.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {doc.created_at
                        ? new Date(doc.created_at).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(doc.id)}
                          disabled={isActionLoading}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(doc.id)}
                          disabled={isActionLoading}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(doc.id, doc.title)}
                          disabled={isActionLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm">
                Page {page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore || loading}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* View Document Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {viewDocument?.title}
            </DialogTitle>
          </DialogHeader>

          {viewDocument && (
            <Tabs defaultValue="preview" className="mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="content" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Full Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="preview" className="mt-4">
                <DocumentPreview document={viewDocument} className="max-w-md mx-auto" />
              </TabsContent>

              <TabsContent value="content" className="mt-4">
                <ScrollArea className="h-[50vh] rounded-lg border p-4 bg-muted/30">
                  <div className="whitespace-pre-wrap text-sm font-mono">
                    {viewDocument.content}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <div className="flex-1 text-xs text-muted-foreground">
              {viewDocument?.created_at && (
                <span>Created: {new Date(viewDocument.created_at).toLocaleDateString()}</span>
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
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isActionLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isActionLoading}>
              {isActionLoading ? (
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
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading ? (
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
    </Card>
  );
}

export default FamilyDocumentsList;

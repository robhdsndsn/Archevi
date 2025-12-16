import { useState, useEffect } from 'react';
import { windmill, type Document, type DocumentCategory, type DocumentVisibility, type FamilyMember, DOCUMENT_CATEGORIES, DOCUMENT_VISIBILITY } from '@/api/windmill';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  FileText,
  Search,
  Loader2,
  ArrowUpDown,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  List,
  LayoutGrid,
  Receipt,
  GraduationCap,
  Heart,
  Scale,
  Home,
  Briefcase,
  Calendar as CalendarIcon,
  User,
  Globe,
  Users,
  Shield,
  Lock,
  SlidersHorizontal,
  X,
  ChevronDown,
  Sparkles,
  Link2,
  History,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import type { FullDocument } from '@/api/windmill';
import { ExtractedDataDisplay } from './ExtractedDataDisplay';
import { RelatedDocuments } from './RelatedDocuments';
import { VersionHistory } from './VersionHistory';
import { SecureLinkDialog } from './SecureLinkDialog';
import { TextToSpeech } from '@/components/audio';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { MemberAvatar } from '@/components/ui/member-avatar';

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

// Visibility visual configuration
const VISIBILITY_CONFIG: Record<string, { icon: typeof Globe; color: string; label: string }> = {
  everyone: { icon: Globe, color: 'text-green-600', label: 'Everyone' },
  adults_only: { icon: Users, color: 'text-amber-600', label: 'Adults' },
  admins_only: { icon: Shield, color: 'text-blue-600', label: 'Admins' },
  private: { icon: Lock, color: 'text-rose-600', label: 'Private' },
};

// Document preview component that shows a visual representation
function DocumentPreview({ document, className }: { document: FullDocument; className?: string }) {
  const config = CATEGORY_CONFIG[document.category] || CATEGORY_CONFIG.general;
  const CategoryIcon = config.icon;

  // Check if this is an image document
  const isImageDocument = document.content_type === 'image' || document.content_type === 'mixed';
  const hasImage = isImageDocument && document.image_url;

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
          <p className="text-xs text-muted-foreground capitalize">
            {document.category.replace(/_/g, ' ')}
            {isImageDocument && <span className="ml-2 text-blue-500">(Image)</span>}
          </p>
        </div>
      </div>

      {/* Document body - show image or skeleton text preview */}
      <div className="p-4 bg-white/80 dark:bg-zinc-900/80">
        {hasImage ? (
          <div className="flex justify-center">
            <img
              src={document.image_url!}
              alt={document.title}
              className="max-w-full max-h-[400px] object-contain rounded-lg shadow-sm"
            />
          </div>
        ) : (
          <div className="space-y-2">
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
        )}
      </div>

      {/* Document footer with metadata */}
      <div className="bg-white dark:bg-zinc-900 border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" />
          {document.created_at ? new Date(document.created_at).toLocaleDateString() : 'Unknown date'}
        </div>
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          {document.content.length.toLocaleString()} chars
          {document.has_image_embedding && <span className="ml-1 text-blue-500">(+image)</span>}
        </div>
      </div>
    </div>
  );
}

// Quick preview component for hover cards - uses content_preview from list data
function QuickPreview({ document }: { document: Document }) {
  const config = CATEGORY_CONFIG[document.category] || CATEGORY_CONFIG.general;
  const CategoryIcon = config.icon;
  const visConfig = VISIBILITY_CONFIG[document.visibility || 'everyone'];
  const VisIcon = visConfig.icon;

  return (
    <div className="w-full overflow-hidden">
      {/* Header with icon and category */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg shrink-0 ${config.bgColor}`}>
          <CategoryIcon className={`h-5 w-5 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <h4 className="font-semibold text-sm leading-tight truncate">{document.title}</h4>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="capitalize text-xs shrink-0">
              {document.category.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="outline" className={`gap-1 text-xs shrink-0 ${visConfig.color}`}>
              <VisIcon className="h-3 w-3" />
              {visConfig.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content preview */}
      <div className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-4 break-words overflow-hidden">
        {document.content_preview || 'No preview available'}
      </div>

      {/* Footer metadata */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1 shrink-0">
          <CalendarIcon className="h-3 w-3" />
          {document.created_at ? new Date(document.created_at).toLocaleDateString() : 'Unknown'}
        </div>
        {document.assigned_to_name && (
          <div className="flex items-center gap-1 truncate ml-2">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{document.assigned_to_name}</span>
          </div>
        )}
      </div>

      {/* Hint to click */}
      <div className="text-xs text-primary mt-2 flex items-center gap-1">
        <Eye className="h-3 w-3" />
        Click to view full document
      </div>
    </div>
  );
}

interface FamilyDocumentsListProps {
  openDocumentId?: number | null;
  onDocumentOpened?: () => void;
}

export function FamilyDocumentsList({ openDocumentId, onDocumentOpened }: FamilyDocumentsListProps) {
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
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

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

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Secure link dialog state
  const [secureLinkDoc, setSecureLinkDoc] = useState<{ id: number; title: string } | null>(null);
  const [secureLinkDialogOpen, setSecureLinkDialogOpen] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Mobile detection for responsive drawer/dialog
  const [isMobile, setIsMobile] = useState(false);
  
  // Filter panel collapsed state
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<DocumentCategory>('general');
  const [editAssignedTo, setEditAssignedTo] = useState<number | null>(null);
  const [editVisibility, setEditVisibility] = useState<DocumentVisibility>('everyone');

  // Open document when openDocumentId prop changes
  useEffect(() => {
    if (openDocumentId && !loading) {
      // Use setTimeout to ensure component is fully mounted
      const timer = setTimeout(() => {
        handleView(openDocumentId);
        onDocumentOpened?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [openDocumentId, loading]);

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
        // Visibility filtering - pass user's member_type and member_id
        user_member_type: user?.member_type,
        user_member_id: user?.member_id,
      });

      // Filter by date range locally
      let filteredDocs = result.documents;
      if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        filteredDocs = filteredDocs.filter(doc => {
          const docDate = new Date(doc.created_at);
          return docDate >= fromDate;
        });
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        filteredDocs = filteredDocs.filter(doc => {
          const docDate = new Date(doc.created_at);
          return docDate <= toDate;
        });
      }

      // Sort locally since advancedSearch doesn't support sorting
      let sortedDocs = [...filteredDocs];
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
        setEditAssignedTo(result.document.assigned_to ?? null);
        setEditVisibility(result.document.visibility || 'everyone');
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
      // Determine if assigned_to changed
      const originalAssignedTo = editDocument.assigned_to ?? null;
      const newAssignedTo = editAssignedTo;
      const assignedToChanged = originalAssignedTo !== newAssignedTo;

      const result = await windmill.updateDocument({
        document_id: editDocument.id,
        title: editTitle !== editDocument.title ? editTitle : undefined,
        content: editContent !== editDocument.content ? editContent : undefined,
        category: editCategory !== editDocument.category ? editCategory : undefined,
        // Only send assigned_to if it changed
        ...(assignedToChanged && newAssignedTo !== null ? { assigned_to: newAssignedTo } : {}),
        ...(assignedToChanged && newAssignedTo === null ? { clear_assigned_to: true } : {}),
        // Only send visibility if it changed
        visibility: editVisibility !== (editDocument.visibility || 'everyone') ? editVisibility : undefined,
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

  // Bulk selection handlers
  const isAllSelected = documents.length > 0 && documents.every(doc => selectedIds.has(doc.id));
  const isSomeSelected = documents.some(doc => selectedIds.has(doc.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(documents.map(doc => doc.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsActionLoading(true);
    const idsToDelete = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;

    for (const id of idsToDelete) {
      try {
        const result = await windmill.deleteDocument(id);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsActionLoading(false);
    setBulkDeleteDialogOpen(false);
    setSelectedIds(new Set());

    if (successCount > 0) {
      toast.success(`Deleted ${successCount} document${successCount > 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} document${failCount > 1 ? 's' : ''}`);
    }

    loadDocuments();
  };

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
          <Button variant="outline" size="sm" onClick={loadDocuments} disabled={loading} aria-label="Refresh document list">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Compact Filter Bar */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="flex-1 max-w-sm relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 h-9"
            />
          </div>

          {/* Filters Toggle Button */}
          <Button
            variant={filtersOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(selectedCategory || selectedPerson || dateRange.from || dateRange.to) && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {[selectedCategory, selectedPerson, dateRange.from || dateRange.to].filter(Boolean).length}
              </Badge>
            )}
            <ChevronDown className={`h-3 w-3 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </Button>

          {/* View Mode Toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as 'list' | 'grid')}
            size="sm"
          >
            <ToggleGroupItem value="list" aria-label="List view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Collapsible Filter Panel */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent className="space-y-3">
            <div className="flex flex-wrap gap-3 p-3 bg-muted/50 rounded-lg border">
              {/* Category Filter */}
              <Select value={selectedCategory || "all"} onValueChange={(v) => { setSelectedCategory(v === "all" ? "" : v); handleFilterChange(); }}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
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

              {/* Person Filter */}
              {familyMembers.length > 0 && (
                <Select
                  value={selectedPerson?.toString() || "all"}
                  onValueChange={(v) => { setSelectedPerson(v === "all" ? null : parseInt(v, 10)); handleFilterChange(); }}
                  disabled={loadingMembers}
                >
                  <SelectTrigger className="w-[140px] h-8 text-sm">
                    <SelectValue placeholder="Person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All People</SelectItem>
                    {familyMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        <div className="flex items-center gap-2">
                          <MemberAvatar name={member.name} size="xs" showTooltip={false} />
                          {member.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Date Range */}
              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  className="w-[120px] h-8 text-sm"
                  value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    setDateRange(prev => ({ ...prev, from: date }));
                  }}
                />
                <span className="text-muted-foreground text-sm">to</span>
                <Input
                  type="date"
                  className="w-[120px] h-8 text-sm"
                  value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    setDateRange(prev => ({ ...prev, to: date }));
                  }}
                />
              </div>

              {/* Apply & Clear */}
              <div className="flex gap-2 ml-auto">
                {(selectedCategory || selectedPerson || dateRange.from || dateRange.to) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      setSelectedCategory('');
                      setSelectedPerson(null);
                      setDateRange({ from: undefined, to: undefined });
                      handleFilterChange();
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
                <Button size="sm" className="h-8" onClick={handleSearch} disabled={loading}>
                  Apply
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Active Filter Chips */}
        {(selectedCategory || selectedPerson || dateRange.from || dateRange.to) && !filtersOpen && (
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {DOCUMENT_CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => { setSelectedCategory(''); handleFilterChange(); }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {selectedPerson && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {familyMembers.find(m => m.id === selectedPerson)?.name || 'Person'}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => { setSelectedPerson(null); handleFilterChange(); }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {(dateRange.from || dateRange.to) && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {dateRange.from ? format(dateRange.from, 'MMM d') : '...'} - {dateRange.to ? format(dateRange.to, 'MMM d') : '...'}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => { setDateRange({ from: undefined, to: undefined }); handleFilterChange(); }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedIds.size} document{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear Selection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 border border-destructive rounded-lg text-destructive flex items-center justify-between gap-2">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDocuments}
              className="shrink-0"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Documents Display */}
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
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <ScrollArea className="h-[500px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {documents.map((doc) => {
                const config = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.general;
                const CategoryIcon = config.icon;
                return (
                  <ContextMenu key={doc.id}>
                    <ContextMenuTrigger>
                      <Card
                        className={`cursor-pointer hover:shadow-md transition-shadow ${
                          selectedIds.has(doc.id) ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleSelectOne(doc.id, !selectedIds.has(doc.id))}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${config.bgColor}`}>
                              <CategoryIcon className={`h-5 w-5 ${config.color}`} />
                            </div>
                            <HoverCard openDelay={400} closeDelay={100}>
                              <HoverCardTrigger asChild>
                                <div
                                  className="flex-1 min-w-0 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleView(doc.id);
                                  }}
                                >
                                  <CardTitle className="text-sm font-medium truncate hover:text-primary transition-colors">
                                    {doc.title}
                                  </CardTitle>
                                  <CardDescription className="text-xs mt-1 line-clamp-2">
                                    {doc.content_preview}
                                  </CardDescription>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent side="right" align="start" className="w-80 p-4 hidden sm:block">
                                <QuickPreview document={doc} />
                              </HoverCardContent>
                            </HoverCard>
                            <Checkbox
                              checked={selectedIds.has(doc.id)}
                              onCheckedChange={(checked) => handleSelectOne(doc.id, checked as boolean)}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Select ${doc.title}`}
                            />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <Badge variant="secondary" className="capitalize text-xs">
                              {doc.category.replace(/_/g, ' ')}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {doc.created_at
                                ? new Date(doc.created_at).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Visibility Badge */}
                            {(() => {
                              const visConfig = VISIBILITY_CONFIG[doc.visibility || 'everyone'];
                              const VisIcon = visConfig.icon;
                              return (
                                <Badge variant="outline" className={`gap-1 text-xs ${visConfig.color}`}>
                                  <VisIcon className="h-3 w-3" />
                                  {visConfig.label}
                                </Badge>
                              );
                            })()}
                            {/* Assigned To Avatar */}
                            {doc.assigned_to_name && (
                              <MemberAvatar name={doc.assigned_to_name} size="xs" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleView(doc.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Document
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleEdit(doc.id)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Document
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => {
                        setSecureLinkDoc({ id: doc.id, title: doc.title });
                        setSecureLinkDialogOpen(true);
                      }}>
                        <Link2 className="h-4 w-4 mr-2" />
                        Create Secure Link
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem
                        onClick={() => handleDeleteClick(doc.id, doc.title)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Document
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          /* List View (Table) - Compact Design */
          <ScrollArea className="h-[450px]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[32px] px-2">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all documents"
                      className={isSomeSelected && !isAllSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                    />
                  </TableHead>
                  <TableHead className="pl-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-7 text-xs"
                      onClick={() => toggleSort('title')}
                    >
                      Document
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px] hidden sm:table-cell">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-7 text-xs"
                      onClick={() => toggleSort('created_at')}
                    >
                      Date
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[80px] text-right pr-2">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const config = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.general;
                  const CategoryIcon = config.icon;
                  const visConfig = VISIBILITY_CONFIG[doc.visibility || 'everyone'];
                  const VisIcon = visConfig.icon;

                  return (
                    <ContextMenu key={doc.id}>
                      <ContextMenuTrigger asChild>
                        <TableRow
                          className={`group cursor-pointer ${selectedIds.has(doc.id) ? 'bg-muted/50' : ''}`}
                          onClick={() => handleView(doc.id)}
                        >
                          <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.has(doc.id)}
                              onCheckedChange={(checked) => handleSelectOne(doc.id, checked as boolean)}
                              aria-label={`Select ${doc.title}`}
                            />
                          </TableCell>
                          <TableCell className="pl-0 py-2">
                            <div className="flex items-center gap-3">
                              {/* Category Icon */}
                              <div className={`p-1.5 rounded ${config.bgColor} shrink-0`}>
                                <CategoryIcon className={`h-4 w-4 ${config.color}`} />
                              </div>
                              {/* Title & Metadata */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                    {doc.title}
                                  </p>
                                  {/* Visibility Icon - only show if not "everyone" */}
                                  {doc.visibility && doc.visibility !== 'everyone' && (
                                    <VisIcon className={`h-3 w-3 shrink-0 ${visConfig.color}`} aria-label={visConfig.label} />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="capitalize">{doc.category.replace(/_/g, ' ')}</span>
                                  {doc.assigned_to_name && (
                                    <>
                                      <span>·</span>
                                      <span className="truncate">{doc.assigned_to_name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                            {doc.created_at
                              ? new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right pr-2" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleEdit(doc.id)}
                                disabled={isActionLoading}
                                aria-label={`Edit ${doc.title}`}
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteClick(doc.id, doc.title)}
                                disabled={isActionLoading}
                                aria-label={`Delete ${doc.title}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => handleView(doc.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Document
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleEdit(doc.id)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Document
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => {
                          setSecureLinkDoc({ id: doc.id, title: doc.title });
                          setSecureLinkDialogOpen(true);
                        }}>
                          <Link2 className="h-4 w-4 mr-2" />
                          Create Secure Link
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onClick={() => handleDeleteClick(doc.id, doc.title)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Document
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, total)} of {total}
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => !loading && page > 1 && setPage(p => p - 1)}
                    className={page === 1 || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>

                {/* First page */}
                {page > 2 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setPage(1)} className="cursor-pointer">
                      1
                    </PaginationLink>
                  </PaginationItem>
                )}

                {/* Ellipsis before current */}
                {page > 3 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {/* Previous page */}
                {page > 1 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setPage(page - 1)} className="cursor-pointer">
                      {page - 1}
                    </PaginationLink>
                  </PaginationItem>
                )}

                {/* Current page */}
                <PaginationItem>
                  <PaginationLink isActive className="cursor-default">
                    {page}
                  </PaginationLink>
                </PaginationItem>

                {/* Next page */}
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setPage(page + 1)} className="cursor-pointer">
                      {page + 1}
                    </PaginationLink>
                  </PaginationItem>
                )}

                {/* Ellipsis after current */}
                {page < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                {/* Last page */}
                {page < totalPages - 1 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => setPage(totalPages)} className="cursor-pointer">
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => !loading && hasMore && setPage(p => p + 1)}
                    className={!hasMore || loading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>

      {/* View Document - Drawer on Mobile, Dialog on Desktop */}
      {isMobile ? (
        <Drawer open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {viewDocument?.title}
              </DrawerTitle>
              <DrawerDescription>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  {viewDocument?.category && (
                    <Badge variant="secondary" className="capitalize">
                      {viewDocument.category.replace(/_/g, ' ')}
                    </Badge>
                  )}
                  {viewDocument && (() => {
                    const visConfig = VISIBILITY_CONFIG[viewDocument.visibility || 'everyone'];
                    const VisIcon = visConfig.icon;
                    return (
                      <Badge variant="outline" className={`gap-1 ${visConfig.color}`}>
                        <VisIcon className="h-3 w-3" />
                        {visConfig.label}
                      </Badge>
                    );
                  })()}
                  {viewDocument?.assigned_to_name && (
                    <MemberAvatar name={viewDocument.assigned_to_name} size="sm" />
                  )}
                </div>
              </DrawerDescription>
            </DrawerHeader>

            {viewDocument && (
              <div className="px-4 pb-4">
                <Tabs defaultValue="preview">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="preview" className="gap-1 text-xs">
                      <Eye className="h-3 w-3" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="data" className="gap-1 text-xs">
                      <Sparkles className="h-3 w-3" />
                      Data
                    </TabsTrigger>
                    <TabsTrigger value="content" className="gap-1 text-xs">
                      <FileText className="h-3 w-3" />
                      Text
                    </TabsTrigger>
                    <TabsTrigger value="related" className="gap-1 text-xs">
                      <Link2 className="h-3 w-3" />
                      Related
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-1 text-xs">
                      <History className="h-3 w-3" />
                      History
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="preview" className="mt-4">
                    <DocumentPreview document={viewDocument} className="max-w-full" />
                  </TabsContent>

                  <TabsContent value="data" className="mt-4">
                    <ScrollArea className="h-[40vh] rounded-lg border p-4 bg-muted/30">
                      <ExtractedDataDisplay
                        data={viewDocument.extracted_data}
                        category={viewDocument.category}
                        documentId={viewDocument.id}
                        tenantId={tenantId}
                        onExtract={(extractedData) => {
                          setViewDocument(prev => prev ? { ...prev, extracted_data: extractedData } : null);
                        }}
                      />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="content" className="mt-4 space-y-3">
                    {/* Text-to-Speech - Compact for mobile */}
                    {viewDocument.content && (
                      <TextToSpeech
                        text={viewDocument.content}
                        title={viewDocument.title}
                        compact
                        maxChars={5000}
                      />
                    )}

                    <ScrollArea className="h-[35vh] rounded-lg border p-4 bg-muted/30">
                      <div className="whitespace-pre-wrap text-sm font-mono">
                        {viewDocument.content}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="related" className="mt-4">
                    <ScrollArea className="h-[40vh]">
                      <RelatedDocuments
                        documentId={viewDocument.id}
                        onDocumentSelect={(docId) => {
                          setViewDialogOpen(false);
                          handleView(docId);
                        }}
                        compact
                      />
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="history" className="mt-4">
                    <ScrollArea className="h-[40vh]">
                      <VersionHistory
                        documentId={String(viewDocument.id)}
                        onVersionRestored={() => {
                          // Refresh document after rollback
                          handleView(viewDocument.id);
                        }}
                        compact
                      />
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            <DrawerFooter className="pt-2">
              <div className="flex items-center justify-between w-full">
                <div className="text-xs text-muted-foreground">
                  {viewDocument?.created_at && (
                    <span>Created: {new Date(viewDocument.created_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewDialogOpen(false);
                      if (viewDocument) handleEdit(viewDocument.id);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="secondary" size="sm">Close</Button>
                  </DrawerClose>
                </div>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {viewDocument?.title}
              </DialogTitle>
              <DialogDescription>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  {viewDocument?.category && (
                    <Badge variant="secondary" className="capitalize">
                      {viewDocument.category.replace(/_/g, ' ')}
                    </Badge>
                  )}
                  {viewDocument && (() => {
                    const visConfig = VISIBILITY_CONFIG[viewDocument.visibility || 'everyone'];
                    const VisIcon = visConfig.icon;
                    return (
                      <Badge variant="outline" className={`gap-1 ${visConfig.color}`}>
                        <VisIcon className="h-3 w-3" />
                        {visConfig.label}
                      </Badge>
                    );
                  })()}
                  {viewDocument?.assigned_to_name && (
                    <MemberAvatar name={viewDocument.assigned_to_name} size="sm" />
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            {viewDocument && (
              <Tabs defaultValue="preview" className="mt-2">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="preview" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="data" className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Data
                  </TabsTrigger>
                  <TabsTrigger value="content" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="related" className="gap-2">
                    <Link2 className="h-4 w-4" />
                    Related
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-2">
                    <History className="h-4 w-4" />
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-4">
                  <DocumentPreview document={viewDocument} className="max-w-md mx-auto" />
                </TabsContent>

                <TabsContent value="data" className="mt-4">
                  <ScrollArea className="h-[50vh] rounded-lg border p-4 bg-muted/30">
                    <ExtractedDataDisplay
                      data={viewDocument.extracted_data}
                      category={viewDocument.category}
                      documentId={viewDocument.id}
                      tenantId={tenantId}
                      onExtract={(extractedData) => {
                        setViewDocument(prev => prev ? { ...prev, extracted_data: extractedData } : null);
                      }}
                    />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="content" className="mt-4 space-y-4">
                  {/* Text-to-Speech Controls */}
                  {viewDocument.content && (
                    <TextToSpeech
                      text={viewDocument.content}
                      title={viewDocument.title}
                      maxChars={5000}
                    />
                  )}

                  <ScrollArea className="h-[40vh] rounded-lg border p-4 bg-muted/30">
                    <div className="whitespace-pre-wrap text-sm font-mono">
                      {viewDocument.content}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="related" className="mt-4">
                  <ScrollArea className="h-[50vh]">
                    <RelatedDocuments
                      documentId={viewDocument.id}
                      onDocumentSelect={(docId) => {
                        setViewDialogOpen(false);
                        handleView(docId);
                      }}
                    />
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <ScrollArea className="h-[50vh]">
                    <VersionHistory
                      documentId={String(viewDocument.id)}
                      onVersionRestored={() => {
                        // Refresh document after rollback
                        handleView(viewDocument.id);
                      }}
                    />
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
      )}

      {/* Edit Document Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              Make changes to your document. Content changes will update the AI search index.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6 custom-scrollbar">
            <div className="space-y-4 py-4 pr-2">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Document title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="edit-assigned-to">Assigned To</Label>
                  <Select
                    value={editAssignedTo?.toString() || "none"}
                    onValueChange={(v) => setEditAssignedTo(v === "none" ? null : parseInt(v, 10))}
                  >
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select person" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No one (unassigned)</SelectItem>
                      {familyMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          <div className="flex items-center gap-2">
                            <MemberAvatar name={member.name} size="xs" showTooltip={false} />
                            {member.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-visibility">Visibility</Label>
                <TooltipProvider>
                  <Select
                    value={editVisibility}
                    onValueChange={(v) => setEditVisibility(v as DocumentVisibility)}
                  >
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Who can see this?" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_VISIBILITY.map((vis) => (
                        <Tooltip key={vis.value}>
                          <TooltipTrigger asChild>
                            <SelectItem value={vis.value}>
                              {vis.label}
                            </SelectItem>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{vis.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </SelectContent>
                  </Select>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Document content"
                  className="min-h-[200px] max-h-[40vh] resize-y custom-scrollbar"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Documents</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected document{selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedIds.size} Document${selectedIds.size > 1 ? 's' : ''}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Secure Link Dialog */}
      {secureLinkDoc && (
        <SecureLinkDialog
          open={secureLinkDialogOpen}
          onOpenChange={(open) => {
            setSecureLinkDialogOpen(open);
            if (!open) setSecureLinkDoc(null);
          }}
          documentId={secureLinkDoc.id}
          documentTitle={secureLinkDoc.title}
          tenantId={tenantId}
        />
      )}

    </Card>
  );
}

export default FamilyDocumentsList;

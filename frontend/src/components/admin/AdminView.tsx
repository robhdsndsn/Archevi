import { useState, useEffect } from 'react';
import { windmill, type Tenant, type TenantDetails, type TenantPlan, type Document, TENANT_PLANS } from '@/api/windmill';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Users,
  FileText,
  DollarSign,
  ChevronRight,
  ArrowLeft,
  Activity,
  Calendar,
  Shield,
  Loader2,
  Plus,
  Pencil,
  HelpCircle,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { toast } from 'sonner';
import { AdminDocumentsView } from './AdminDocumentsView';

interface AdminViewProps {
  isEffectiveAdmin: boolean;
}

export function AdminView({ isEffectiveAdmin }: AdminViewProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create tenant dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: '',
    slug: '',
    plan: 'starter' as TenantPlan,
    owner_email: '',
    owner_name: '',
  });

  // Edit tenant dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editTenant, setEditTenant] = useState<{
    id: string;
    name: string;
    plan: TenantPlan;
    ai_allowance_usd: number;
    max_members: number;
    max_storage_gb: number;
  } | null>(null);

  useEffect(() => {
    if (isEffectiveAdmin) {
      loadTenants();
    }
  }, [isEffectiveAdmin]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await windmill.listTenants();
      setTenants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const loadTenantDetails = async (tenantId: string) => {
    try {
      setDetailsLoading(true);
      const details = await windmill.getTenantDetails(tenantId);
      setSelectedTenant(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'family_office':
        return 'default';
      case 'family':
        return 'secondary';
      case 'starter':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'suspended':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatPlanName = (plan: string) => {
    return plan.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleCreateTenant = async () => {
    if (!newTenant.name || !newTenant.owner_email || !newTenant.owner_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreateLoading(true);
    try {
      const result = await windmill.createTenant({
        name: newTenant.name,
        slug: newTenant.slug || generateSlug(newTenant.name),
        plan: newTenant.plan,
        owner_email: newTenant.owner_email,
        owner_name: newTenant.owner_name,
      });

      if (result.success) {
        toast.success(result.message || 'Tenant created successfully');
        setCreateDialogOpen(false);
        setNewTenant({
          name: '',
          slug: '',
          plan: 'starter',
          owner_email: '',
          owner_name: '',
        });
        loadTenants();
      } else {
        toast.error(result.error || 'Failed to create tenant');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create tenant');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditTenant = async () => {
    if (!editTenant) return;

    setEditLoading(true);
    try {
      const result = await windmill.updateTenant({
        tenant_id: editTenant.id,
        name: editTenant.name,
        plan: editTenant.plan,
        ai_allowance_usd: editTenant.ai_allowance_usd,
        max_members: editTenant.max_members,
        max_storage_gb: editTenant.max_storage_gb,
      });

      if (result.success) {
        toast.success(result.message || 'Tenant updated successfully');
        setEditDialogOpen(false);
        setEditTenant(null);
        loadTenants();
      } else {
        toast.error(result.error || 'Failed to update tenant');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update tenant');
    } finally {
      setEditLoading(false);
    }
  };

  const openEditDialog = (tenant: Tenant) => {
    setEditTenant({
      id: tenant.id,
      name: tenant.name,
      plan: tenant.plan,
      ai_allowance_usd: tenant.ai_allowance_usd,
      max_members: tenant.max_members,
      max_storage_gb: 50, // Default, will be fetched from details
    });
    setEditDialogOpen(true);
  };

  if (!isEffectiveAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              This section is only available to system administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (selectedTenant) {
    return <TenantDetailsView details={selectedTenant} onBack={() => setSelectedTenant(null)} />;
  }

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Admin Dashboard
          </h2>
          <p className="text-muted-foreground">
            Manage tenants and view all documents across the system
          </p>
        </div>
      </div>

      <Tabs defaultValue="tenants" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tenants" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Tenants
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Tenant Management
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">What is a Tenant?</h4>
                      <p className="text-sm text-muted-foreground">
                        A tenant represents a family or organization using Archevi. Each tenant has their own isolated document archive, members, and usage limits.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tenants cannot see each other's data, ensuring complete privacy.
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </h3>
              <p className="text-sm text-muted-foreground">
                View and manage all tenants in the system
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Tenant
              </Button>
              <Button variant="outline" onClick={loadTenants} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenants.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tenants.reduce((sum, t) => sum + t.member_count, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tenants.reduce((sum, t) => sum + t.document_count, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Tenants</CardTitle>
              <CardDescription>
                Click on a tenant to view detailed information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {tenants.map((tenant) => (
                      <div
                        key={tenant.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => loadTenantDetails(tenant.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{tenant.name}</h4>
                            <p className="text-sm text-muted-foreground">@{tenant.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {tenant.member_count}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              {tenant.document_count}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Badge variant={getPlanBadgeVariant(tenant.plan)}>
                              {formatPlanName(tenant.plan)}
                            </Badge>
                            <Badge variant={getStatusBadgeVariant(tenant.status)}>
                              {tenant.status}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(tenant);
                            }}
                            title="Edit tenant"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {detailsLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <AdminDocumentsView />
        </TabsContent>
      </Tabs>

      {/* Create Tenant Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Tenant</DialogTitle>
            <DialogDescription>
              Create a new family/organization with an owner account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tenant-name">Family/Organization Name *</Label>
              <Input
                id="tenant-name"
                placeholder="The Hudson Family"
                value={newTenant.name}
                onChange={(e) => {
                  setNewTenant({
                    ...newTenant,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tenant-slug">URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">archevi.ca/f/</span>
                <Input
                  id="tenant-slug"
                  placeholder="hudson"
                  value={newTenant.slug}
                  onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tenant-plan" className="flex items-center gap-1">
                Plan
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Subscription Plans</h4>
                      <p className="text-sm text-muted-foreground">
                        <strong>Starter</strong> - For individuals or small families. Limited AI usage and storage.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Family</strong> - For most families. More AI budget, members, and storage.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Family Office</strong> - For large families or organizations with premium needs.
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </Label>
              <Select
                value={newTenant.plan}
                onValueChange={(v) => setNewTenant({ ...newTenant, plan: v as TenantPlan })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {TENANT_PLANS.map((plan) => (
                    <SelectItem key={plan.value} value={plan.value}>
                      <div className="flex flex-col">
                        <span>{plan.label}</span>
                        <span className="text-xs text-muted-foreground">{plan.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="grid gap-2">
              <Label htmlFor="owner-name">Owner Name *</Label>
              <Input
                id="owner-name"
                placeholder="John Hudson"
                value={newTenant.owner_name}
                onChange={(e) => setNewTenant({ ...newTenant, owner_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="owner-email">Owner Email *</Label>
              <Input
                id="owner-email"
                type="email"
                placeholder="john@example.com"
                value={newTenant.owner_email}
                onChange={(e) => setNewTenant({ ...newTenant, owner_email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={createLoading}>
              Cancel
            </Button>
            <Button onClick={handleCreateTenant} disabled={createLoading}>
              {createLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Tenant'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Update tenant settings and limits.
            </DialogDescription>
          </DialogHeader>
          {editTenant && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editTenant.name}
                  onChange={(e) => setEditTenant({ ...editTenant, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-plan">Plan</Label>
                <Select
                  value={editTenant.plan}
                  onValueChange={(v) => setEditTenant({ ...editTenant, plan: v as TenantPlan })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TENANT_PLANS.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>
                        {plan.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-ai" className="flex items-center gap-1">
                    AI Budget ($)
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-64">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">AI Allowance</h4>
                          <p className="text-sm text-muted-foreground">
                            Monthly spending limit for AI operations (embeddings, queries, document processing). Usage resets monthly.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </Label>
                  <Input
                    id="edit-ai"
                    type="number"
                    step="0.01"
                    value={editTenant.ai_allowance_usd}
                    onChange={(e) => setEditTenant({ ...editTenant, ai_allowance_usd: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-members" className="flex items-center gap-1">
                    Max Members
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-64">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Member Limit</h4>
                          <p className="text-sm text-muted-foreground">
                            Maximum number of family members who can access this tenant. Owner counts as one member.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </Label>
                  <Input
                    id="edit-members"
                    type="number"
                    value={editTenant.max_members}
                    onChange={(e) => setEditTenant({ ...editTenant, max_members: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-storage" className="flex items-center gap-1">
                    Storage (GB)
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-64">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Storage Limit</h4>
                          <p className="text-sm text-muted-foreground">
                            Maximum storage for documents and embeddings. Includes both original files and AI-generated vectors.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </Label>
                  <Input
                    id="edit-storage"
                    type="number"
                    value={editTenant.max_storage_gb}
                    onChange={(e) => setEditTenant({ ...editTenant, max_storage_gb: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editLoading}>
              Cancel
            </Button>
            <Button onClick={handleEditTenant} disabled={editLoading}>
              {editLoading ? (
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
    </div>
  );
}

// Interface for documents with content hash for duplicate detection
interface DocumentWithHash extends Document {
  content_hash?: string;
}

// Group documents by content hash to find duplicates
function findDuplicates(documents: Document[]): Map<string, Document[]> {
  const contentMap = new Map<string, Document[]>();

  // Group by content preview (approximate duplicate detection)
  // In production, you'd use actual content hash from the database
  documents.forEach(doc => {
    // Use title + first 100 chars of content as a simple fingerprint
    const fingerprint = `${doc.title.toLowerCase().trim()}_${doc.content_preview.substring(0, 100).toLowerCase().trim()}`;
    const existing = contentMap.get(fingerprint) || [];
    existing.push(doc);
    contentMap.set(fingerprint, existing);
  });

  // Only keep groups with more than one document (actual duplicates)
  const duplicates = new Map<string, Document[]>();
  contentMap.forEach((docs, key) => {
    if (docs.length > 1) {
      duplicates.set(key, docs);
    }
  });

  return duplicates;
}

function TenantDetailsView({
  details,
  onBack,
}: {
  details: TenantDetails;
  onBack: () => void;
}) {
  const { tenant, members, document_stats, usage, recent_chats } = details;

  // Document list state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<Map<string, Document[]>>(new Map());

  // Load documents when section is expanded
  const loadDocuments = async () => {
    if (documents.length > 0) return; // Already loaded

    setDocumentsLoading(true);
    setDocumentsError(null);

    try {
      const result = await windmill.advancedSearchDocuments({
        tenant_id: tenant.id,
        limit: 100, // Get up to 100 documents
      });
      setDocuments(result.documents);

      // Find duplicates
      const dupes = findDuplicates(result.documents);
      setDuplicateGroups(dupes);
    } catch (err) {
      setDocumentsError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Check if a document is a duplicate
  const isDuplicate = (doc: Document): boolean => {
    for (const [_, docs] of duplicateGroups) {
      if (docs.some(d => d.id === doc.id)) {
        return true;
      }
    }
    return false;
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{tenant.name}</h2>
          <p className="text-muted-foreground">@{tenant.slug}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
            {tenant.status}
          </Badge>
          <Badge variant="outline">
            {tenant.plan.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${tenant.ai_allowance_usd.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${usage.cost_usd_30d.toFixed(2)} used (30d)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              Max: {tenant.max_members}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{document_stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {Object.keys(document_stats.by_category).length} categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Operations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.operations_30d}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Users with access to this tenant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents by Category</CardTitle>
            <CardDescription>
              Distribution of stored documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {Object.entries(document_stats.by_category).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="capitalize">{category.replace(/_/g, ' ')}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
                {Object.keys(document_stats.by_category).length === 0 && (
                  <p className="text-sm text-muted-foreground">No documents yet</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* All Documents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                All Documents
                {duplicateGroups.size > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {duplicateGroups.size} duplicate{duplicateGroups.size !== 1 ? 's' : ''} found
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                View and manage all documents for this tenant
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowDocuments(!showDocuments);
                if (!showDocuments) loadDocuments();
              }}
            >
              {showDocuments ? 'Hide Documents' : 'Show Documents'}
            </Button>
          </div>
        </CardHeader>
        {showDocuments && (
          <CardContent>
            {documentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : documentsError ? (
              <div className="text-center py-8 text-destructive">
                {documentsError}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No documents uploaded yet
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead className="w-[100px]">Category</TableHead>
                      <TableHead className="w-[150px]">Created</TableHead>
                      <TableHead className="w-[80px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow
                        key={doc.id}
                        className={isDuplicate(doc) ? 'bg-destructive/10' : ''}
                      >
                        <TableCell className="font-mono text-xs">{doc.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-[300px]">{doc.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {doc.content_preview}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {doc.category.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {doc.created_at
                            ? new Date(doc.created_at).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {isDuplicate(doc) ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <Copy className="h-3 w-3" />
                              Dup
                            </Badge>
                          ) : (
                            <Badge variant="secondary">OK</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tenant ID</span>
                <span className="font-mono text-xs">{tenant.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Mode</span>
                <span>{tenant.api_mode}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Storage</span>
                <span>{tenant.max_storage_gb} GB</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(tenant.created_at).toLocaleDateString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Input Tokens (30d)</span>
                <span>{usage.input_tokens_30d.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Output Tokens (30d)</span>
                <span>{usage.output_tokens_30d.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {recent_chats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Chat Sessions</CardTitle>
            <CardDescription>Latest conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recent_chats.map((chat) => (
                <div key={chat.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <span className="truncate flex-1">{chat.title || 'Untitled'}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(chat.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminView;

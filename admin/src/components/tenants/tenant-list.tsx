import { useState, useEffect, useCallback } from "react"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  FileText,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  Ban,
  CheckCircle,
  MessageSquare,
  DollarSign,
  HardDrive,
  Clock,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { windmillAdmin, type Tenant as APITenant, type TenantDetails } from "@/api/windmill"
import { Pagination, usePagination } from "@/components/ui/pagination"

interface Tenant {
  id: string
  name: string
  slug: string
  owner_email: string
  member_count: number  // family_member_count from API
  family_member_count?: number
  user_count?: number  // users with login access
  document_count: number
  created_at: string
  status: "active" | "suspended" | "pending"
  last_activity?: string
  plan?: string
  ai_allowance_usd?: number
  max_members?: number
  max_storage_gb?: number
  api_mode?: string
  owner?: {
    id: string
    name: string
    email: string
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "Never"
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

function StatusBadge({ status }: { status: Tenant["status"] }) {
  const variants: Record<Tenant["status"], "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    pending: "secondary",
    suspended: "destructive",
  }

  return (
    <Badge variant={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    starter: "bg-slate-100 text-slate-700 border-slate-300",
    family: "bg-blue-100 text-blue-700 border-blue-300",
    family_office: "bg-purple-100 text-purple-700 border-purple-300",
    trial: "bg-amber-100 text-amber-700 border-amber-300",
  }

  return (
    <Badge variant="outline" className={`capitalize ${colors[plan] || ""}`}>
      {plan?.replace("_", " ") || "free"}
    </Badge>
  )
}

// ============ CREATE TENANT DIALOG ============
interface CreateTenantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; owner_email: string; plan?: string }) => void
}

function CreateTenantDialog({ open, onOpenChange, onSubmit }: CreateTenantDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [plan, setPlan] = useState("starter")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await onSubmit({ name, owner_email: email, plan })
    setIsSubmitting(false)
    setName("")
    setEmail("")
    setPlan("starter")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Family</DialogTitle>
          <DialogDescription>
            Create a new family tenant. The owner will receive an invitation email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Family Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Smith Family"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Owner Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="plan">Plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter (5 members, $3 AI)</SelectItem>
                  <SelectItem value="family">Family (10 members, $8 AI)</SelectItem>
                  <SelectItem value="family_office">Family Office (25 members, $25 AI)</SelectItem>
                  <SelectItem value="trial">Trial (14 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Family
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============ EDIT TENANT DIALOG ============
interface EditTenantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: Tenant | null
  onSubmit: (tenantId: string, data: { name?: string; plan?: string; status?: string; ai_allowance_usd?: number }) => Promise<void>
}

function EditTenantDialog({ open, onOpenChange, tenant, onSubmit }: EditTenantDialogProps) {
  const [name, setName] = useState("")
  const [plan, setPlan] = useState("")
  const [status, setStatus] = useState("")
  const [aiAllowance, setAiAllowance] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (tenant) {
      setName(tenant.name)
      setPlan(tenant.plan || "starter")
      setStatus(tenant.status)
      setAiAllowance(String(tenant.ai_allowance_usd || 0))
    }
  }, [tenant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return

    setIsSubmitting(true)
    await onSubmit(tenant.id, {
      name: name !== tenant.name ? name : undefined,
      plan: plan !== tenant.plan ? plan : undefined,
      status: status !== tenant.status ? status : undefined,
      ai_allowance_usd: parseFloat(aiAllowance) !== tenant.ai_allowance_usd ? parseFloat(aiAllowance) : undefined,
    })
    setIsSubmitting(false)
    onOpenChange(false)
  }

  if (!tenant) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Tenant</DialogTitle>
          <DialogDescription>
            Update settings for {tenant.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Family Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-plan" className="text-right">Plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="family_office">Family Office</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-ai" className="text-right">AI Budget</Label>
              <div className="col-span-3 flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="edit-ai"
                  type="number"
                  step="0.01"
                  min="0"
                  value={aiAllowance}
                  onChange={(e) => setAiAllowance(e.target.value)}
                  className="flex-1"
                />
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ============ VIEW TENANT DETAILS DIALOG ============
interface ViewTenantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string | null
}

function ViewTenantDialog({ open, onOpenChange, tenantId }: ViewTenantDialogProps) {
  const [details, setDetails] = useState<TenantDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && tenantId) {
      setIsLoading(true)
      setError(null)
      windmillAdmin.getTenantDetails(tenantId)
        .then(setDetails)
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false))
    }
  }, [open, tenantId])

  if (!tenantId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {details?.tenant.name || "Loading..."}
          </DialogTitle>
          <DialogDescription>
            Tenant details, members, and usage statistics
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : details ? (
          <Tabs defaultValue="overview" className="mt-4 flex-1 flex flex-col min-h-0 overflow-hidden">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="family">Family ({details.family_members?.length || 0})</TabsTrigger>
              <TabsTrigger value="users">Users ({details.users?.length || 0})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 mt-4 overflow-hidden">
              <ScrollArea className="h-[320px] pr-4">
                <div className="space-y-4">
                  {/* Owner Info */}
                  {details.owner && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <Label className="text-muted-foreground text-xs">Owner</Label>
                      <p className="font-medium">{details.owner.name}</p>
                      <p className="text-sm text-muted-foreground">{details.owner.email}</p>
                    </div>
                  )}

                  {/* Tenant Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-xs">Slug</Label>
                      <p className="font-mono text-sm">{details.tenant.slug}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Status</Label>
                      <div className="mt-1">
                        <StatusBadge status={details.tenant.status as "active" | "suspended" | "pending"} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Plan</Label>
                      <div className="mt-1">
                        <PlanBadge plan={details.tenant.plan} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">API Mode</Label>
                      <p className="text-sm capitalize">{details.tenant.api_mode || "managed"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Created</Label>
                      <p className="text-sm">{formatDateTime(details.tenant.created_at)}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-xs">Last Updated</Label>
                      <p className="text-sm">{details.tenant.updated_at ? formatDateTime(details.tenant.updated_at) : "Never"}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Quotas */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Resource Quotas
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Family Members</span>
                          <span>{details.family_members?.length || 0} / {details.tenant.max_members}</span>
                        </div>
                        <Progress value={((details.family_members?.length || 0) / details.tenant.max_members) * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Storage</span>
                          <span>{details.storage?.used_gb.toFixed(2) || 0} GB / {details.storage?.limit_gb || details.tenant.max_storage_gb || 10} GB</span>
                        </div>
                        <Progress value={details.storage?.percent_used || 0} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Usage Stats */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      30-Day Usage
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">API Cost</span>
                        <span className="font-mono">${details.usage.cost_usd_30d.toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Operations</span>
                        <span className="font-mono">{details.usage.operations_30d}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Input Tokens</span>
                        <span className="font-mono">{details.usage.input_tokens_30d.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Output Tokens</span>
                        <span className="font-mono">{details.usage.output_tokens_30d.toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>AI Budget Used</span>
                        <span>${details.usage.cost_usd_30d.toFixed(2)} / ${details.tenant.ai_allowance_usd.toFixed(2)}</span>
                      </div>
                      <Progress
                        value={Math.min((details.usage.cost_usd_30d / details.tenant.ai_allowance_usd) * 100, 100)}
                        className={details.usage.cost_usd_30d > details.tenant.ai_allowance_usd * 0.8 ? "[&>div]:bg-amber-500" : ""}
                      />
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Documents
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {details.document_stats.total} total documents
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="family" className="flex-1 mt-4 overflow-hidden">
              <ScrollArea className="h-[320px]">
                {details.family_members && details.family_members.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.family_members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell className="text-muted-foreground">{member.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {member.member_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {member.is_active ? (
                              <Badge variant="default" className="bg-green-100 text-green-700 border-green-300">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground p-4">No family members</p>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="users" className="flex-1 mt-4 overflow-hidden">
              <ScrollArea className="h-[320px]">
                {details.users && details.users.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === "owner" ? "default" : "secondary"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === "active" ? "default" : "secondary"} className={user.status === "active" ? "bg-green-100 text-green-700 border-green-300" : ""}>
                              {user.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.joined_at ? formatDate(user.joined_at) : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground p-4">No users with login access</p>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="activity" className="flex-1 mt-4 overflow-hidden">
              <ScrollArea className="h-[320px] pr-4">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Recent Conversations
                  </h4>
                  {details.recent_chats.length > 0 ? (
                    <div className="space-y-2">
                      {details.recent_chats.map((chat) => (
                        <div key={chat.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{chat.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(chat.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recent conversations</p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : null}

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Map API tenant to local tenant interface
function mapApiTenant(apiTenant: APITenant): Tenant {
  return {
    id: apiTenant.id,
    name: apiTenant.name,
    slug: apiTenant.slug,
    owner_email: apiTenant.owner?.email || `owner@${apiTenant.slug}.local`,
    member_count: apiTenant.family_member_count ?? apiTenant.member_count,
    family_member_count: apiTenant.family_member_count,
    user_count: apiTenant.user_count,
    document_count: apiTenant.document_count,
    created_at: apiTenant.created_at,
    status: apiTenant.status,
    plan: apiTenant.plan,
    ai_allowance_usd: apiTenant.ai_allowance_usd,
    max_members: apiTenant.max_members,
    max_storage_gb: apiTenant.max_storage_gb,
    api_mode: apiTenant.api_mode,
    owner: apiTenant.owner,
  }
}

export function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchTenants = useCallback(async () => {
    try {
      setError(null)
      const apiTenants = await windmillAdmin.listTenants()
      setTenants(apiTenants.map(mapApiTenant))
    } catch (err) {
      console.error("Failed to fetch tenants:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch tenants")
    }
  }, [])

  useEffect(() => {
    fetchTenants().finally(() => setIsLoading(false))
  }, [fetchTenants])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchTenants()
    setIsRefreshing(false)
  }

  const handleCreateTenant = async (data: { name: string; owner_email: string; plan?: string }) => {
    try {
      await windmillAdmin.createTenant(data)
      await fetchTenants()
    } catch (err) {
      console.error("Failed to create tenant:", err)
      setError(err instanceof Error ? err.message : "Failed to create tenant")
    }
  }

  // TODO: Get actual admin email from auth context
  const adminEmail = 'admin@familybrain.local'

  const handleEditTenant = async (tenantId: string, data: { name?: string; plan?: string; status?: string; ai_allowance_usd?: number }) => {
    try {
      // Filter out undefined values
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      )
      if (Object.keys(cleanData).length > 0) {
        await windmillAdmin.updateTenant(tenantId, cleanData, adminEmail)
        await fetchTenants()
      }
    } catch (err) {
      console.error("Failed to update tenant:", err)
      setError(err instanceof Error ? err.message : "Failed to update tenant")
    }
  }

  const handleToggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === "active" ? "suspended" : "active"
    try {
      await windmillAdmin.updateTenant(tenant.id, { status: newStatus }, adminEmail)
      await fetchTenants()
    } catch (err) {
      console.error("Failed to update tenant status:", err)
      setError(err instanceof Error ? err.message : "Failed to update tenant status")
    }
  }

  const handleDeleteTenant = async (id: string) => {
    // TODO: Add delete endpoint to Windmill
    console.log("Delete not implemented yet for tenant:", id)
    setTenants(tenants.filter((t) => t.id !== id))
  }

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setEditDialogOpen(true)
  }

  const handleViewClick = (tenantId: string) => {
    setSelectedTenantId(tenantId)
    setViewDialogOpen(true)
  }

  // Calculate summary stats
  const totalMembers = tenants.reduce((sum, t) => sum + t.member_count, 0)
  const totalDocuments = tenants.reduce((sum, t) => sum + t.document_count, 0)
  const activeTenants = tenants.filter((t) => t.status === "active").length
  const suspendedTenants = tenants.filter((t) => t.status === "suspended").length

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    paginateData,
  } = usePagination(tenants.length, 25)

  const paginatedTenants = paginateData(tenants)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-muted-foreground">
            Manage family accounts and their resources.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Family
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Families</CardDescription>
            <CardTitle className="text-3xl">{tenants.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeTenants}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Suspended</CardDescription>
            <CardTitle className="text-3xl text-red-600">{suspendedTenants}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Members</CardDescription>
            <CardTitle className="text-3xl">{totalMembers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl">{totalDocuments}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tenant Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Families</CardTitle>
          <CardDescription>
            A list of all family tenants and their current status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Family</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-center">
                  <Users className="h-4 w-4 inline mr-1" />
                  Members
                </TableHead>
                <TableHead className="text-center">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Docs
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">AI Budget</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground">{tenant.slug}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PlanBadge plan={tenant.plan || "free"} />
                  </TableCell>
                  <TableCell className="text-center">
                    {tenant.member_count}
                    <span className="text-muted-foreground">/{tenant.max_members || 5}</span>
                  </TableCell>
                  <TableCell className="text-center">{tenant.document_count}</TableCell>
                  <TableCell>
                    <StatusBadge status={tenant.status} />
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    ${(tenant.ai_allowance_usd || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(tenant.created_at)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewClick(tenant.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClick(tenant)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleStatus(tenant)}>
                          {tenant.status === "active" ? (
                            <>
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteTenant(tenant.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {tenants.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={tenants.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>

      <CreateTenantDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateTenant}
      />

      <EditTenantDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        tenant={selectedTenant}
        onSubmit={handleEditTenant}
      />

      <ViewTenantDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        tenantId={selectedTenantId}
      />
    </div>
  )
}

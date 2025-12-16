import { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  Loader2,
  FileText,
  Search,
  Filter,
  AlertCircle,
  Eye,
  Trash2,
  Stethoscope,
  Receipt,
  Shield,
  UtensilsCrossed,
  User,
  FolderOpen,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { windmillAdmin, type Document, type Tenant } from "@/api/windmill"
import { Pagination, usePagination } from "@/components/ui/pagination"

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "medical": return <Stethoscope className="h-4 w-4 text-red-500" />
    case "financial": return <Receipt className="h-4 w-4 text-green-500" />
    case "invoices": return <Receipt className="h-4 w-4 text-blue-500" />
    case "insurance": return <Shield className="h-4 w-4 text-purple-500" />
    case "recipes": return <UtensilsCrossed className="h-4 w-4 text-orange-500" />
    case "personal": return <User className="h-4 w-4 text-pink-500" />
    default: return <FolderOpen className="h-4 w-4 text-gray-500" />
  }
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    medical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    financial: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    invoices: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    insurance: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    recipes: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    personal: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    general: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  }

  const colorClass = colors[category] || colors.general

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
      {category}
    </span>
  )
}

export function DocumentsList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [totalDocuments, setTotalDocuments] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [tenantFilter, setTenantFilter] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [tenantsData, docsData] = await Promise.all([
        windmillAdmin.listTenants(),
        windmillAdmin.listAllDocuments({
          tenant_id: tenantFilter !== "all" ? tenantFilter : undefined,
          limit: 50,
        }),
      ])
      setTenants(tenantsData)
      setDocuments(docsData.documents)
      setTotalDocuments(docsData.total)
    } catch (err) {
      console.error("Failed to fetch documents:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch documents")
    }
  }, [tenantFilter])

  useEffect(() => {
    fetchData().finally(() => setIsLoading(false))
  }, [fetchData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  // Filter documents by search
  const filteredDocuments = documents.filter((doc) => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      if (
        !doc.title.toLowerCase().includes(search) &&
        !doc.category.toLowerCase().includes(search) &&
        !(doc.content_preview || "").toLowerCase().includes(search)
      ) {
        return false
      }
    }
    return true
  })

  // Group by tenant for stats
  const docsByTenant = documents.reduce((acc, doc) => {
    acc[doc.tenant_id] = (acc[doc.tenant_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Pagination
  const {
    currentPage,
    pageSize,
    totalPages,
    handlePageChange,
    handlePageSizeChange,
    paginateData,
  } = usePagination(filteredDocuments.length, 25)

  const paginatedDocuments = paginateData(filteredDocuments)

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
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Manage documents across all tenants.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Documents</CardDescription>
            <CardTitle className="text-3xl">{totalDocuments}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Families with Docs</CardDescription>
            <CardTitle className="text-3xl">{Object.keys(docsByTenant).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Medical</CardDescription>
            <CardTitle className="text-3xl">
              {documents.filter(d => d.category === "medical").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Financial</CardDescription>
            <CardTitle className="text-3xl">
              {documents.filter(d => d.category === "financial" || d.category === "invoices").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={tenantFilter} onValueChange={setTenantFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tenants</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
          <CardDescription>
            {filteredDocuments.length} documents {filteredDocuments.length !== totalDocuments && `(filtered from ${totalDocuments})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No documents found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Preview</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.map((doc) => {
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(doc.category)}
                          <div>
                            <div className="font-medium truncate max-w-[250px]">{doc.title}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {doc.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.tenant_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <CategoryBadge category={doc.category} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {doc.content_preview}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(doc.created_at)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
          {filteredDocuments.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filteredDocuments.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

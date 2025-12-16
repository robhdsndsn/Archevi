import { useState, useEffect, useCallback } from "react"
import {
  Database,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  FileText,
  Users,
  Tag,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { windmillAdmin, type EmbeddingStats } from "@/api/windmill"

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function EmbeddingsStats() {
  const [data, setData] = useState<EmbeddingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await windmillAdmin.getEmbeddingStats()
      setData(result)
    } catch (err) {
      console.error("Failed to fetch embedding stats:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch embedding stats")
    }
  }, [])

  useEffect(() => {
    fetchData().finally(() => setIsLoading(false))
  }, [fetchData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Embeddings</h1>
          <p className="text-muted-foreground">
            Vector database statistics and embedding coverage.
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>pgvector Status</CardDescription>
            {data?.pgvector.status === "healthy" ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {data?.pgvector.status || "Unknown"}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.pgvector.vector_dimensions || 1024} dimensions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Vectors</CardDescription>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.pgvector.total_vectors.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Documents with embeddings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Coverage</CardDescription>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.embedding_health.embedding_coverage_pct || 0}%
            </div>
            <Progress
              value={data?.embedding_health.embedding_coverage_pct || 0}
              className="mt-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Missing Embeddings</CardDescription>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (data?.embedding_health.documents_without_embeddings || 0) > 0
                ? "text-amber-500"
                : "text-green-500"
            }`}>
              {data?.embedding_health.documents_without_embeddings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Documents need processing
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* By Tenant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              By Tenant
            </CardTitle>
            <CardDescription>Embedding coverage per family</CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.by_tenant || data.by_tenant.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tenant data available
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="text-right">Documents</TableHead>
                    <TableHead className="text-right">Embedded</TableHead>
                    <TableHead className="text-right">Coverage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.by_tenant.map((tenant) => {
                    const coverage = tenant.document_count > 0
                      ? Math.round((tenant.embedded_count / tenant.document_count) * 100)
                      : 0
                    return (
                      <TableRow key={tenant.tenant_id}>
                        <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                        <TableCell className="text-right">{tenant.document_count}</TableCell>
                        <TableCell className="text-right">{tenant.embedded_count}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={coverage === 100 ? "default" : "secondary"}>
                            {coverage}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* By Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              By Category
            </CardTitle>
            <CardDescription>Document distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.by_category || data.by_category.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No category data available
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                    <TableHead className="text-right">Embedded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.by_category.map((cat) => (
                    <TableRow key={cat.category}>
                      <TableCell className="font-medium capitalize">{cat.category}</TableCell>
                      <TableCell className="text-right">{cat.count}</TableCell>
                      <TableCell className="text-right">{cat.embedded_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Embeddings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Embeddings</CardTitle>
          <CardDescription>Latest documents with vector embeddings</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.recent_embeddings || data.recent_embeddings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent embeddings
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_embeddings.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {doc.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {doc.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{doc.tenant_name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(doc.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, useEffect, useCallback } from "react"
import {
  Database,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  HardDrive,
  Activity,
  Layers,
  Plug,
  Table as TableIcon,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { windmillAdmin, type DatabaseStats } from "@/api/windmill"

function formatSize(kb: number): string {
  if (kb >= 1024 * 1024) return `${(kb / 1024 / 1024).toFixed(1)} GB`
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Map URL hash to tab value
function getTabFromHash(): string {
  const hash = window.location.hash
  if (hash === "#migrations") return "migrations"
  if (hash === "#qdrant") return "indexes"
  if (hash === "#postgres") return "tables"
  return "tables" // #database or default
}

export function DatabaseStatsPage() {
  const [data, setData] = useState<DatabaseStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(getTabFromHash)

  // Update tab when URL hash changes
  useEffect(() => {
    const handleHashChange = () => setActiveTab(getTabFromHash())
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await windmillAdmin.getDatabaseStats()
      setData(result)
    } catch (err) {
      console.error("Failed to fetch database stats:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch database stats")
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

  const connectionUsage = data?.postgres.connections
    ? ((data.postgres.connections.active + data.postgres.connections.idle) / data.postgres.connections.max) * 100
    : 0

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
          <h1 className="text-3xl font-bold tracking-tight">Database</h1>
          <p className="text-muted-foreground">
            PostgreSQL and pgvector monitoring.
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
            <CardDescription>PostgreSQL</CardDescription>
            {data?.postgres.status === "healthy" ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {data?.postgres.status || "Unknown"}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {data?.postgres.version?.split(" ").slice(0, 2).join(" ") || "Unknown version"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Database Size</CardDescription>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.postgres.size_mb.toFixed(1) || 0} MB
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.postgres.database || "windmill"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Connections</CardDescription>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data?.postgres.connections.active || 0) + (data?.postgres.connections.idle || 0)}
              <span className="text-sm font-normal text-muted-foreground">
                /{data?.postgres.connections.max || 100}
              </span>
            </div>
            <Progress value={connectionUsage} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>pgvector</CardDescription>
            {data?.pgvector.status === "healthy" ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.pgvector.total_vectors.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Vectors ({data?.pgvector.vector_dimensions}d)
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="extensions">Extensions</TabsTrigger>
          <TabsTrigger value="indexes">Vector Indexes</TabsTrigger>
          <TabsTrigger value="migrations">Migrations</TabsTrigger>
        </TabsList>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TableIcon className="h-5 w-5" />
                Table Statistics
              </CardTitle>
              <CardDescription>Row counts and storage usage by table</CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.postgres.tables || data.postgres.tables.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tables found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead className="text-right">Rows</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.postgres.tables.map((table) => (
                      <TableRow key={table.table_name}>
                        <TableCell className="font-mono text-sm">{table.table_name}</TableCell>
                        <TableCell className="text-right">{table.row_count.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatSize(table.size_kb)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="extensions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                PostgreSQL Extensions
              </CardTitle>
              <CardDescription>Installed database extensions</CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.postgres.extensions || data.postgres.extensions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No relevant extensions found
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  {data.postgres.extensions.map((ext) => (
                    <Card key={ext.extname}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-medium">{ext.extname}</span>
                          <Badge variant="secondary">{ext.extversion}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ext.extname === "vector" && "Vector similarity search"}
                          {ext.extname === "uuid-ossp" && "UUID generation"}
                          {ext.extname === "pg_trgm" && "Trigram text search"}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indexes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Vector Indexes
              </CardTitle>
              <CardDescription>HNSW and IVFFlat indexes for similarity search</CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.pgvector.index_info || data.pgvector.index_info.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No vector indexes found
                </p>
              ) : (
                <div className="space-y-4">
                  {data.pgvector.index_info.map((idx) => (
                    <div key={idx.indexname} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">
                          {idx.indexdef.includes("hnsw") ? "HNSW" : "IVFFlat"}
                        </Badge>
                        <span className="font-mono font-medium">{idx.indexname}</span>
                      </div>
                      <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto">
                        {idx.indexdef}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Schema Migrations
              </CardTitle>
              <CardDescription>Recent database schema changes</CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.postgres.recent_migrations || data.postgres.recent_migrations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No migration history available
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Applied</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.postgres.recent_migrations.map((migration) => (
                      <TableRow key={migration.version}>
                        <TableCell className="font-mono">{migration.version}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(migration.applied_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connection Details */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
          <CardDescription>Current PostgreSQL connection status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Host</p>
              <p className="font-mono">{data?.postgres.host || "localhost"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Database</p>
              <p className="font-mono">{data?.postgres.database || "windmill"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Connections</p>
              <p className="font-mono text-green-600">{data?.postgres.connections.active || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Idle Connections</p>
              <p className="font-mono text-amber-600">{data?.postgres.connections.idle || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

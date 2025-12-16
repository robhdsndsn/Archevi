import { useState, useEffect, useCallback } from "react"
import {
  MessageSquare,
  RefreshCw,
  Loader2,
  AlertCircle,
  Users,
  Calendar,
  Clock,
  Info,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { windmillAdmin, type QueryStats } from "@/api/windmill"

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function QueryStatsPage() {
  const [data, setData] = useState<QueryStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week')

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await windmillAdmin.getQueryStats({ period })
      setData(result)
      if (result.message) {
        setError(result.message)
      }
    } catch (err) {
      console.error("Failed to fetch query stats:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch query stats")
    }
  }, [period])

  useEffect(() => {
    fetchData().finally(() => setIsLoading(false))
  }, [fetchData])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  const handlePeriodChange = (value: string) => {
    setPeriod(value as 'today' | 'week' | 'month')
    setIsLoading(true)
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
        <Alert variant={data?.message ? "default" : "destructive"}>
          {data?.message ? <Info className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Query Statistics</h1>
          <p className="text-muted-foreground">
            RAG query performance and usage patterns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Queries</CardDescription>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.total_queries.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {period === 'today' ? 'Today' : period === 'week' ? 'Last 7 days' : 'Last 30 days'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Avg Response Time</CardDescription>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.avg_response_time_ms || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average latency
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Success Rate</CardDescription>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data?.summary.total_queries
                ? Math.round((data.summary.successful_queries / data.summary.total_queries) * 100)
                : 100}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.summary.failed_queries || 0} failed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Active Tenants</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.by_tenant?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              With queries this period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Queries by Tenant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              By Tenant
            </CardTitle>
            <CardDescription>Query volume per family</CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.by_tenant || data.by_tenant.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No query data for this period
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="text-right">Queries</TableHead>
                    <TableHead className="text-right">Conversations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.by_tenant.map((tenant) => (
                    <TableRow key={tenant.tenant_id}>
                      <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                      <TableCell className="text-right">{tenant.query_count}</TableCell>
                      <TableCell className="text-right">{tenant.conversations}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Queries by Day */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Trend
            </CardTitle>
            <CardDescription>Query volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.by_day || data.by_day.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No daily data available
              </p>
            ) : (
              <div className="space-y-2">
                {data.by_day.map((day) => {
                  const maxQueries = Math.max(...data.by_day.map(d => d.queries))
                  const percentage = maxQueries > 0 ? (day.queries / maxQueries) * 100 : 0
                  return (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-20">
                        {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{day.queries}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Queries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Queries</CardTitle>
          <CardDescription>Latest user questions across all tenants</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.recent_queries || data.recent_queries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent queries
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Query</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_queries.map((query) => (
                  <TableRow key={query.id}>
                    <TableCell className="max-w-[400px]">
                      <p className="truncate">{query.query_preview}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{query.tenant_name}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(query.created_at)}
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

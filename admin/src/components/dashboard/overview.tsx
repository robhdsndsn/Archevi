import { useState, useEffect, useCallback } from "react"
import { Activity, Brain, Database, Users, RefreshCw, Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { windmillAdmin, type ServiceHealth, type AuditLogEntry } from "@/api/windmill"

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: React.ElementType
  trend?: string
  loading?: boolean
}

function StatCard({ title, value, description, icon: Icon, trend, loading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">
              {trend && <span className="text-green-600">{trend} </span>}
              {description}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface DashboardStats {
  totalTenants: number
  activeTenants: number
  totalMembers: number
  totalDocuments: number
}

interface JobStats {
  running: number
  completed_today: number
  failed_today: number
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [jobStats, setJobStats] = useState<JobStats | null>(null)
  const [healthServices, setHealthServices] = useState<ServiceHealth[]>([])
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const [dashStats, jobs, health, logs] = await Promise.all([
        windmillAdmin.getDashboardStats(),
        windmillAdmin.getJobStats(),
        windmillAdmin.getSystemHealth(),
        windmillAdmin.getAuditLogs(5),
      ])
      setStats(dashStats)
      setJobStats(jobs)
      setHealthServices(health)
      setRecentLogs(logs)
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard data")
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

  // Calculate health percentage
  const healthyServices = healthServices.filter(s => s.status === "healthy").length
  const healthPercentage = healthServices.length > 0
    ? Math.round((healthyServices / healthServices.length) * 100)
    : 0
  const healthStatus = healthPercentage === 100
    ? "All services operational"
    : `${healthyServices}/${healthServices.length} services healthy`

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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and key metrics for Family Second Brain.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Families"
          value={stats?.activeTenants.toString() || "0"}
          description={`${stats?.totalTenants || 0} total tenants`}
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          title="Total Documents"
          value={stats?.totalDocuments.toString() || "0"}
          description="Across all families"
          icon={Database}
          loading={isLoading}
        />
        <StatCard
          title="Jobs Today"
          value={jobStats ? `${jobStats.completed_today}` : "0"}
          description={jobStats?.running ? `${jobStats.running} running now` : "No jobs running"}
          icon={Brain}
          loading={isLoading}
        />
        <StatCard
          title="System Health"
          value={isLoading ? "..." : `${healthPercentage}%`}
          description={healthStatus}
          icon={Activity}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.operation}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {log.username} {log.resource && `- ${log.resource}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>External services and dependencies</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : healthServices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No health data available</p>
            ) : (
              <div className="space-y-4">
                {healthServices.map((service) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          service.status === "healthy"
                            ? "bg-green-500"
                            : service.status === "degraded"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                      />
                      <span className="text-sm font-medium">{service.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">
                        {service.latency !== undefined ? `${service.latency}ms` : "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

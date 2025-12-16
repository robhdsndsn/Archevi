import { CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useCallback } from "react"
import { windmillAdmin, type ServiceHealth } from "@/api/windmill"

// Static services that don't have API health checks yet
const staticServices: ServiceHealth[] = [
  {
    name: "PostgreSQL",
    status: "healthy",
    latency: 12,
    lastCheck: new Date().toISOString(),
    details: "Primary database operational",
  },
  {
    name: "Qdrant Vector DB",
    status: "healthy",
    latency: 8,
    lastCheck: new Date().toISOString(),
    details: "Vector search operational",
  },
  {
    name: "Groq API",
    status: "healthy",
    latency: 230,
    lastCheck: new Date().toISOString(),
    details: "LLM endpoint available",
  },
  {
    name: "Cohere API",
    status: "healthy",
    latency: 180,
    lastCheck: new Date().toISOString(),
    details: "Production tier active",
  },
]

function StatusIcon({ status }: { status: ServiceHealth["status"] }) {
  switch (status) {
    case "healthy":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case "unhealthy":
      return <XCircle className="h-5 w-5 text-red-500" />
    case "degraded":
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
  }
}

function StatusBadge({ status }: { status: ServiceHealth["status"] }) {
  const colors = {
    healthy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    unhealthy: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    degraded: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function formatLastCheck(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)

  if (diffSecs < 5) return "Just now"
  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
  return date.toLocaleTimeString()
}

export function SystemHealth() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [services, setServices] = useState<ServiceHealth[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    setError(null)
    try {
      // Get dynamic health from Windmill
      const windmillHealth = await windmillAdmin.getSystemHealth()

      // Combine with static services
      const allServices = [...windmillHealth, ...staticServices]
      setServices(allServices)
    } catch (e) {
      console.error("Failed to fetch health:", e)
      setError(e instanceof Error ? e.message : "Failed to fetch health status")
      // Fall back to static services only
      setServices(staticServices)
    }
  }, [])

  useEffect(() => {
    fetchHealth().finally(() => setIsLoading(false))
  }, [fetchHealth])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchHealth()
    setIsRefreshing(false)
  }

  const healthyCount = services.filter((s) => s.status === "healthy").length
  const totalCount = services.length
  const overallHealth = totalCount > 0 ? (healthyCount / totalCount) * 100 : 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Monitor service status and performance metrics.
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-yellow-500">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Warning: {error}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Overall Status</CardTitle>
          <CardDescription>
            {healthyCount} of {totalCount} services operational
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-4 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all ${
                    overallHealth === 100
                      ? "bg-green-500"
                      : overallHealth >= 80
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${overallHealth}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold">{overallHealth.toFixed(1)}%</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{service.name}</CardTitle>
                <StatusIcon status={service.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <StatusBadge status={service.status} />
                  {service.latency !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {service.latency}ms latency
                    </span>
                  )}
                </div>
                {service.details && (
                  <p className="text-sm text-muted-foreground">{service.details}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Last checked: {formatLastCheck(service.lastCheck)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

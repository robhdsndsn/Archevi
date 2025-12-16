import { useState, useEffect, useCallback } from "react"
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
  DollarSign,
  HardDrive,
  Users,
  Clock,
  Eye,
  Play,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
// Tabs not currently used but may be added for filtering
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  windmillAdmin,
  type UsageAlert,
  type UsageAlertStatus,
  type UsageAlertsSummary,
} from "@/api/windmill"
import { formatDistanceToNow } from "date-fns"

function AlertTypeIcon({ type }: { type: string }) {
  if (type.includes("budget")) return <DollarSign className="h-4 w-4" />
  if (type.includes("storage")) return <HardDrive className="h-4 w-4" />
  if (type.includes("member")) return <Users className="h-4 w-4" />
  return <AlertCircle className="h-4 w-4" />
}

function AlertSeverityBadge({ type }: { type: string }) {
  if (type.includes("exceeded") || type.includes("critical")) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Critical
      </Badge>
    )
  }
  if (type.includes("warning")) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        Warning
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="flex items-center gap-1">
      <Clock className="h-3 w-3" />
      Info
    </Badge>
  )
}

function StatusBadge({ status }: { status: UsageAlertStatus }) {
  const colors = {
    active: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    acknowledged: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    dismissed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  }

  return (
    <Badge className={colors[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

function formatAlertType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

export function UsageAlerts() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [alerts, setAlerts] = useState<UsageAlert[]>([])
  const [summary, setSummary] = useState<UsageAlertsSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<UsageAlertStatus | "all">("active")
  const [checkResult, setCheckResult] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    setError(null)
    try {
      const params: { status?: UsageAlertStatus; limit?: number } = { limit: 50 }
      if (statusFilter !== "all") {
        params.status = statusFilter
      }
      const result = await windmillAdmin.getUsageAlerts(params)
      setAlerts(result.alerts)
      setSummary(result.summary)
    } catch (e) {
      console.error("Failed to fetch alerts:", e)
      setError(e instanceof Error ? e.message : "Failed to fetch alerts")
    }
  }, [statusFilter])

  useEffect(() => {
    fetchAlerts().finally(() => setIsLoading(false))
  }, [fetchAlerts])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAlerts()
    setIsRefreshing(false)
  }

  const handleCheckAlerts = async (dryRun: boolean = false) => {
    setIsChecking(true)
    setCheckResult(null)
    try {
      const result = await windmillAdmin.checkUsageAlerts({ dry_run: dryRun })
      if (dryRun) {
        setCheckResult(
          `Dry run complete: ${result.tenants_checked} tenants checked, ` +
          `${result.alerts_created.length} alerts would be created`
        )
      } else {
        setCheckResult(
          `Check complete: ${result.tenants_checked} tenants checked, ` +
          `${result.alerts_created.length} alerts created, ` +
          `${result.notifications_created} notifications sent`
        )
        // Refresh the alerts list
        await fetchAlerts()
      }
    } catch (e) {
      setCheckResult(`Error: ${e instanceof Error ? e.message : "Failed to check alerts"}`)
    }
    setIsChecking(false)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usage Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and manage usage threshold alerts across all tenants.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleCheckAlerts(true)}
            disabled={isChecking}
          >
            <Eye className="h-4 w-4 mr-2" />
            Dry Run
          </Button>
          <Button
            variant="outline"
            onClick={() => handleCheckAlerts(false)}
            disabled={isChecking}
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Check
          </Button>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-500">
          <CardContent className="pt-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {checkResult && (
        <Card className="border-blue-500">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-600 dark:text-blue-400">{checkResult}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Alerts</CardDescription>
              <CardTitle className="text-2xl text-red-600">{summary.total_active}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Acknowledged</CardDescription>
              <CardTitle className="text-2xl text-blue-600">{summary.total_acknowledged}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Resolved</CardDescription>
              <CardTitle className="text-2xl text-green-600">{summary.total_resolved}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Budget Alerts</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-yellow-500" />
                {summary.budget_alerts_active}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Storage Alerts</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-purple-500" />
                {summary.storage_alerts_active}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Member Alerts</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                {summary.member_alerts_active}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>
                View and manage usage alerts by status
              </CardDescription>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as UsageAlertStatus | "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h3 className="text-lg font-medium mb-2">No alerts found</h3>
              <p className="text-sm">
                {statusFilter === "active"
                  ? "All tenants are operating within their usage limits."
                  : "No alerts match the current filter."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Triggered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <AlertTypeIcon type={alert.alert_type} />
                          <span className="text-sm font-medium">
                            {formatAlertType(alert.alert_type)}
                          </span>
                        </div>
                        <AlertSeverityBadge type={alert.alert_type} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{alert.tenant_name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{alert.tenant_plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground max-w-xs truncate block">
                        {alert.message}
                      </span>
                    </TableCell>
                    <TableCell>
                      {alert.current_percent !== null && (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                alert.current_percent >= 100
                                  ? "bg-red-500"
                                  : alert.current_percent >= 90
                                    ? "bg-orange-500"
                                    : alert.current_percent >= 75
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                              }`}
                              style={{ width: `${Math.min(alert.current_percent, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {alert.current_percent.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={alert.status} />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
                      </span>
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

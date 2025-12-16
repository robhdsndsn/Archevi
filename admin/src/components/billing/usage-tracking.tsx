import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  RefreshCw,
  Users,
  FileText,
  MessageSquare,
  Coins,
  AlertTriangle,
  TrendingUp,
  HardDrive,
  Activity,
} from "lucide-react"
import { windmillAdmin } from "@/api/windmill"
import type { UsageStats } from "@/api/windmill"

export function UsageTracking() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await windmillAdmin.getUsageStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch usage stats")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchStats} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!stats) return null

  const formatNumber = (n: number | string) => {
    const num = typeof n === 'string' ? parseInt(n, 10) : n
    return num.toLocaleString()
  }

  const formatCurrency = (n: number) => `$${n.toFixed(4)}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usage Tracking</h2>
          <p className="text-muted-foreground">
            Monitor resource consumption and quotas across all tenants
          </p>
        </div>
        <Button onClick={fetchStats} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.summary.total_tenants}</div>
            <p className="text-xs text-muted-foreground">Active families</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.summary.total_documents)}</div>
            <p className="text-xs text-muted-foreground">Across all tenants</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.summary.total_queries)}</div>
            <p className="text-xs text-muted-foreground">This {stats.summary.period}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.summary.total_tokens_used)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.summary.total_cost_usd)} total cost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quota Alerts */}
      {stats.quota_status.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Quota Alerts
            </CardTitle>
            <CardDescription>
              Tenants approaching or exceeding their limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.quota_status.map((alert) => (
                <div
                  key={alert.tenant_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <span className="font-medium">{alert.tenant_name}</span>
                  <div className="flex gap-2">
                    {alert.alerts.map((a, i) => (
                      <Badge
                        key={i}
                        variant={a.severity === "critical" ? "destructive" : "secondary"}
                      >
                        {a.type}: {a.pct.toFixed(1)}%
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage by Tenant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Usage by Tenant
          </CardTitle>
          <CardDescription>
            Resource consumption and quota status per family
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Docs</TableHead>
                <TableHead className="text-right">Queries</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead>AI Budget</TableHead>
                <TableHead>Members</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.by_tenant.map((tenant) => (
                <TableRow key={tenant.tenant_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tenant.tenant_name}</span>
                      <Badge variant={tenant.status === "active" ? "default" : "secondary"}>
                        {tenant.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{tenant.plan}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{tenant.document_count}</TableCell>
                  <TableCell className="text-right">{tenant.query_count}</TableCell>
                  <TableCell className="text-right">{formatNumber(tenant.tokens_used)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress
                        value={tenant.ai_quota_pct}
                        className={`h-2 ${tenant.ai_quota_pct >= 90 ? "[&>div]:bg-destructive" : tenant.ai_quota_pct >= 75 ? "[&>div]:bg-yellow-500" : ""}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        ${tenant.cost_used.toFixed(2)} / ${tenant.ai_allowance_usd.toFixed(2)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress
                        value={tenant.member_quota_pct}
                        className={`h-2 ${tenant.member_quota_pct >= 90 ? "[&>div]:bg-destructive" : ""}`}
                      />
                      <p className="text-xs text-muted-foreground">
                        {tenant.member_count} / {tenant.max_members}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Usage Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            7-Day Usage Trends
          </CardTitle>
          <CardDescription>
            Daily token usage and costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.usage_trends.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.usage_trends.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell className="font-medium">{day.date}</TableCell>
                    <TableCell className="text-right">{formatNumber(day.tokens)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(day.cost)}</TableCell>
                    <TableCell className="text-right">{day.operations}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No usage data for the past 7 days
            </p>
          )}
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </CardTitle>
          <CardDescription>
            Document storage by tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.storage_usage.map((storage) => (
              <div key={storage.tenant_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{storage.tenant_name}</span>
                  <span className="text-sm text-muted-foreground">
                    {storage.used_mb.toFixed(2)} MB / {storage.max_storage_gb} GB
                  </span>
                </div>
                <Progress value={storage.used_pct} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {storage.document_count} documents
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Users */}
      {stats.top_users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Users by Token Usage
            </CardTitle>
            <CardDescription>
              Most active users this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.top_users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{user.tenant_name}</TableCell>
                    <TableCell className="text-right">{formatNumber(user.tokens_used)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(user.cost_usd)}</TableCell>
                    <TableCell className="text-right">{user.operations}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

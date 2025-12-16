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
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  DollarSign,
  AlertTriangle,
  Target,
  BarChart3,
  Coins,
} from "lucide-react"
import { windmillAdmin } from "@/api/windmill"

interface CostProjections {
  current_month: {
    month: string
    days_elapsed: number
    days_remaining: number
    mtd_cost_usd: number
    mtd_tokens: number
    mtd_operations: number
    projected_cost_usd: number
    projected_tokens: number
    budget_status: "on_track" | "warning" | "over_budget"
  }
  by_tenant: Array<{
    tenant_id: string
    tenant_name: string
    budget_usd: number
    mtd_cost_usd: number
    mtd_tokens: number
    mtd_operations: number
    projected_cost_usd: number
    budget_usage_pct: number
    projected_usage_pct: number
    status: "on_track" | "warning" | "over_budget"
  }>
  historical: Array<{
    month: string
    cost_usd: number
    tokens: number
    operations: number
  }>
  trends: {
    cost_trend: "increasing" | "decreasing" | "stable"
    cost_change_pct: number
    token_trend: "increasing" | "decreasing" | "stable"
    token_change_pct: number
  }
  forecasts: {
    next_month_cost_usd: number
    next_month_tokens: number
    quarterly_cost_usd: number
    annual_cost_usd: number
  }
  budget_alerts: Array<{
    tenant_id: string
    tenant_name: string
    status: string
    current_pct: number
    projected_pct: number
    budget_usd: number
  }>
  cost_breakdown: {
    by_operation: Array<{
      operation: string
      cost_usd: number
      tokens: number
      count: number
    }>
    by_model: Array<{
      model: string
      cost_usd: number
      tokens: number
      count: number
    }>
  }
}

export function CostProjectionsPage() {
  const [data, setData] = useState<CostProjections | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await windmillAdmin.runScript<CostProjections>(
        "f/chatbot/get_cost_projections",
        {}
      )
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch projections")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading && !data) {
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
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  const formatCurrency = (n: number) => `$${n.toFixed(2)}`
  const formatNumber = (n: number) => n.toLocaleString()

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "over_budget":
        return <Badge variant="destructive">Over Budget</Badge>
      case "warning":
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">Warning</Badge>
      default:
        return <Badge variant="secondary" className="bg-green-500/20 text-green-600">On Track</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cost Projections</h2>
          <p className="text-muted-foreground">
            Forecast future costs based on usage trends
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Budget Alerts */}
      {data.budget_alerts.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Budget Alerts
            </CardTitle>
            <CardDescription>
              Tenants projected to exceed their budget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.budget_alerts.map((alert) => (
                <div
                  key={alert.tenant_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <span className="font-medium">{alert.tenant_name}</span>
                    <p className="text-sm text-muted-foreground">
                      Budget: {formatCurrency(alert.budget_usd)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={alert.status === "over_budget" ? "destructive" : "secondary"}>
                      {alert.projected_pct.toFixed(1)}% projected
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Currently at {alert.current_pct.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Month Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MTD Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.current_month.mtd_cost_usd)}</div>
            <p className="text-xs text-muted-foreground">
              {data.current_month.days_elapsed} days elapsed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Cost</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{formatCurrency(data.current_month.projected_cost_usd)}</span>
              {getStatusBadge(data.current_month.budget_status)}
            </div>
            <p className="text-xs text-muted-foreground">
              End of {data.current_month.month}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Trend</CardTitle>
            {getTrendIcon(data.trends.cost_trend)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.trends.cost_change_pct >= 0 ? "+" : ""}{data.trends.cost_change_pct.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground capitalize">
              {data.trends.cost_trend} vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operations</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.current_month.mtd_operations)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(data.current_month.mtd_tokens)} tokens
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Forecasts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cost Forecasts
          </CardTitle>
          <CardDescription>
            Projected costs based on current trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Next Month</p>
              <p className="text-2xl font-bold">{formatCurrency(data.forecasts.next_month_cost_usd)}</p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(data.forecasts.next_month_tokens)} tokens
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">This Quarter</p>
              <p className="text-2xl font-bold">{formatCurrency(data.forecasts.quarterly_cost_usd)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Annual (12mo)</p>
              <p className="text-2xl font-bold">{formatCurrency(data.forecasts.annual_cost_usd)}</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Token Trend</p>
              <div className="flex items-center gap-2">
                {getTrendIcon(data.trends.token_trend)}
                <span className="text-xl font-bold">
                  {data.trends.token_change_pct >= 0 ? "+" : ""}{data.trends.token_change_pct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Projections */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Projections by Tenant</CardTitle>
          <CardDescription>
            Monthly budget status and projections per family
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-right">MTD Spend</TableHead>
                <TableHead className="text-right">Projected</TableHead>
                <TableHead>Budget Usage</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.by_tenant.map((tenant) => (
                <TableRow key={tenant.tenant_id}>
                  <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(tenant.budget_usd)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(tenant.mtd_cost_usd)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(tenant.projected_cost_usd)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress
                        value={Math.min(tenant.projected_usage_pct, 100)}
                        className={`h-2 ${
                          tenant.projected_usage_pct >= 100
                            ? "[&>div]:bg-destructive"
                            : tenant.projected_usage_pct >= 80
                            ? "[&>div]:bg-yellow-500"
                            : ""
                        }`}
                      />
                      <p className="text-xs text-muted-foreground">
                        {tenant.budget_usage_pct.toFixed(1)}% used, {tenant.projected_usage_pct.toFixed(1)}% projected
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Cost by Operation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.cost_breakdown.by_operation.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operation</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cost_breakdown.by_operation.map((op) => (
                    <TableRow key={op.operation}>
                      <TableCell className="capitalize">{op.operation}</TableCell>
                      <TableCell className="text-right">{formatCurrency(op.cost_usd)}</TableCell>
                      <TableCell className="text-right">{formatNumber(op.count)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Cost by Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.cost_breakdown.by_model.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.cost_breakdown.by_model.map((model) => (
                    <TableRow key={model.model}>
                      <TableCell className="font-mono text-sm">{model.model}</TableCell>
                      <TableCell className="text-right">{formatCurrency(model.cost_usd)}</TableCell>
                      <TableCell className="text-right">{formatNumber(model.tokens)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Historical Data */}
      {data.historical.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historical Costs</CardTitle>
            <CardDescription>
              Monthly cost history (last 6 months)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.historical.map((month) => (
                  <TableRow key={month.month}>
                    <TableCell className="font-medium">{month.month}</TableCell>
                    <TableCell className="text-right">{formatCurrency(month.cost_usd)}</TableCell>
                    <TableCell className="text-right">{formatNumber(month.tokens)}</TableCell>
                    <TableCell className="text-right">{formatNumber(month.operations)}</TableCell>
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

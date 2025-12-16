import { useState, useEffect, useCallback } from "react"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RefreshCw,
  Loader2,
  AlertCircle,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { windmillAdmin, type APICostsData } from "@/api/windmill"
import { Pagination, usePagination } from "@/components/ui/pagination"

// Pricing info reference
const pricing = {
  groq: { model: "Llama 3.3 70B", input: "$0.59/M tokens", output: "$0.79/M tokens" },
  cohere_embed: { model: "embed-v4.0", price: "$0.10/M tokens" },
  cohere_rerank: { model: "rerank-v3.5", price: "$2.00/1000 searches" },
  cohere_chat: { model: "command-r", input: "$0.15/M tokens", output: "$0.60/M tokens" },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount)
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function APICosts() {
  const [data, setData] = useState<APICostsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month')

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const result = await windmillAdmin.getApiCosts({ period })
      setData(result)

      // Check if there's a message (like table doesn't exist yet)
      if (result.message) {
        setError(result.message)
      }
    } catch (err) {
      console.error("Failed to fetch API costs:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch API costs")
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

  // Calculate values from data or use defaults
  const totalCostMtd = data?.summary.total_cost_usd || 0
  const totalRequests = data?.summary.total_requests || 0
  const projectedCost = data?.projections.projected_monthly_usd || 0
  const mtdCost = data?.projections.mtd_cost_usd || 0

  // Determine budget status
  const budgetLimit = 50 // $50/month target
  const budgetStatus = projectedCost < budgetLimit ? "on_track" : projectedCost < budgetLimit * 1.5 ? "warning" : "over"

  // Pagination for provider table - MUST be called before any early returns (hooks rule)
  const providerPagination = usePagination(data?.by_provider?.length || 0, 10)
  const paginatedProviders = providerPagination.paginateData(data?.by_provider || [])

  // Pagination for tenant table - MUST be called before any early returns (hooks rule)
  const tenantPagination = usePagination(data?.by_tenant?.length || 0, 10)
  const paginatedTenants = tenantPagination.paginateData(data?.by_tenant || [])

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
          <h1 className="text-3xl font-bold tracking-tight">API Cost Tracking</h1>
          <p className="text-muted-foreground">
            Monitor external API usage and costs across all tenants.
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

      {/* Cost Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Period Cost</CardDescription>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCostMtd)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(totalRequests)} API calls ({period})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Month to Date</CardDescription>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mtdCost)}</div>
            <p className="text-xs text-muted-foreground">
              Day {data?.projections.days_elapsed || 0} of {data?.projections.days_in_month || 30}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Projected Monthly</CardDescription>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(projectedCost)}</div>
            <p className="text-xs text-muted-foreground">Based on current usage</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Budget Status</CardDescription>
            {budgetStatus === "on_track" ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : budgetStatus === "warning" ? (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              budgetStatus === "on_track" ? "text-green-600" :
              budgetStatus === "warning" ? "text-yellow-600" : "text-red-600"
            }`}>
              {budgetStatus === "on_track" ? "On Track" :
               budgetStatus === "warning" ? "Warning" : "Over Budget"}
            </div>
            <p className="text-xs text-muted-foreground">Target: ${budgetLimit}/month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">By Provider</TabsTrigger>
          <TabsTrigger value="tenants">By Tenant</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Info</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>API Provider Usage</CardTitle>
              <CardDescription>Breakdown of API calls and costs by provider.</CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.by_provider || data.by_provider.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No API usage data recorded yet.</p>
                  <p className="text-sm mt-2">Usage will appear here once API calls are tracked.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-right">Requests</TableHead>
                      <TableHead className="text-right">Input Tokens</TableHead>
                      <TableHead className="text-right">Output Tokens</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Avg Latency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProviders.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{item.provider}</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">{item.model}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.requests)}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.input_tokens)}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.output_tokens)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.cost_usd)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.avg_latency_ms ? `${item.avg_latency_ms}ms` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {data?.by_provider && data.by_provider.length > 0 && (
                <Pagination
                  currentPage={providerPagination.currentPage}
                  totalPages={providerPagination.totalPages}
                  pageSize={providerPagination.pageSize}
                  totalItems={data.by_provider.length}
                  onPageChange={providerPagination.handlePageChange}
                  onPageSizeChange={providerPagination.handlePageSizeChange}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Tenant</CardTitle>
              <CardDescription>API usage breakdown per family tenant.</CardDescription>
            </CardHeader>
            <CardContent>
              {!data?.by_tenant || data.by_tenant.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tenant usage data recorded yet.</p>
                  <p className="text-sm mt-2">Usage will appear here once API calls are tracked.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-right">Requests</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTenants.map((tenant, i) => {
                      const percentage = totalCostMtd > 0
                        ? Math.round((tenant.cost_usd / totalCostMtd) * 100)
                        : 0
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{tenant.tenant_name}</TableCell>
                          <TableCell className="text-right">{formatNumber(tenant.requests)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(tenant.cost_usd)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm w-10">{percentage}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
              {data?.by_tenant && data.by_tenant.length > 0 && (
                <Pagination
                  currentPage={tenantPagination.currentPage}
                  totalPages={tenantPagination.totalPages}
                  pageSize={tenantPagination.pageSize}
                  totalItems={data.by_tenant.length}
                  onPageChange={tenantPagination.handlePageChange}
                  onPageSizeChange={tenantPagination.handlePageSizeChange}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Current Pricing</CardTitle>
              <CardDescription>Reference pricing for external APIs (as of Dec 2025).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Groq (LLM)</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Model:</span>
                    <p>{pricing.groq.model}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Input:</span>
                    <p>{pricing.groq.input}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Output:</span>
                    <p>{pricing.groq.output}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cohere (Embeddings)</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Model:</span>
                    <p>{pricing.cohere_embed.model}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price:</span>
                    <p>{pricing.cohere_embed.price}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cohere (Rerank)</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Model:</span>
                    <p>{pricing.cohere_rerank.model}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price:</span>
                    <p>{pricing.cohere_rerank.price}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Cohere (Chat - Fallback)</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Model:</span>
                    <p>{pricing.cohere_chat.model}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Input:</span>
                    <p>{pricing.cohere_chat.input}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Output:</span>
                    <p>{pricing.cohere_chat.output}</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Note: Groq provides a generous free tier. Cohere Production tier has no monthly caps.
                  Costs shown are estimates based on token counts - actual billing may vary.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

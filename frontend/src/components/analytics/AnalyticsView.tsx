import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BarChart3,
  TrendingUp,
  Coins,
  FileText,
  Activity,
  RefreshCw,
  Loader2,
  DollarSign,
  Zap,
  Clock,
  User,
  Shield,
  MessageSquare,
  Upload,
  Heart,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Cpu,
  PiggyBank,
  HelpCircle,
} from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { windmill, type AnalyticsData, type AnalyticsPeriod } from '@/api/windmill';
import { useAuthStore } from '@/store/auth-store';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}c`;
  }
  return `$${cost.toFixed(4)}`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: string;
  tooltip?: {
    title: string;
    content: string;
  };
}

function StatCard({ title, value, description, icon, trend, tooltip }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-1">
          {title}
          {tooltip && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </HoverCardTrigger>
              <HoverCardContent className="w-64">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">{tooltip.title}</h4>
                  <p className="text-sm text-muted-foreground">{tooltip.content}</p>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// User-level stats (simplified for non-admins)
interface UserStats {
  totalQueries: number;
  totalDocuments: number;
  lastActive: string | null;
  queriesThisWeek: number;
  documentsThisMonth: number;
}

interface AnalyticsViewProps {
  isEffectiveAdmin?: boolean;
}

export function AnalyticsView({ isEffectiveAdmin }: AnalyticsViewProps) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  // Use effective admin status from props (respects "View as" toggle), fallback to role check
  const isAdmin = isEffectiveAdmin ?? user?.role === 'admin';

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        // Admin sees full analytics (all tenants)
        const result = await windmill.getAnalytics(period);
        setData(result);
      } else {
        // Regular users see tenant-scoped analytics
        // Pass tenant_id to filter data to just their family
        const tenantId = user?.tenant_id;
        if (tenantId) {
          const result = await windmill.getAnalytics(period, tenantId);
          // Convert full analytics to user-friendly stats
          setUserStats({
            totalQueries: result.usage?.totals?.requests ?? 0,
            totalDocuments: result.documents?.total ?? 0,
            lastActive: new Date().toISOString(),
            queriesThisWeek: period === 'week' ? (result.usage?.totals?.requests ?? 0) : 0,
            documentsThisMonth: period === 'month' ? (result.documents?.total ?? 0) : 0,
          });
          // Also store full data for potential future use
          setData(result);
        } else {
          // Fallback if no tenant_id (shouldn't happen in normal flow)
          setUserStats({
            totalQueries: 0,
            totalDocuments: 0,
            lastActive: new Date().toISOString(),
            queriesThisWeek: 0,
            documentsThisMonth: 0,
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, isAdmin]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchAnalytics} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  // User view (non-admin)
  if (!isAdmin) {
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <User className="h-6 w-6" />
              Your Activity
            </h1>
            <p className="text-sm text-muted-foreground">
              View your personal usage statistics
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-6">
            {/* User Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Your Queries"
                value={userStats?.totalQueries ?? 0}
                description="Total questions asked"
                icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
                tooltip={{
                  title: "Chat Queries",
                  content: "The total number of questions you've asked Archevi. Each query searches your family's document archive using AI."
                }}
              />
              <StatCard
                title="This Week"
                value={userStats?.queriesThisWeek ?? 0}
                description="Queries in the last 7 days"
                icon={<Zap className="h-4 w-4 text-muted-foreground" />}
                tooltip={{
                  title: "Recent Activity",
                  content: "Questions asked in the last 7 days. Regular usage helps you get the most out of your family archive."
                }}
              />
              <StatCard
                title="Documents Added"
                value={userStats?.totalDocuments ?? 0}
                description="Uploaded to archive"
                icon={<Upload className="h-4 w-4 text-muted-foreground" />}
                tooltip={{
                  title: "Your Contributions",
                  content: "Documents you've uploaded to the family archive. More documents means better answers from Archevi."
                }}
              />
              <StatCard
                title="This Month"
                value={userStats?.documentsThisMonth ?? 0}
                description="Documents added recently"
                icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                tooltip={{
                  title: "Monthly Uploads",
                  content: "Documents added in the current month. Keep adding important family documents to build your knowledge base."
                }}
              />
            </div>

            {/* Last Active */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Last active</span>
                    <span className="text-sm font-medium">
                      {userStats?.lastActive
                        ? new Date(userStats.lastActive).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Account type</span>
                    <Badge variant="outline" className="capitalize">{user?.role}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">Signed in as</span>
                    <span className="text-sm font-medium">{user?.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info for non-admins */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Limited Analytics Access</AlertTitle>
              <AlertDescription>
                Detailed usage analytics, costs, and system metrics are only visible to administrators.
                Contact your family admin if you need more detailed information.
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Admin view - full analytics
  if (!data) return null;

  const operationChartData = data.usage.by_operation.map((op) => ({
    name: op.operation,
    requests: op.count,
    tokens: op.tokens,
    cost: op.cost,
  }));

  const categoryChartData = data.documents.by_category.map((cat, i) => ({
    name: cat.category.replace('_', ' '),
    value: cat.count,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics
            <Badge variant="secondary" className="ml-2">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor usage, costs, and system activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24h</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Requests"
              value={formatNumber(data.usage.totals.requests)}
              description={`${period === 'day' ? 'Today' : `This ${period}`}`}
              icon={<Zap className="h-4 w-4 text-muted-foreground" />}
              tooltip={{
                title: "API Requests",
                content: "The number of API calls made to Cohere for RAG queries, embeddings, and document processing. Each chat message typically generates 1-2 requests."
              }}
            />
            <StatCard
              title="Tokens Used"
              value={formatNumber(data.usage.totals.tokens)}
              description="API token consumption"
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              tooltip={{
                title: "Token Usage",
                content: "Tokens are how AI models measure text. Roughly 1 token = 4 characters. Both your questions and the AI's responses count toward token usage."
              }}
            />
            <StatCard
              title="Total Cost"
              value={formatCost(data.usage.totals.cost)}
              description={`Est. monthly: ${formatCost(data.projections.monthly_estimate)}`}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              tooltip={{
                title: "API Costs",
                content: "Estimated cost based on Cohere's pricing. Command A (powerful) costs more than Command R (fast). Archevi uses adaptive model selection to optimize costs."
              }}
            />
            <StatCard
              title="Documents"
              value={data.documents.total}
              description="In knowledge base"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              tooltip={{
                title: "Knowledge Base",
                content: "Total documents stored and indexed for semantic search. Each document is converted to embeddings for AI-powered retrieval."
              }}
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Usage by Operation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Usage by Operation</CardTitle>
                <CardDescription>Requests and tokens by API operation</CardDescription>
              </CardHeader>
              <CardContent>
                {operationChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={operationChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                        }}
                      />
                      <Bar dataKey="requests" fill="#3b82f6" name="Requests" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No data for this period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documents by Category</CardTitle>
                <CardDescription>Distribution of knowledge base</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No documents yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Query Activity</CardTitle>
              <CardDescription>RAG queries over time</CardDescription>
            </CardHeader>
            <CardContent>
              {data.activity.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.activity.daily}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="queries"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No activity data for this period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest API operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.activity.recent.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{activity.operation}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {activity.tokens} tokens
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono">
                        {formatCost(activity.cost)}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Projections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Cost Projections
              </CardTitle>
              <CardDescription>Based on current usage patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Daily Average</p>
                  <p className="text-xl font-bold">{formatCost(data.projections.daily_avg_cost)}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Monthly Estimate</p>
                  <p className="text-xl font-bold">{formatCost(data.projections.monthly_estimate)}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Yearly Estimate</p>
                  <p className="text-xl font-bold">{formatCost(data.projections.monthly_estimate * 12)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Model Usage & Cost Optimization */}
          {data.model_stats && data.model_stats.by_model.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    Model Usage
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">AI Models</h4>
                          <p className="text-sm text-muted-foreground">
                            <strong>Command A (Powerful)</strong> - Best for complex questions, multi-step reasoning, and detailed analysis.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Command R (Fast)</strong> - Optimized for quick lookups, simple questions, and high-volume queries.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </CardTitle>
                  <CardDescription>Adaptive model selection breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.model_stats.by_model.map((m) => ({
                          name: m.model.includes('command-a') ? 'Command A (Powerful)' : 'Command R (Fast)',
                          value: m.count,
                          fill: m.model.includes('command-a') ? '#8b5cf6' : '#10b981',
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {data.model_stats.by_model.map((_, index) => (
                          <Cell key={`cell-${index}`} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number, name: string) => [
                          `${value} queries`,
                          name
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {data.model_stats.by_model.map((model) => (
                      <div key={model.model} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {model.model.includes('command-a') ? 'Command A' : 'Command R'}
                        </span>
                        <span>
                          {model.avg_latency_ms}ms avg · {model.avg_tokens} tokens
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PiggyBank className="h-4 w-4" />
                    Cost Savings
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Adaptive Model Selection</h4>
                          <p className="text-sm text-muted-foreground">
                            Archevi automatically chooses between Command A (powerful, expensive) and Command R (fast, cheaper) based on query complexity.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Simple questions use the faster model, complex queries get the powerful one. This saves money without sacrificing quality.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </CardTitle>
                  <CardDescription>Adaptive selection impact</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-6 rounded-lg bg-green-50 dark:bg-green-950/30">
                      <p className="text-sm text-green-600 dark:text-green-400">Estimated Savings</p>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                        ${data.model_stats.savings_estimate.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        vs using Command A for all queries
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-2">Threshold Analysis (0.7)</p>
                      {Object.entries(data.model_stats.threshold_analysis).map(([bucket, models]) => (
                        <div key={bucket} className="flex justify-between py-1 border-b last:border-0">
                          <span>{bucket}</span>
                          <span>
                            {Object.entries(models).map(([model, count]) => (
                              <Badge
                                key={model}
                                variant="outline"
                                className="ml-1 text-xs"
                              >
                                {model.includes('command-a') ? 'A' : 'R'}: {count}
                              </Badge>
                            ))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* System Health */}
          {data.health && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  System Health
                </CardTitle>
                <CardDescription>Service status and recent issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 mb-4">
                  {Object.entries(data.health.services).map(([name, service]) => (
                    <div
                      key={name}
                      className={`p-3 rounded-lg border ${
                        service.status === 'up'
                          ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
                          : service.status === 'degraded'
                          ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30'
                          : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {service.status === 'up' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : service.status === 'degraded' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium text-sm capitalize">
                          {name.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {service.response_time_ms}ms
                      </p>
                    </div>
                  ))}
                </div>
                {data.health.recent_issues.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Recent Issues (24h)
                    </p>
                    <div className="space-y-2">
                      {data.health.recent_issues.slice(0, 5).map((issue, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                          <span>
                            <Badge variant="outline" className="mr-2">{issue.service}</Badge>
                            {issue.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {issue.timestamp && new Date(issue.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {data.health.recent_issues.length === 0 && (
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    No issues in the last 24 hours
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error/Warning Summary */}
          {data.logs && (data.logs.errors > 0 || data.logs.warnings > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  System Logs
                </CardTitle>
                <CardDescription>Errors and warnings this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                  <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-center">
                    <p className="text-2xl font-bold text-red-600">{data.logs.errors}</p>
                    <p className="text-sm text-muted-foreground">Errors</p>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{data.logs.warnings}</p>
                    <p className="text-sm text-muted-foreground">Warnings</p>
                  </div>
                </div>
                {data.logs.by_category.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">By Category</p>
                    {data.logs.by_category.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                        <span>{cat.category}</span>
                        <Badge variant={cat.level === 'error' ? 'destructive' : 'secondary'}>
                          {cat.count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

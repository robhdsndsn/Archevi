import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  HardDrive,
  Cpu,
  FileText,
  MessageSquare,
  Users,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UsageMetric, BillingUsage } from '@/api/windmill/types';

interface UsageMetricsProps {
  usage: BillingUsage;
  className?: string;
}

interface UsageMeterProps {
  metric: UsageMetric;
  icon: React.ReactNode;
  color?: string;
}

function UsageMeter({ metric, icon }: UsageMeterProps) {
  const percentage = metric.limit === 'unlimited'
    ? 0
    : Math.min((metric.current / metric.limit) * 100, 100);

  const isWarning = percentage >= 80;
  const isExceeded = percentage >= 100;

  const formatValue = (value: number, unit: string) => {
    if (unit === 'GB') {
      return value >= 1 ? `${value.toFixed(1)} GB` : `${(value * 1024).toFixed(0)} MB`;
    }
    if (unit === 'USD') {
      return `$${value.toFixed(2)}`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            'p-1.5 rounded-md',
            isExceeded ? 'bg-destructive/10 text-destructive' :
            isWarning ? 'bg-amber-500/10 text-amber-500' :
            'bg-primary/10 text-primary'
          )}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium">{metric.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatValue(metric.current, metric.unit)} of{' '}
              {metric.limit === 'unlimited'
                ? 'unlimited'
                : formatValue(metric.limit, metric.unit)}
            </p>
          </div>
        </div>
        {isExceeded && (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Exceeded
          </Badge>
        )}
        {isWarning && !isExceeded && (
          <Badge variant="outline" className="text-amber-500 border-amber-500 gap-1">
            <AlertTriangle className="h-3 w-3" />
            {percentage.toFixed(0)}%
          </Badge>
        )}
        {!isWarning && metric.limit !== 'unlimited' && (
          <span className="text-xs text-muted-foreground">
            {percentage.toFixed(0)}%
          </span>
        )}
      </div>
      <Progress
        value={metric.limit === 'unlimited' ? 0 : percentage}
        className={cn(
          'h-2',
          isExceeded && '[&>div]:bg-destructive',
          isWarning && !isExceeded && '[&>div]:bg-amber-500'
        )}
      />
    </div>
  );
}

export function UsageMetrics({ usage, className }: UsageMetricsProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Usage This Period</CardTitle>
            <CardDescription>
              {formatDate(usage.period.start)} - {formatDate(usage.period.end)}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${usage.costs.total.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <TrendingUp className="h-3 w-3" />
              ${usage.costs.projected.toFixed(2)} projected
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage meters */}
        <div className="space-y-4">
          <UsageMeter
            metric={usage.metrics.storage}
            icon={<HardDrive className="h-4 w-4" />}
          />
          <UsageMeter
            metric={usage.metrics.aiSpend}
            icon={<Cpu className="h-4 w-4" />}
          />
          <UsageMeter
            metric={usage.metrics.documents}
            icon={<FileText className="h-4 w-4" />}
          />
          <UsageMeter
            metric={usage.metrics.aiQueries}
            icon={<MessageSquare className="h-4 w-4" />}
          />
          <UsageMeter
            metric={usage.metrics.members}
            icon={<Users className="h-4 w-4" />}
          />
        </div>

        {/* Cost breakdown */}
        {usage.costs.overage > 0 && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 space-y-2">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Overage Charges
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base plan</span>
              <span>${usage.costs.basePlan.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overage</span>
              <span className="text-amber-600 dark:text-amber-400">
                +${usage.costs.overage.toFixed(2)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between text-sm font-medium">
              <span>Total</span>
              <span>${usage.costs.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact inline usage bar for headers/sidebars
interface CompactUsageBarProps {
  metric: UsageMetric;
  showLabel?: boolean;
  className?: string;
}

export function CompactUsageBar({ metric, showLabel = true, className }: CompactUsageBarProps) {
  const percentage = metric.limit === 'unlimited'
    ? 0
    : Math.min((metric.current / metric.limit) * 100, 100);

  const isWarning = percentage >= 80;
  const isExceeded = percentage >= 100;

  return (
    <div className={cn('space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{metric.name}</span>
          <span className={cn(
            isExceeded && 'text-destructive',
            isWarning && !isExceeded && 'text-amber-500'
          )}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
      <Progress
        value={metric.limit === 'unlimited' ? 0 : percentage}
        className={cn(
          'h-1.5',
          isExceeded && '[&>div]:bg-destructive',
          isWarning && !isExceeded && '[&>div]:bg-amber-500'
        )}
      />
    </div>
  );
}

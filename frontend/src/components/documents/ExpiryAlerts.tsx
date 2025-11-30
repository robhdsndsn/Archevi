import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Calendar,
  Clock,
  RefreshCw,
  Loader2,
  Shield,
  Receipt,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { windmill } from '@/api/windmill';
import type { ExpiringDocumentDetail } from '@/api/windmill/types';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  insurance: <Shield className="h-4 w-4" />,
  invoices: <Receipt className="h-4 w-4" />,
  financial: <CreditCard className="h-4 w-4" />,
};

interface ExpiryAlertsProps {
  onViewDocument?: (id: number) => void;
  compact?: boolean;
}

export function ExpiryAlerts({ onViewDocument, compact = false }: ExpiryAlertsProps) {
  const [documents, setDocuments] = useState<ExpiringDocumentDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urgencyCounts, setUrgencyCounts] = useState({ urgent: 0, soon: 0, upcoming: 0 });

  const fetchExpiringDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await windmill.getExpiringDocuments(90);
      if (result.success) {
        setDocuments(result.documents);
        setUrgencyCounts(result.by_urgency || { urgent: 0, soon: 0, upcoming: 0 });
      } else {
        setError(result.error || 'Failed to load expiring documents');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiringDocuments();
  }, []);

  const getUrgencyBadge = (daysUntil: number) => {
    if (daysUntil <= 7) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Urgent</Badge>;
    }
    if (daysUntil <= 30) {
      return <Badge variant="default" className="gap-1 bg-amber-500"><Clock className="h-3 w-3" />Soon</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><Calendar className="h-3 w-3" />Upcoming</Badge>;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatExpiryType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (compact) {
    // Compact view for dashboard widget
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Expiring Soon
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={fetchExpiringDocuments}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : documents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No documents expiring soon
            </p>
          ) : (
            <div className="space-y-2">
              {/* Summary badges */}
              <div className="flex gap-2 flex-wrap">
                {urgencyCounts.urgent > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {urgencyCounts.urgent} urgent
                  </Badge>
                )}
                {urgencyCounts.soon > 0 && (
                  <Badge variant="default" className="text-xs bg-amber-500">
                    {urgencyCounts.soon} this month
                  </Badge>
                )}
                {urgencyCounts.upcoming > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {urgencyCounts.upcoming} upcoming
                  </Badge>
                )}
              </div>

              {/* Top 3 urgent items */}
              <div className="space-y-1">
                {documents.slice(0, 3).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer text-sm"
                    onClick={() => onViewDocument?.(doc.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {CATEGORY_ICONS[doc.category] || <Calendar className="h-3 w-3" />}
                      <span className="truncate">{doc.title}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {doc.days_until_expiry}d
                      </span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>

              {documents.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View all {documents.length} expiring documents
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Expiring Documents
            </CardTitle>
            <CardDescription>
              Documents with upcoming expiry, renewal, or due dates
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExpiringDocuments}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive opacity-50 mb-2" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchExpiringDocuments}>
              Try Again
            </Button>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto opacity-50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No expiring documents</h3>
            <p className="text-sm">
              Documents with detected expiry dates will appear here.
              Upload documents with AI Enhanced mode to detect dates.
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-destructive">{urgencyCounts.urgent}</div>
                <div className="text-xs text-muted-foreground">This Week</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-amber-500">{urgencyCounts.soon}</div>
                <div className="text-xs text-muted-foreground">This Month</div>
              </div>
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-muted-foreground">{urgencyCounts.upcoming}</div>
                <div className="text-xs text-muted-foreground">Next 90 Days</div>
              </div>
            </div>

            {/* Document list */}
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => onViewDocument?.(doc.id)}
                  >
                    <div className="shrink-0 mt-1">
                      {CATEGORY_ICONS[doc.category] || <Calendar className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium truncate">{doc.title}</h4>
                        {getUrgencyBadge(doc.days_until_expiry)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{formatExpiryType(doc.expiry_type)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.expiry_date)}</span>
                        <span>•</span>
                        <span className={doc.days_until_expiry <= 7 ? 'text-destructive font-medium' : ''}>
                          {doc.days_until_expiry} days left
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}

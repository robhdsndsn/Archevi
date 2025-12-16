import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  History,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  RefreshCw,
} from 'lucide-react';
import { windmill } from '@/api/windmill';
import type { DocumentVersion, DocumentChangeType } from '@/api/windmill/types';
import { useAuthStore } from '@/store/auth-store';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Default tenant for MVP
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

interface VersionHistoryProps {
  documentId: string;
  onVersionRestored?: () => void;
  compact?: boolean;
}

export function VersionHistory({
  documentId,
  onVersionRestored,
  compact = false,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const { user } = useAuthStore();
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;

  const fetchVersions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await windmill.getDocumentVersions({
        document_id: documentId,
        tenant_id: tenantId,
      });

      setVersions(result.versions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load version history');
      setVersions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchVersions();
    }
  }, [documentId, tenantId]);

  const handleRollback = async (targetVersion: number) => {
    if (!user?.id) {
      toast.error('You must be logged in to rollback versions');
      return;
    }

    setIsRollingBack(true);
    setSelectedVersion(targetVersion);

    try {
      const result = await windmill.rollbackDocumentVersion({
        document_id: documentId,
        target_version: targetVersion,
        tenant_id: tenantId,
        user_id: user.id,
      });

      if (result.success) {
        toast.success(`Rolled back to version ${targetVersion}. New version ${result.new_version_number} created.`);
        await fetchVersions();
        onVersionRestored?.();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to rollback version');
    } finally {
      setIsRollingBack(false);
      setSelectedVersion(null);
    }
  };

  const getChangeTypeBadge = (changeType: DocumentChangeType) => {
    const variants: Record<DocumentChangeType, string> = {
      initial: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      correction: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      major_revision: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };
    return variants[changeType] || variants.update;
  };

  if (isLoading) {
    return (
      <Card className={cn(compact && 'border-0 shadow-none')}>
        <CardHeader className={cn('pb-3', compact && 'px-0 pt-0')}>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(compact && 'px-0')}>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn(compact && 'border-0 shadow-none')}>
        <CardHeader className={cn('pb-3', compact && 'px-0 pt-0')}>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(compact && 'px-0')}>
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchVersions} className="mt-2">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card className={cn(compact && 'border-0 shadow-none')}>
        <CardHeader className={cn('pb-3', compact && 'px-0 pt-0')}>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent className={cn(compact && 'px-0')}>
          <p className="text-sm text-muted-foreground text-center py-4">
            No version history available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(compact && 'border-0 shadow-none')}>
      <CardHeader className={cn('pb-3', compact && 'px-0 pt-0')}>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Version History
          <Badge variant="secondary" className="ml-auto">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(compact && 'px-0')}>
        <ScrollArea className={cn(compact ? 'h-[200px]' : 'h-[300px]')}>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-4">
              {versions.map((version) => (
                <div key={version.version_number} className="relative flex gap-4 pl-8">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute left-2 w-5 h-5 rounded-full border-2 bg-background flex items-center justify-center',
                      version.is_current
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {version.is_current ? (
                      <CheckCircle className="h-3 w-3 text-primary-foreground" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {version.version_number}
                      </span>
                    )}
                  </div>

                  {/* Version content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        Version {version.version_number}
                      </span>
                      {version.is_current && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                      <Badge className={cn('text-xs', getChangeTypeBadge(version.change_type))}>
                        {version.change_type.replace('_', ' ')}
                      </Badge>
                    </div>

                    {version.change_summary && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {version.change_summary}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(version.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {format(new Date(version.created_at), 'PPpp')}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {version.created_by_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.created_by_name}
                        </span>
                      )}

                      {version.file_size_bytes && (
                        <span>
                          {(version.file_size_bytes / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>

                    {/* Rollback button for non-current versions */}
                    {!version.is_current && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-7 text-xs"
                            disabled={isRollingBack}
                          >
                            {isRollingBack && selectedVersion === version.version_number ? (
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3 w-3 mr-1" />
                            )}
                            Restore this version
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Restore Version {version.version_number}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will create a new version with the content from version{' '}
                              {version.version_number}. The current version will be preserved in the
                              history.
                              {version.change_summary && (
                                <span className="block mt-2 text-sm">
                                  <strong>Original change:</strong> {version.change_summary}
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRollback(version.version_number)}
                            >
                              Restore Version
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

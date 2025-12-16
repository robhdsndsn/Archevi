import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FileText,
  RefreshCw,
  LinkIcon,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { windmill } from '@/api/windmill';
import type { RelatedDocument, MemberType } from '@/api/windmill/types';
import { useAuthStore } from '@/store/auth-store';
import { format } from 'date-fns';

// Default tenant for MVP
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

interface RelatedDocumentsProps {
  documentId: number;
  onDocumentSelect?: (documentId: number) => void;
  limit?: number;
  compact?: boolean;
}

export function RelatedDocuments({
  documentId,
  onDocumentSelect,
  limit = 5,
  compact = false,
}: RelatedDocumentsProps) {
  const [documents, setDocuments] = useState<RelatedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;

  const fetchRelatedDocuments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await windmill.getRelatedDocuments({
        document_id: documentId,
        tenant_id: tenantId,
        limit,
        user_member_type: user?.member_type as MemberType | undefined,
        user_member_id: user?.member_id,
      });

      if (result.error) {
        setError(result.error);
        setDocuments([]);
      } else {
        setDocuments(result.related_documents);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load related documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchRelatedDocuments();
    }
  }, [documentId, tenantId]);

  // Similarity badge color based on score
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (similarity >= 60) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    if (similarity >= 40) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200';
  };

  // Compact version for sidebars
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Related
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={fetchRelatedDocuments}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-xs text-muted-foreground">{error}</p>
          ) : documents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No related documents found
            </p>
          ) : (
            <div className="space-y-1">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => onDocumentSelect?.(doc.id)}
                  className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-2 group"
                >
                  <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs truncate flex-1">{doc.title}</span>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">
                    {doc.similarity}%
                  </Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full version
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Related Documents
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRelatedDocuments}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <LinkIcon className="h-12 w-12 mx-auto opacity-50 mb-2" />
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchRelatedDocuments}>
              Try Again
            </Button>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <LinkIcon className="h-12 w-12 mx-auto opacity-50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No related documents</h3>
            <p className="text-sm">
              This document doesn't have any similar documents yet.
              Upload more documents to discover connections.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <TooltipProvider key={doc.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onDocumentSelect?.(doc.id)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 hover:border-primary/50 transition-all flex items-center gap-3 group"
                    >
                      {/* Icon */}
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                          {doc.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {doc.category && (
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {doc.category.replace(/_/g, ' ')}
                            </Badge>
                          )}
                          {doc.created_at && (
                            <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                      </div>

                      {/* Similarity score */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={getSimilarityColor(doc.similarity)}>
                          {doc.similarity}% match
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">{doc.title}</p>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {doc.tags.slice(0, 5).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px]">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {doc.similarity}% similar based on content
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

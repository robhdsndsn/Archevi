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
import { Tag, RefreshCw, Loader2, Hash } from 'lucide-react';
import { windmill } from '@/api/windmill';
import type { TagCount } from '@/api/windmill/types';

interface TagCloudProps {
  onTagSelect?: (tag: string) => void;
  selectedTag?: string | null;
  compact?: boolean;
}

export function TagCloud({ onTagSelect, selectedTag, compact = false }: TagCloudProps) {
  const [tags, setTags] = useState<TagCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await windmill.getTags();
      if (result.success) {
        setTags(result.tags);
      } else {
        setError(result.error || 'Failed to load tags');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const getTagSize = (count: number, maxCount: number) => {
    if (maxCount <= 1) return 'text-sm';
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'text-lg font-medium';
    if (ratio > 0.4) return 'text-base';
    return 'text-sm';
  };

  const maxCount = tags.length > 0 ? Math.max(...tags.map(t => t.document_count)) : 1;

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={fetchTags}
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
          ) : tags.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No tags yet. Upload documents with AI Enhanced mode.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 12).map((tag) => (
                <Badge
                  key={tag.tag}
                  variant={selectedTag === tag.tag ? 'default' : 'secondary'}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => onTagSelect?.(tag.tag)}
                >
                  {tag.tag}
                  <span className="ml-1 text-xs opacity-60">{tag.document_count}</span>
                </Badge>
              ))}
              {tags.length > 12 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 12} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Document Tags
            </CardTitle>
            <CardDescription>
              Browse documents by AI-extracted tags
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTags}
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
            <Tag className="h-12 w-12 mx-auto text-destructive opacity-50 mb-2" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchTags}>
              Try Again
            </Button>
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Hash className="h-12 w-12 mx-auto opacity-50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No tags yet</h3>
            <p className="text-sm">
              Tags are automatically extracted when you upload documents with AI Enhanced mode enabled.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tag cloud */}
            <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg min-h-[100px]">
              {tags.map((tag) => (
                <Badge
                  key={tag.tag}
                  variant={selectedTag === tag.tag ? 'default' : 'outline'}
                  className={`cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors ${getTagSize(tag.document_count, maxCount)}`}
                  onClick={() => onTagSelect?.(tag.tag)}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag.tag}
                  <span className="ml-1.5 px-1.5 py-0.5 bg-background/20 rounded text-xs">
                    {tag.document_count}
                  </span>
                </Badge>
              ))}
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
              <span>{tags.length} unique tags</span>
              <span>{tags.reduce((sum, t) => sum + t.document_count, 0)} total uses</span>
            </div>

            {selectedTag && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <span className="text-sm">Filtering by:</span>
                <Badge>{selectedTag}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => onTagSelect?.(selectedTag)}
                >
                  Clear filter
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

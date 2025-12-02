import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import type { Source } from '@/api/windmill';
import { cn } from '@/lib/utils';

interface SourcesListProps {
  sources: Source[];
  confidence?: number;
}

export function SourcesList({ sources, confidence }: SourcesListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-auto p-1 text-muted-foreground hover:text-foreground"
      >
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 mr-1" />
        ) : (
          <ChevronDown className="h-4 w-4 mr-1" />
        )}
        {sources.length} source{sources.length !== 1 ? 's' : ''}
        {confidence !== undefined && (
          <span className="ml-2 text-xs">
            ({Math.round(confidence * 100)}% confidence)
          </span>
        )}
      </Button>
      <HoverCard>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center ml-1"
            onClick={(e) => e.stopPropagation()}
          >
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help" />
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-72">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">About Sources</h4>
            <p className="text-sm text-muted-foreground">
              These are documents from your archive that Archevi used to generate this answer.
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Match %</strong> - How relevant each document is to your question</p>
              <p><strong>Confidence</strong> - Overall certainty of the answer based on available sources</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {sources.map((source) => (
            <Card key={source.id} className="bg-muted/30">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{source.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {source.category}
                      </span>
                      <span
                        className={cn(
                          'text-xs px-1.5 py-0.5 rounded-full',
                          source.relevance >= 0.8
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : source.relevance >= 0.5
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        )}
                      >
                        {Math.round(source.relevance * 100)}% match
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

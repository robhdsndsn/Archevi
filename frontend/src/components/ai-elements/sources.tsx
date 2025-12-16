import * as React from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Eye, Copy, Check, Image, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';

// Helper function to get confidence level info
function getConfidenceInfo(score: number) {
  if (score >= 0.7) {
    return {
      level: 'high',
      label: 'High confidence',
      description: 'This source is highly relevant to your question',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
  } else if (score >= 0.4) {
    return {
      level: 'medium',
      label: 'Medium confidence',
      description: 'This source may contain relevant information',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
  } else {
    return {
      level: 'low',
      label: 'Low confidence',
      description: 'This source has limited relevance - verify the information',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    };
  }
}

// Standalone ConfidenceBadge component for reuse
interface ConfidenceBadgeProps {
  score: number;
  showTooltip?: boolean;
  className?: string;
}

export function ConfidenceBadge({ score, showTooltip = true, className }: ConfidenceBadgeProps) {
  const info = getConfidenceInfo(score);

  const badge = (
    <span
      className={cn(
        'text-xs px-1.5 py-0.5 rounded-full cursor-default',
        info.className,
        className
      )}
      aria-label={`${info.label}: ${Math.round(score * 100)}%`}
    >
      {Math.round(score * 100)}%
    </span>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="font-medium">{info.label}</p>
          <p className="text-xs text-muted-foreground">{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Context for Sources component state
interface SourcesContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SourcesContext = React.createContext<SourcesContextValue | null>(null);

function useSourcesContext() {
  const context = React.useContext(SourcesContext);
  if (!context) {
    throw new Error('Sources components must be used within <Sources>');
  }
  return context;
}

// Root Sources component
interface SourcesProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
}

export function Sources({
  className,
  defaultOpen = false,
  children,
  ...props
}: SourcesProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <SourcesContext.Provider value={{ isOpen, setIsOpen }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn('mt-3 pt-3 border-t border-border/50', className)}
          role="region"
          aria-label="Source documents"
          {...props}
        >
          {children}
        </div>
      </Collapsible>
    </SourcesContext.Provider>
  );
}

// Trigger button for expanding/collapsing sources
interface SourcesTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count?: number;
  confidence?: number;
}

export function SourcesTrigger({
  className,
  count,
  confidence,
  ...props
}: SourcesTriggerProps) {
  const { isOpen } = useSourcesContext();

  return (
    <CollapsibleTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-auto p-1.5 text-muted-foreground hover:text-foreground gap-1.5',
          className
        )}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? 'Hide' : 'Show'} ${count !== undefined ? `${count} source${count !== 1 ? 's' : ''}` : 'sources'}`}
        {...props}
      >
        {isOpen ? (
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        )}
        <FileText className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="text-xs font-medium">
          {count !== undefined
            ? `${count} source${count !== 1 ? 's' : ''}`
            : 'Sources'}
        </span>
        {confidence !== undefined && (
          <ConfidenceBadge score={confidence} showTooltip={false} className="ml-1" />
        )}
      </Button>
    </CollapsibleTrigger>
  );
}

// Container for source items
interface SourcesContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SourcesContent({
  className,
  children,
  ...props
}: SourcesContentProps) {
  return (
    <CollapsibleContent>
      <div
        className={cn(
          'mt-2 space-y-1.5 animate-in slide-in-from-top-2 duration-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContent>
  );
}

// Individual source item with expandable preview
interface SourceProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  category?: string;
  relevance?: number;
  snippet?: string;
  href?: string;
  onOpen?: () => void;
}

export function Source({
  className,
  href,
  title,
  category,
  relevance,
  snippet,
  onOpen,
  children,
  ...props
}: SourceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const content = children || title;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (snippet) {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpen) {
      onOpen();
    } else if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          'rounded-md border bg-card transition-colors',
          isExpanded ? 'border-border' : 'border-transparent bg-muted/30 hover:bg-muted/50',
          className
        )}
        {...props}
      >
        <CollapsibleTrigger asChild>
          <button
            className="group flex items-center gap-2 p-2 w-full text-left"
            aria-expanded={isExpanded}
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-sm">{content}</p>
              {category && (
                <p className="text-xs text-muted-foreground truncate">{category}</p>
              )}
            </div>
            {relevance !== undefined && (
              <ConfidenceBadge score={relevance} className="shrink-0" />
            )}
            {snippet && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            )}
          </button>
        </CollapsibleTrigger>

        {snippet && (
          <CollapsibleContent>
            <Card className="mx-2 mb-2 border-0 shadow-none">
              <CardContent className="p-3 pt-0">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {snippet}
                  {snippet.length >= 500 && '...'}
                </p>
                <div className="flex gap-1 mt-2 pt-2 border-t border-border/50">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={handleCopy}
                        >
                          {copied ? (
                            <Check className="h-3 w-3 mr-1" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          {copied ? 'Copied' : 'Copy'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy snippet to clipboard</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {(href || onOpen) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={handleOpen}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Document
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open full document</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        )}
      </div>
    </Collapsible>
  );
}

// PDF Page Source - displays visual search results with thumbnails
interface PageSourceProps extends React.HTMLAttributes<HTMLDivElement> {
  pageId?: number;
  documentId?: number;
  documentTitle?: string;
  pageNumber?: number;
  similarity?: number;
  pageImage?: string;  // Base64 encoded JPEG
  ocrText?: string;
  onViewPage?: () => void;
}

export function PageSource({
  className,
  pageId,
  documentId,
  documentTitle,
  pageNumber,
  similarity,
  pageImage,
  ocrText,
  onViewPage,
  ...props
}: PageSourceProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          'rounded-md border bg-card transition-colors',
          isExpanded ? 'border-border' : 'border-transparent bg-muted/30 hover:bg-muted/50',
          className
        )}
        {...props}
      >
        <CollapsibleTrigger asChild>
          <button
            className="group flex items-center gap-2 p-2 w-full text-left"
            aria-expanded={isExpanded}
          >
            <FileImage className="h-4 w-4 shrink-0 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-sm">
                Page {pageNumber} - {documentTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                Visual search result
              </p>
            </div>
            {similarity !== undefined && (
              <ConfidenceBadge score={similarity} className="shrink-0" />
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3">
            {/* Page thumbnail */}
            {pageImage && (
              <div className="mb-2 rounded-md overflow-hidden border bg-muted/20">
                <img
                  src={`data:image/jpeg;base64,${pageImage}`}
                  alt={`Page ${pageNumber} of ${documentTitle}`}
                  className={cn(
                    "w-full h-auto max-h-64 object-contain transition-opacity",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setImageLoaded(true)}
                  loading="lazy"
                />
                {!imageLoaded && (
                  <div className="h-32 flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground animate-pulse" />
                  </div>
                )}
              </div>
            )}

            {/* OCR text preview */}
            {ocrText && (
              <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 mb-2 max-h-24 overflow-y-auto">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {ocrText}
                  {ocrText.length >= 500 && '...'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-1 pt-2 border-t border-border/50">
              {onViewPage && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewPage();
                        }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Full Page
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open this page in the document viewer</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Container for page sources (visual search results)
interface PageSourcesProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
}

export function PageSources({
  className,
  defaultOpen = true,
  children,
  ...props
}: PageSourcesProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div
        className={cn('mt-3 pt-3 border-t border-blue-500/30', className)}
        role="region"
        aria-label="Visual search results"
        {...props}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1.5 text-blue-600 hover:text-blue-700 gap-1.5 mb-2"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
            <FileImage className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-xs font-medium">
              PDF Pages Found
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

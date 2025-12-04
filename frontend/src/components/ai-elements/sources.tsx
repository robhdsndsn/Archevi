import * as React from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
        {...props}
      >
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        <FileText className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">
          {count !== undefined
            ? `${count} source${count !== 1 ? 's' : ''}`
            : 'Sources'}
        </span>
        {confidence !== undefined && (
          <span
            className={cn(
              'ml-1 text-xs px-1.5 py-0.5 rounded-full',
              confidence >= 0.8
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : confidence >= 0.5
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            )}
          >
            {Math.round(confidence * 100)}%
          </span>
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

// Individual source item
interface SourceProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  title?: string;
  category?: string;
  relevance?: number;
}

export function Source({
  className,
  href,
  title,
  category,
  relevance,
  children,
  ...props
}: SourceProps) {
  const content = children || title;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group flex items-center gap-2 p-2 rounded-md',
        'bg-muted/30 hover:bg-muted/50 transition-colors',
        'text-sm text-foreground/80 hover:text-foreground',
        className
      )}
      {...props}
    >
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-sm">{content}</p>
        {category && (
          <p className="text-xs text-muted-foreground truncate">{category}</p>
        )}
      </div>
      {relevance !== undefined && (
        <span
          className={cn(
            'text-xs px-1.5 py-0.5 rounded-full shrink-0',
            relevance >= 0.8
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : relevance >= 0.5
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
          )}
        >
          {Math.round(relevance * 100)}%
        </span>
      )}
      {href && (
        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </a>
  );
}

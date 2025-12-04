import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Brain, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Context for Reasoning component state
interface ReasoningContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isStreaming: boolean;
}

const ReasoningContext = React.createContext<ReasoningContextValue | null>(
  null
);

function useReasoningContext() {
  const context = React.useContext(ReasoningContext);
  if (!context) {
    throw new Error('Reasoning components must be used within <Reasoning>');
  }
  return context;
}

// Root Reasoning component
interface ReasoningProps extends React.HTMLAttributes<HTMLDivElement> {
  isStreaming?: boolean;
  defaultOpen?: boolean;
}

export function Reasoning({
  className,
  isStreaming = false,
  defaultOpen = true,
  children,
  ...props
}: ReasoningProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Auto-open when streaming starts
  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  return (
    <ReasoningContext.Provider value={{ isOpen, setIsOpen, isStreaming }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            'rounded-lg border border-border/50 bg-muted/20',
            isStreaming && 'border-primary/30 bg-primary/5',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </Collapsible>
    </ReasoningContext.Provider>
  );
}

// Trigger for expanding/collapsing reasoning
interface ReasoningTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

export function ReasoningTrigger({
  className,
  label = 'Thinking',
  ...props
}: ReasoningTriggerProps) {
  const { isOpen, isStreaming } = useReasoningContext();

  return (
    <CollapsibleTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'w-full justify-between p-3 h-auto font-normal hover:bg-transparent',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Brain className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            {isStreaming ? `${label}...` : label}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </CollapsibleTrigger>
  );
}

// Content container for reasoning text
interface ReasoningContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ReasoningContent({
  className,
  children,
  ...props
}: ReasoningContentProps) {
  const { isStreaming } = useReasoningContext();
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when streaming
  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [children, isStreaming]);

  return (
    <CollapsibleContent>
      <div
        ref={contentRef}
        className={cn(
          'px-3 pb-3 pt-0',
          'text-sm text-muted-foreground leading-relaxed',
          'max-h-[200px] overflow-y-auto',
          'animate-in slide-in-from-top-2 duration-200',
          className
        )}
        {...props}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {children}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
          )}
        </div>
      </div>
    </CollapsibleContent>
  );
}

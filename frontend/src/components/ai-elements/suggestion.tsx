import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

// Container for suggestion buttons
interface SuggestionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Suggestions({ className, children, ...props }: SuggestionsProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 justify-center',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Individual suggestion button
interface SuggestionProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  suggestion: string;
  onClick?: (suggestion: string) => void;
  icon?: React.ReactNode;
}

export function Suggestion({
  className,
  suggestion,
  onClick,
  icon,
  disabled,
  ...props
}: SuggestionProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        'h-auto py-2 px-3 text-sm font-normal',
        'bg-background hover:bg-muted/50',
        'border-border/50 hover:border-border',
        'transition-all duration-200',
        'hover:shadow-sm',
        className
      )}
      onClick={() => onClick?.(suggestion)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {suggestion}
    </Button>
  );
}

// Pre-built suggestion group with sparkle icons
interface SuggestionGroupProps {
  className?: string;
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export function SuggestionGroup({
  className,
  suggestions,
  onSelect,
  disabled,
}: SuggestionGroupProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        <span className="text-xs">Try asking</span>
      </div>
      <Suggestions>
        {suggestions.map((suggestion) => (
          <Suggestion
            key={suggestion}
            suggestion={suggestion}
            onClick={onSelect}
            disabled={disabled}
          />
        ))}
      </Suggestions>
    </div>
  );
}

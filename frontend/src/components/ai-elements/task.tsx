import * as React from 'react';
import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Context for Task component state
interface TaskContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  status: 'pending' | 'in_progress' | 'completed';
}

const TaskContext = React.createContext<TaskContextValue | null>(null);

function useTaskContext() {
  const context = React.useContext(TaskContext);
  if (!context) {
    throw new Error('Task components must be used within <Task>');
  }
  return context;
}

// Root Task component
interface TaskProps extends React.HTMLAttributes<HTMLDivElement> {
  status?: 'pending' | 'in_progress' | 'completed';
  defaultOpen?: boolean;
}

export function Task({
  className,
  status = 'pending',
  defaultOpen = false,
  children,
  ...props
}: TaskProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen || status === 'in_progress');

  return (
    <TaskContext.Provider value={{ isOpen, setIsOpen, status }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className={cn(
            'rounded-lg border bg-card text-card-foreground',
            status === 'in_progress' && 'border-primary/30',
            status === 'completed' && 'border-green-500/30 bg-green-500/5',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </Collapsible>
    </TaskContext.Provider>
  );
}

// Trigger for expanding/collapsing task
interface TaskTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
}

export function TaskTrigger({
  className,
  title,
  ...props
}: TaskTriggerProps) {
  const { isOpen, status } = useTaskContext();

  const StatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <CollapsibleTrigger asChild>
      <button
        className={cn(
          'flex w-full items-center justify-between p-3 text-left',
          'hover:bg-muted/50 transition-colors rounded-t-lg',
          !isOpen && 'rounded-b-lg',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          <StatusIcon />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </CollapsibleTrigger>
  );
}

// Content container for task items
interface TaskContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TaskContent({
  className,
  children,
  ...props
}: TaskContentProps) {
  return (
    <CollapsibleContent>
      <div
        className={cn(
          'px-3 pb-3 pt-0 space-y-1.5',
          'animate-in slide-in-from-top-2 duration-200',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </CollapsibleContent>
  );
}

// Individual task item
interface TaskItemProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TaskItem({ className, children, ...props }: TaskItemProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 text-sm text-muted-foreground',
        'pl-6', // Indent to align with title
        className
      )}
      {...props}
    >
      <span className="text-muted-foreground/50">-</span>
      <span className="flex-1">{children}</span>
    </div>
  );
}

// File reference within a task item
interface TaskItemFileProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function TaskItemFile({
  className,
  children,
  ...props
}: TaskItemFileProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded',
        'bg-muted/50 text-xs font-mono',
        'text-foreground/80',
        className
      )}
      {...props}
    >
      <FileText className="h-3 w-3" />
      {children}
    </span>
  );
}

// Task list container for multiple tasks
interface TaskListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function TaskList({ className, children, ...props }: TaskListProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {children}
    </div>
  );
}

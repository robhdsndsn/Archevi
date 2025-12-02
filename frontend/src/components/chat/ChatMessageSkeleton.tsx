import { Skeleton } from '@/components/ui/skeleton';
import { Bot } from 'lucide-react';

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-background">
      {/* Bot avatar */}
      <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 select-none items-center justify-center rounded-md border shadow bg-secondary">
        <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 space-y-3">
        {/* Paragraph lines */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[75%]" />
        </div>

        {/* Sources skeleton */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-28 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

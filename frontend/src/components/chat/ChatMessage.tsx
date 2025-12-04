import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import type { Message } from '@/store/chat-store';
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ai-elements/reasoning';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg',
        isUser ? 'bg-muted/50' : 'bg-background'
      )}
    >
      <div
        className={cn(
          'flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary'
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
      </div>

      <div className="flex-1 space-y-2 overflow-hidden">
        {/* Reasoning section - shows AI thought process */}
        {message.reasoning && (
          <Reasoning
            isStreaming={message.isStreaming}
            defaultOpen={message.isStreaming}
          >
            <ReasoningTrigger />
            <ReasoningContent>{message.reasoning}</ReasoningContent>
          </Reasoning>
        )}

        {/* Main message content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Sources section - shows cited documents */}
        {message.sources && message.sources.length > 0 && (
          <Sources>
            <SourcesTrigger
              count={message.sources.length}
              confidence={message.confidence}
            />
            <SourcesContent>
              {message.sources.map((source) => (
                <Source
                  key={source.id}
                  title={source.title}
                  category={source.category}
                  relevance={source.relevance}
                />
              ))}
            </SourcesContent>
          </Sources>
        )}
      </div>
    </div>
  );
}

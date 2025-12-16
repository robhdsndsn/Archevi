import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import type { Message } from '@/store/chat-store';
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
  PageSources,
  PageSource,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ai-elements/reasoning';
import { User, Bot, Search, FileImage } from 'lucide-react';

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

        {/* Tool calls indicator - shows when AI searched documents */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.toolCalls.filter(tc => tc.name === 'search_documents').length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5">
                <Search className="h-3 w-3" />
                <span>
                  Searched: {message.toolCalls.filter(tc => tc.name === 'search_documents').map(tc => `"${tc.query}"`).join(', ')}
                </span>
              </div>
            )}
            {message.toolCalls.filter(tc => tc.name === 'search_pdf_pages').length > 0 && (
              <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-950/30 rounded-md px-2 py-1.5">
                <FileImage className="h-3 w-3" />
                <span>
                  Visual search: {message.toolCalls.filter(tc => tc.name === 'search_pdf_pages').map(tc => `"${tc.query}"`).join(', ')}
                </span>
              </div>
            )}
          </div>
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
                  snippet={source.snippet}
                />
              ))}
            </SourcesContent>
          </Sources>
        )}

        {/* Page sources section - shows visual search results with thumbnails */}
        {message.pageSources && message.pageSources.length > 0 && (
          <PageSources>
            {message.pageSources.map((page) => (
              <PageSource
                key={`page-${page.page_id}`}
                pageId={page.page_id}
                documentId={page.document_id}
                documentTitle={page.document_title}
                pageNumber={page.page_number}
                similarity={page.similarity}
                pageImage={page.page_image}
                ocrText={page.ocr_text}
              />
            ))}
          </PageSources>
        )}
      </div>
    </div>
  );
}

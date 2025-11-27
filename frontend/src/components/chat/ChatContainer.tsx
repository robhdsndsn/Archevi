import { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chat-store';
import { windmill } from '@/api/windmill';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Archive } from 'lucide-react';

export function ChatContainer() {
  const {
    isLoading,
    currentSession,
    addMessage,
    setLoading,
    setWindmillSessionId,
  } = useChatStore();

  const session = currentSession();
  const messages = session?.messages || [];
  const windmillSessionId = session?.windmillSessionId;

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = async (content: string) => {
    // Add user message
    addMessage({ content, role: 'user' });
    setLoading(true);

    try {
      const result = await windmill.ragQuery({
        query: content,
        session_id: windmillSessionId ?? undefined,
      });

      // Update session ID if provided
      if (result.session_id && result.session_id !== windmillSessionId) {
        setWindmillSessionId(result.session_id);
      }

      // Add assistant message with sources
      addMessage({
        content: result.answer,
        role: 'assistant',
        sources: result.sources,
        confidence: result.confidence,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      addMessage({
        content: `Sorry, I encountered an error: ${errorMessage}`,
        role: 'assistant',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-4xl mx-auto p-4">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-muted-foreground">
                <Archive className="h-16 w-16 mb-4 text-primary/50" />
                <h2 className="text-xl font-semibold mb-2">Welcome to Archevi</h2>
                <p className="max-w-md">
                  Your family's smart document assistant. Ask me anything about your
                  documents and I'll search through your archive to find answers.
                </p>
                <div className="mt-6 grid gap-2 text-sm">
                  <p className="text-muted-foreground/70">Try asking:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <span className="px-3 py-1 bg-muted rounded-full">"Find my tax documents"</span>
                    <span className="px-3 py-1 bg-muted rounded-full">"Show medical records"</span>
                    <span className="px-3 py-1 bg-muted rounded-full">"Insurance policies"</span>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </div>
  );
}

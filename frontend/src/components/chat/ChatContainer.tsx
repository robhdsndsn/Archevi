import { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { windmill } from '@/api/windmill';
import { ChatMessage } from './ChatMessage';
import { ChatMessageSkeleton } from './ChatMessageSkeleton';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Archive } from 'lucide-react';

// Default tenant for MVP - The Hudson Family
// TODO: Remove this when auth properly returns tenant_id
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Validate if a value is a valid UUID (handles legacy integer IDs gracefully)
function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

export function ChatContainer() {
  const {
    isLoading,
    currentSession,
    addMessage,
    setLoading,
    setWindmillSessionId,
  } = useChatStore();

  const { user } = useAuthStore();
  // Use tenant_id from auth context, fall back to default for MVP
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;

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

    // Validate user_id - only pass if it's a valid UUID
    // Legacy tokens may have integer IDs which cause DB errors
    const validUserId = isValidUUID(user?.id) ? user.id : undefined;

    // Debug: log the request parameters
    console.log('[ChatContainer] Submitting query:', {
      query: content,
      tenant_id: tenantId,
      user_id: validUserId,
      original_user_id: user?.id,
      session_id: windmillSessionId,
    });

    try {
      const result = await windmill.ragQuery({
        query: content,
        tenant_id: tenantId,
        user_id: validUserId,
        session_id: windmillSessionId ?? undefined,
      });
      console.log('[ChatContainer] RAG result:', result);

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
      console.error('[ChatContainer] Error:', error);
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
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-4xl mx-auto p-2 sm:p-4">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
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
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && <ChatMessageSkeleton />}
              </>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />
      </Card>
    </div>
  );
}

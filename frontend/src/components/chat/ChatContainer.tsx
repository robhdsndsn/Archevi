import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { windmill } from '@/api/windmill';
import type {
  RAGStreamSearchData,
  RAGStreamVisualSearchData,
  RAGStreamAnswerData,
  RAGStreamCompleteData,
} from '@/api/windmill/types';
import { ChatMessage } from './ChatMessage';
import { SearchSuggestions } from './SearchSuggestions';
import { ResearchModeToggle, useResearchMode } from './ResearchModeToggle';
import { FeaturedTemplates } from './QueryTemplates';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, Download, Loader2, Search, Brain, FileImage } from 'lucide-react';
import { exportChatToPDF } from '@/lib/export-chat';

// Default tenant for MVP - The Hudson Family
// TODO: Remove this when auth properly returns tenant_id
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

// Streaming status for real-time UI feedback
type StreamStatus = 'idle' | 'thinking' | 'searching' | 'visual_searching' | 'answering';

export function ChatContainer() {
  const {
    isLoading,
    currentSession,
    addMessage,
    updateMessage,
    setLoading,
    setWindmillSessionId,
  } = useChatStore();

  const { user } = useAuthStore();
  // Use tenant_id from auth context, fall back to default for MVP
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;

  // Research mode (Quick vs Deep) with persistence - maps to appropriate model
  const [researchMode, setResearchMode, selectedModel] = useResearchMode();

  const session = currentSession();
  const messages = session?.messages || [];
  const windmillSessionId = session?.windmillSessionId;

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Streaming UI state
  const [streamStatus, setStreamStatus] = useState<StreamStatus>('idle');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (content: string) => {
    // Add user message
    addMessage({ content, role: 'user' });
    setLoading(true);
    setStreamStatus('thinking');

    // Create placeholder assistant message for streaming
    const assistantMessage = addMessage({
      content: '',
      role: 'assistant',
      isStreaming: true,
    });

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    // Track if we received a terminal event (complete or error)
    let receivedTerminalEvent = false;

    try {
      // Build conversation history from recent messages (last 10 exchanges)
      const recentMessages = messages.slice(-20); // Last 10 user + 10 assistant
      const conversationHistory = recentMessages
        .filter(m => m.content && m.content.trim() !== '')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      // Use streaming endpoint for real-time updates
      for await (const event of windmill.ragQueryAgentStream(
        {
          user_message: content,
          tenant_id: tenantId,
          session_id: windmillSessionId ?? undefined,
          conversation_history: conversationHistory.length > 0 ? conversationHistory : undefined,
          user_member_type: user?.member_type,
          user_member_id: user?.member_id,
          model: selectedModel,
        },
        abortControllerRef.current.signal
      )) {
        switch (event.type) {
          case 'thinking':
            setStreamStatus('thinking');
            break;

          case 'search': {
            const searchData = event.data as RAGStreamSearchData;
            if (searchData.status === 'started') {
              setStreamStatus('searching');
              setSearchQuery(searchData.query);
            } else if (searchData.status === 'complete') {
              // Update message with sources as they arrive
              if (searchData.sources && searchData.sources.length > 0) {
                updateMessage(assistantMessage.id, {
                  sources: searchData.sources,
                  toolCalls: [{ name: 'search_documents', query: searchData.query }],
                });
              }
            }
            break;
          }

          case 'visual_search': {
            const visualSearchData = event.data as RAGStreamVisualSearchData;
            if (visualSearchData.status === 'started') {
              setStreamStatus('visual_searching');
              setSearchQuery(visualSearchData.query);
            } else if (visualSearchData.status === 'complete') {
              // Update message with page sources as they arrive
              if (visualSearchData.page_sources && visualSearchData.page_sources.length > 0) {
                // Get current tool calls and add the new one
                const currentMessages = session?.messages || [];
                const currentMessage = currentMessages.find(m => m.id === assistantMessage.id);
                const currentToolCalls = currentMessage?.toolCalls || [];
                updateMessage(assistantMessage.id, {
                  pageSources: visualSearchData.page_sources,
                  toolCalls: [...currentToolCalls, { name: 'search_pdf_pages', query: visualSearchData.query }],
                });
              }
            }
            break;
          }

          case 'answer': {
            const answerData = event.data as RAGStreamAnswerData;
            if (answerData.status === 'started') {
              setStreamStatus('answering');
            } else if (answerData.status === 'complete' && answerData.content) {
              // Update with complete answer
              updateMessage(assistantMessage.id, {
                content: answerData.content,
              });
            }
            break;
          }

          case 'complete': {
            receivedTerminalEvent = true;
            const completeData = event.data as RAGStreamCompleteData;
            // Final update with all data
            updateMessage(assistantMessage.id, {
              content: completeData.answer,
              sources: completeData.sources,
              pageSources: completeData.page_sources,  // Visual search results (PDF pages)
              confidence: completeData.confidence,
              toolCalls: completeData.tool_calls,
              isStreaming: false,
            });

            // Update session ID if provided
            if (completeData.session_id && completeData.session_id !== windmillSessionId) {
              setWindmillSessionId(completeData.session_id);
            }
            break;
          }

          case 'error': {
            receivedTerminalEvent = true;
            const errorData = event.data as { message: string };
            updateMessage(assistantMessage.id, {
              content: `Sorry, I encountered an error: ${errorData.message}`,
              isStreaming: false,
            });
            break;
          }
        }
      }
    } catch (error) {
      receivedTerminalEvent = true;
      // Handle abort
      if (error instanceof Error && error.name === 'AbortError') {
        updateMessage(assistantMessage.id, {
          content: 'Request cancelled.',
          isStreaming: false,
        });
      } else {
        console.error('[ChatContainer] Streaming error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred';
        updateMessage(assistantMessage.id, {
          content: `Sorry, I encountered an error: ${errorMessage}`,
          isStreaming: false,
        });
      }
    } finally {
      // If we never got a terminal event (complete/error), ensure the message is updated
      // This handles cases where the stream ends unexpectedly without an event
      if (!receivedTerminalEvent) {
        console.warn('[ChatContainer] Stream ended without terminal event');
        // Get the current message content from the store (may have been updated via search events)
        const currentMessages = session?.messages || [];
        const currentMessage = currentMessages.find(m => m.id === assistantMessage.id);
        updateMessage(assistantMessage.id, {
          content: currentMessage?.content || 'Sorry, the response was interrupted. Please try again.',
          isStreaming: false,
        });
      }
      setLoading(false);
      setStreamStatus('idle');
      setSearchQuery('');
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-2 sm:p-4">
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Header with research mode toggle and export button */}
        <div className="flex items-center justify-between px-3 py-2 border-b gap-2">
          {messages.length > 0 && session ? (
            <span className="text-sm font-medium text-muted-foreground truncate flex-1">
              {session.title}
            </span>
          ) : (
            <div className="flex-1" />
          )}
          <div className="flex items-center gap-2 shrink-0">
            <ResearchModeToggle
              value={researchMode}
              onChange={setResearchMode}
              disabled={isLoading}
            />
            {messages.length > 0 && session && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportChatToPDF(session)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center text-muted-foreground">
                <Archive className="h-16 w-16 mb-4 text-primary/50" />
                <h2 className="text-xl font-semibold mb-2 text-foreground">Welcome to Archevi</h2>
                <p className="max-w-md mb-6">
                  Your family's smart document assistant. Ask me anything about your
                  documents and I'll search through your archive to find answers.
                </p>
                <FeaturedTemplates
                  onSelect={handleSubmit}
                  disabled={isLoading}
                />
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && streamStatus !== 'idle' && (
                  <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground animate-in fade-in duration-200">
                    {streamStatus === 'thinking' && (
                      <>
                        <Brain className="h-4 w-4 animate-pulse text-primary" />
                        <span>Thinking...</span>
                      </>
                    )}
                    {streamStatus === 'searching' && (
                      <>
                        <Search className="h-4 w-4 animate-pulse text-primary" />
                        <span>
                          Searching documents
                          {searchQuery && (
                            <span className="text-muted-foreground/70">
                              {' '}for "{searchQuery.slice(0, 40)}{searchQuery.length > 40 ? '...' : ''}"
                            </span>
                          )}
                        </span>
                      </>
                    )}
                    {streamStatus === 'visual_searching' && (
                      <>
                        <FileImage className="h-4 w-4 animate-pulse text-blue-500" />
                        <span className="text-blue-600">
                          Searching PDF pages
                          {searchQuery && (
                            <span className="text-blue-500/70">
                              {' '}for "{searchQuery.slice(0, 40)}{searchQuery.length > 40 ? '...' : ''}"
                            </span>
                          )}
                        </span>
                      </>
                    )}
                    {streamStatus === 'answering' && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Generating response...</span>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <SearchSuggestions
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}

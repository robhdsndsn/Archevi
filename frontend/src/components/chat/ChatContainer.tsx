import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/store/chat-store';
import { useAuthStore } from '@/store/auth-store';
import { windmill } from '@/api/windmill';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, Download } from 'lucide-react';
import { exportChatToPDF } from '@/lib/export-chat';
import { SuggestionGroup } from '@/components/ai-elements/suggestion';
import {
  Task,
  TaskTrigger,
  TaskContent,
  TaskItem,
  TaskList,
} from '@/components/ai-elements/task';

// Default tenant for MVP - The Hudson Family
// TODO: Remove this when auth properly returns tenant_id
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Validate if a value is a valid UUID (handles legacy integer IDs gracefully)
function isValidUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

// Workflow steps for Task component
type WorkflowStep = 'idle' | 'searching' | 'analyzing' | 'generating' | 'complete';

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
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('idle');

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
    setWorkflowStep('searching');

    // Validate user_id - only pass if it's a valid UUID
    // Legacy tokens may have integer IDs which cause DB errors
    const validUserId = isValidUUID(user?.id) ? user.id : undefined;

    // Debug: log the request parameters
    console.log('[ChatContainer] Submitting query:', {
      query: content,
      tenant_id: tenantId,
      user_id: validUserId,
      session_id: windmillSessionId,
    });

    try {
      // Simulate workflow progress
      setTimeout(() => setWorkflowStep('analyzing'), 500);
      setTimeout(() => setWorkflowStep('generating'), 1200);

      const result = await windmill.ragQuery({
        query: content,
        tenant_id: tenantId,
        user_id: validUserId,
        session_id: windmillSessionId ?? undefined,
        // Visibility filtering - only show documents user has access to
        user_member_type: user?.member_type,
        user_member_id: user?.member_id,
      });
      console.log('[ChatContainer] RAG result:', result);

      setWorkflowStep('complete');

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
      setTimeout(() => setWorkflowStep('idle'), 300);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-2 sm:p-4">
      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Header with export button - only show when there are messages */}
        {messages.length > 0 && session && (
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-sm font-medium text-muted-foreground truncate flex-1">
              {session.title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exportChatToPDF(session)}
              className="shrink-0 gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
          </div>
        )}
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
                <SuggestionGroup
                  suggestions={[
                    'Find my tax documents',
                    'Show medical records',
                    'Insurance policies',
                    'Recent receipts',
                  ]}
                  onSelect={handleSubmit}
                  disabled={isLoading}
                />
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && workflowStep !== 'idle' && (
                  <TaskList>
                    <Task
                      status={workflowStep === 'searching' ? 'in_progress' : 'completed'}
                      defaultOpen
                    >
                      <TaskTrigger title="Searching documents" />
                      <TaskContent>
                        <TaskItem>Querying vector database for relevant documents</TaskItem>
                        <TaskItem>Matching semantic similarity scores</TaskItem>
                      </TaskContent>
                    </Task>
                    {(workflowStep === 'analyzing' || workflowStep === 'generating' || workflowStep === 'complete') && (
                      <Task
                        status={workflowStep === 'analyzing' ? 'in_progress' : 'completed'}
                        defaultOpen
                      >
                        <TaskTrigger title="Analyzing context" />
                        <TaskContent>
                          <TaskItem>Extracting relevant passages from top matches</TaskItem>
                          <TaskItem>Building context for AI model</TaskItem>
                        </TaskContent>
                      </Task>
                    )}
                    {(workflowStep === 'generating' || workflowStep === 'complete') && (
                      <Task
                        status={workflowStep === 'generating' ? 'in_progress' : 'completed'}
                        defaultOpen
                      >
                        <TaskTrigger title="Generating response" />
                        <TaskContent>
                          <TaskItem>Processing with AI</TaskItem>
                          <TaskItem>Formulating answer based on your documents</TaskItem>
                        </TaskContent>
                      </Task>
                    )}
                  </TaskList>
                )}
              </>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <ChatInput
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </Card>
    </div>
  );
}

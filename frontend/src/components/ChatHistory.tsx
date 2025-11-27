import { useChatStore, type ChatSession } from '@/store/chat-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Trash2,
  Plus,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ChatHistoryProps {
  onSelectSession: (sessionId: string) => void;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return d.toLocaleDateString([], { weekday: 'long' });
  } else {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function SessionCard({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const messageCount = session.messages.length;
  const lastMessage = session.messages[session.messages.length - 1];

  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-accent ${
        isActive ? 'border-primary bg-accent' : ''
      }`}
      onClick={onSelect}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CardTitle className="text-sm font-medium truncate">
              {session.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(session.updatedAt)}
            </span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this conversation and all its messages.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <CardDescription className="text-xs line-clamp-2">
          {lastMessage
            ? lastMessage.content.slice(0, 100) + (lastMessage.content.length > 100 ? '...' : '')
            : 'No messages yet'}
        </CardDescription>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {messageCount} {messageCount === 1 ? 'message' : 'messages'}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ChatHistory({ onSelectSession }: ChatHistoryProps) {
  const { sessions, currentSessionId, createNewSession, deleteSession } = useChatStore();

  const handleNewChat = () => {
    const newId = createNewSession();
    onSelectSession(newId);
  };

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
  };

  // Filter out empty sessions (no messages) except the current one
  const visibleSessions = sessions.filter(
    (s) => s.messages.length > 0 || s.id === currentSessionId
  );

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Chat History</h1>
          <p className="text-sm text-muted-foreground">
            {visibleSessions.length} {visibleSessions.length === 1 ? 'conversation' : 'conversations'}
          </p>
        </div>
        <Button onClick={handleNewChat} className="gap-2">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <Card className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {visibleSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
                <p className="text-sm max-w-md mb-4">
                  Start a new conversation with Archevi to see it appear here.
                </p>
                <Button onClick={handleNewChat} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Start New Chat
                </Button>
              </div>
            ) : (
              visibleSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  onSelect={() => handleSelectSession(session.id)}
                  onDelete={() => deleteSession(session.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useChatStore, type ChatSession } from '@/store/chat-store';
import { ChatContainer } from './ChatContainer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Trash2,
  Plus,
  Clock,
  History,
  ChevronDown,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
    return d.toLocaleDateString([], { weekday: 'short' });
  } else {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

function SessionItem({
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
  const lastMessage = session.messages[session.messages.length - 1];

  return (
    <div
      onClick={onSelect}
      className={cn(
        'group cursor-pointer rounded-md p-2 transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium truncate">{session.title}</span>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
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
      <div className="flex items-center justify-between mt-1 ml-6">
        <span className="text-xs text-muted-foreground truncate max-w-[180px]">
          {lastMessage?.content.slice(0, 50) || 'Empty chat'}
          {lastMessage && lastMessage.content.length > 50 ? '...' : ''}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3" />
          {formatDate(session.updatedAt)}
        </span>
      </div>
    </div>
  );
}

// Shared History Content for both Mobile Sheet and Desktop Popover
function HistoryContent({
  sessions,
  currentSessionId,
  onSelect,
  onDelete,
  onNewChat,
}: {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b">
        <span className="text-sm font-medium">Recent Chats</span>
        <Button variant="outline" size="sm" onClick={onNewChat}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>
      <ScrollArea className="flex-1 max-h-[400px]">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 px-4 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium mb-1">No conversations yet</p>
              <p className="text-xs">Start asking questions about your documents</p>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={session.id === currentSessionId}
                onSelect={() => onSelect(session.id)}
                onDelete={() => onDelete(session.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export function AskAIView() {
  const { sessions, currentSessionId, createNewSession, switchSession, deleteSession } = useChatStore();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const isMobile = useIsMobile();

  // Filter out empty sessions except current
  const visibleSessions = sessions.filter(
    (s) => s.messages.length > 0 || s.id === currentSessionId
  );

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const handleNewChat = () => {
    createNewSession();
    setIsHistoryOpen(false);
  };

  const handleSelectSession = (sessionId: string) => {
    switchSession(sessionId);
    setIsHistoryOpen(false);
  };

  // Mobile layout - full width chat with history in sheet
  // Account for header (3.5rem) and bottom nav (4rem)
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem-4rem)]">
        {/* Mobile Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
          <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <History className="h-4 w-4" />
                <span className="text-sm">History</span>
                {visibleSessions.length > 0 && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">
                    {visibleSessions.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Chat History</SheetTitle>
              </SheetHeader>
              <HistoryContent
                sessions={visibleSessions}
                currentSessionId={currentSessionId}
                onSelect={handleSelectSession}
                onDelete={deleteSession}
                onNewChat={handleNewChat}
              />
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="sm" onClick={handleNewChat} className="gap-1">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 overflow-hidden">
          <ChatContainer />
        </div>
      </div>
    );
  }

  // Desktop layout - full width chat with history in popover dropdown
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Desktop Header Bar with History Dropdown */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <Popover open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <History className="h-4 w-4" />
                <span className="max-w-[200px] truncate">
                  {currentSession?.title || 'New Chat'}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
                {visibleSessions.length > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    {visibleSessions.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[350px] p-0" align="start">
              <HistoryContent
                sessions={visibleSessions}
                currentSessionId={currentSessionId}
                onSelect={handleSelectSession}
                onDelete={deleteSession}
                onNewChat={handleNewChat}
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button variant="outline" size="sm" onClick={handleNewChat} className="gap-1">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Main Chat Area - Full Width */}
      <div className="flex-1 overflow-hidden">
        <ChatContainer />
      </div>
    </div>
  );
}

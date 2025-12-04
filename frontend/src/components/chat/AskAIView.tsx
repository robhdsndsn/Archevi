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
  PanelLeftClose,
  PanelLeft,
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
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  isCollapsed,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isCollapsed: boolean;
}) {
  const lastMessage = session.messages[session.messages.length - 1];

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onSelect}
              className={cn(
                'w-full p-2 rounded-md transition-colors flex items-center justify-center',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              )}
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-medium">{session.title}</p>
            <p className="text-xs text-muted-foreground">{formatDate(session.updatedAt)}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

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
        <span className="text-xs text-muted-foreground truncate max-w-[140px]">
          {lastMessage?.content.slice(0, 40) || 'Empty chat'}
          {lastMessage && lastMessage.content.length > 40 ? '...' : ''}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
          <Clock className="h-3 w-3" />
          {formatDate(session.updatedAt)}
        </span>
      </div>
    </div>
  );
}

export function AskAIView() {
  const { sessions, currentSessionId, createNewSession, switchSession, deleteSession } = useChatStore();
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Filter out empty sessions except current
  const visibleSessions = sessions.filter(
    (s) => s.messages.length > 0 || s.id === currentSessionId
  );

  const handleNewChat = () => {
    createNewSession();
  };

  const handleSelectSession = (sessionId: string) => {
    switchSession(sessionId);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Chat History Sidebar */}
      <div
        className={cn(
          'border-r bg-muted/30 flex flex-col transition-all duration-200',
          isPanelCollapsed ? 'w-12' : 'w-64'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center border-b p-2 gap-2',
          isPanelCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {!isPanelCollapsed && (
            <span className="text-sm font-medium text-muted-foreground">Recent Chats</span>
          )}
          <div className="flex items-center gap-1">
            {!isPanelCollapsed && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleNewChat}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New chat</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
                  >
                    {isPanelCollapsed ? (
                      <PanelLeft className="h-4 w-4" />
                    ) : (
                      <PanelLeftClose className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Collapsed: New Chat Button */}
        {isPanelCollapsed && (
          <div className="p-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-full h-8"
                    onClick={handleNewChat}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">New chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Session List */}
        <ScrollArea className="flex-1">
          <div className={cn('space-y-1', isPanelCollapsed ? 'p-1' : 'p-2')}>
            {visibleSessions.length === 0 ? (
              !isPanelCollapsed && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No chats yet</p>
                </div>
              )
            ) : (
              visibleSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  onSelect={() => handleSelectSession(session.id)}
                  onDelete={() => deleteSession(session.id)}
                  isCollapsed={isPanelCollapsed}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden">
        <ChatContainer />
      </div>
    </div>
  );
}

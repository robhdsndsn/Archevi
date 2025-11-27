import { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  MessageSquare,
  FileText,
  Search,
  Settings,
  Moon,
  Sun,
  Trash2,
  Upload,
  FolderOpen,
  Users,
  History,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { useChatStore } from '@/store/chat-store';

interface CommandPaletteProps {
  onToggleTheme?: () => void;
  onNavigate?: (view: string) => void;
  isDark?: boolean;
}

export function CommandPalette({ onToggleTheme, onNavigate, isDark }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const { clearChat, currentSession, createNewSession, sessions } = useChatStore();
  const session = currentSession();
  const messages = session?.messages || [];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const handleNavigate = (view: string) => {
    onNavigate?.(view);
  };

  const handleNewChat = () => {
    createNewSession();
    handleNavigate('chat');
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(handleNewChat)}>
            <Plus className="mr-2 h-4 w-4" />
            <span>New Chat</span>
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => {
            handleNavigate('chat');
            // Focus the chat input after navigation
            setTimeout(() => {
              const input = document.querySelector('textarea');
              input?.focus();
            }, 100);
          })}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Continue Chat</span>
            <CommandShortcut>Enter</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => {
            alert('Upload feature coming soon!');
          })}>
            <Upload className="mr-2 h-4 w-4" />
            <span>Upload Document</span>
            <CommandShortcut>U</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => {
            alert('Advanced search coming soon!');
          })}>
            <Search className="mr-2 h-4 w-4" />
            <span>Search Documents</span>
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => handleNavigate('chat'))}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Chat</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => handleNavigate('history'))}>
            <History className="mr-2 h-4 w-4" />
            <span>Chat History</span>
            {sessions.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
              </span>
            )}
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => handleNavigate('documents'))}>
            <FolderOpen className="mr-2 h-4 w-4" />
            <span>Documents</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => handleNavigate('family'))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Family Members</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Categories">
          <CommandItem onSelect={() => runCommand(() => handleNavigate('category-financial'))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Financial</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => handleNavigate('category-medical'))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Medical</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => handleNavigate('category-legal'))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Legal</span>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(() => handleNavigate('category-insurance'))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Insurance</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          {onToggleTheme && (
            <CommandItem onSelect={() => runCommand(onToggleTheme)}>
              {isDark ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              <CommandShortcut>T</CommandShortcut>
            </CommandItem>
          )}

          <CommandItem onSelect={() => runCommand(() => handleNavigate('settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>,</CommandShortcut>
          </CommandItem>

          {messages.length > 0 && (
            <CommandItem
              onSelect={() => runCommand(clearChat)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>New Chat (Clear Current)</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Help">
          <CommandItem onSelect={() => runCommand(() => {
            alert('Help documentation coming soon!');
          })}>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Help & Documentation</span>
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

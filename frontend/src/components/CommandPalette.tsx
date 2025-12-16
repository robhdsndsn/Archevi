import { useState, forwardRef, useImperativeHandle, useCallback } from 'react';
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
import { useKeyboardShortcuts, type KeyboardShortcut, KEYBOARD_SHORTCUTS, getModifierKey } from '@/hooks/use-keyboard-shortcuts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CommandPaletteProps {
  onToggleTheme?: () => void;
  onNavigate?: (view: string) => void;
  isDark?: boolean;
}

export interface CommandPaletteRef {
  open: () => void;
}

export const CommandPalette = forwardRef<CommandPaletteRef, CommandPaletteProps>(
  function CommandPalette({ onToggleTheme, onNavigate, isDark }, ref) {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
  }));
  const { clearChat, currentSession, createNewSession, sessions } = useChatStore();
  const session = currentSession();
  const messages = session?.messages || [];

  const handleNavigate = useCallback((view: string) => {
    onNavigate?.(view);
  }, [onNavigate]);

  const handleNewChat = useCallback(() => {
    createNewSession();
    handleNavigate('chat');
  }, [createNewSession, handleNavigate]);

  const handleUpload = useCallback(() => {
    onNavigate?.('documents');
    // Small delay to ensure navigation completes before we can trigger tab change
    setTimeout(() => {
      // Dispatch custom event that DocumentsView can listen for
      window.dispatchEvent(new CustomEvent('archevi:navigate-documents-tab', { detail: { tab: 'add' } }));
    }, 50);
  }, [onNavigate]);

  const handleSearch = useCallback(() => {
    onNavigate?.('documents');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('archevi:navigate-documents-tab', { detail: { tab: 'search' } }));
    }, 50);
  }, [onNavigate]);

  const handleSettings = useCallback(() => {
    onNavigate?.('settings');
  }, [onNavigate]);

  const handleHelp = useCallback(() => {
    setHelpOpen(true);
  }, []);

  // Register global keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    { key: 'k', meta: true, handler: () => setOpen(o => !o), description: 'Toggle command palette' },
    { key: 'n', meta: true, handler: handleNewChat, description: 'New chat' },
    { key: 'u', meta: true, handler: handleUpload, description: 'Upload document' },
    { key: '/', meta: true, handler: handleSearch, description: 'Search documents' },
    { key: ',', meta: true, handler: handleSettings, description: 'Open settings' },
    { key: '?', meta: true, shift: true, handler: handleHelp, description: 'Show help' },
    { key: 'Escape', handler: () => { setOpen(false); setHelpOpen(false); }, description: 'Close dialogs' },
  ];

  useKeyboardShortcuts(shortcuts);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
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

          <CommandItem onSelect={() => runCommand(handleUpload)}>
            <Upload className="mr-2 h-4 w-4" />
            <span>Upload Document</span>
            <CommandShortcut>U</CommandShortcut>
          </CommandItem>

          <CommandItem onSelect={() => runCommand(handleSearch)}>
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

          <CommandItem onSelect={() => runCommand(handleSettings)}>
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
          <CommandItem onSelect={() => runCommand(handleHelp)}>
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Keyboard Shortcuts</span>
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>

    {/* Help Dialog - Keyboard Shortcuts */}
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Quick access to common actions
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50"
              >
                <span className="text-sm">{shortcut.description}</span>
                <kbd className="pointer-events-none h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium inline-flex">
                  <span>{getModifierKey()}</span>
                  {shortcut.modifier.includes('Shift') && <span>+Shift</span>}
                  <span>+{shortcut.key}</span>
                </kbd>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Press <kbd className="px-1 py-0.5 rounded border bg-muted text-[10px] font-mono">Esc</kbd> to close any dialog
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
});

// Search button component for the header
export function SearchButton({ onClick }: { onClick: () => void }) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">{isMac ? '\u2318' : 'Ctrl'}</span>K
      </kbd>
    </button>
  );
}

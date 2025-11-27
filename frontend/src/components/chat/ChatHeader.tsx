import { Trash2, Archive, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  onClear: () => void;
  messageCount: number;
}

export function ChatHeader({ onClear, messageCount }: ChatHeaderProps) {
  const openCommandPalette = () => {
    // Trigger the keyboard shortcut programmatically
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-2">
        <Archive className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-semibold">Archevi</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={openCommandPalette}
          className="hidden sm:flex items-center gap-2 text-muted-foreground"
        >
          <Command className="h-3 w-3" />
          <span className="text-xs">K</span>
        </Button>

        {messageCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Chat
          </Button>
        )}
      </div>
    </header>
  );
}

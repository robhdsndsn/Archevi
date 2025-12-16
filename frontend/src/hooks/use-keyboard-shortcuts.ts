import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description?: string;
}

/**
 * Hook for registering global keyboard shortcuts
 *
 * Shortcuts are defined with:
 * - key: The key to listen for (lowercase)
 * - ctrl/meta: Require Ctrl (Windows) or Cmd (Mac)
 * - shift: Require Shift key
 * - alt: Require Alt/Option key
 * - handler: Function to call when shortcut is triggered
 *
 * The hook automatically handles Mac vs Windows modifier keys
 * (meta = Cmd on Mac, ctrl = Ctrl on Windows)
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs/textareas
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' ||
                      target.tagName === 'TEXTAREA' ||
                      target.isContentEditable;

      // Allow some shortcuts even in inputs (like Cmd+K for command palette)
      const alwaysAllow = ['k', 'Escape'];

      for (const shortcut of shortcuts) {
        // Check if the key matches (case-insensitive)
        if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) continue;

        // Check modifier keys
        // meta OR ctrl satisfies the "command" modifier (cross-platform)
        const needsCommandKey = shortcut.ctrl || shortcut.meta;
        const hasCommandKey = event.metaKey || event.ctrlKey;

        if (needsCommandKey && !hasCommandKey) continue;
        if (!needsCommandKey && hasCommandKey) continue;

        if (shortcut.shift && !event.shiftKey) continue;
        if (!shortcut.shift && event.shiftKey) continue;

        if (shortcut.alt && !event.altKey) continue;
        if (!shortcut.alt && event.altKey) continue;

        // If in input and not in alwaysAllow list, skip
        if (isInput && !alwaysAllow.includes(shortcut.key)) continue;

        // Trigger the handler
        event.preventDefault();
        shortcut.handler();
        return;
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * List of all keyboard shortcuts in the app for documentation
 */
export const KEYBOARD_SHORTCUTS = [
  { key: 'K', modifier: 'Cmd/Ctrl', description: 'Open command palette' },
  { key: 'N', modifier: 'Cmd/Ctrl', description: 'New chat' },
  { key: 'U', modifier: 'Cmd/Ctrl', description: 'Upload document' },
  { key: '/', modifier: 'Cmd/Ctrl', description: 'Search documents' },
  { key: ',', modifier: 'Cmd/Ctrl', description: 'Open settings' },
  { key: '?', modifier: 'Cmd/Ctrl+Shift', description: 'Show help' },
] as const;

/**
 * Get the platform-specific modifier key label
 */
export function getModifierKey(): string {
  if (typeof navigator === 'undefined') return 'Ctrl';
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? '\u2318' : 'Ctrl';
}

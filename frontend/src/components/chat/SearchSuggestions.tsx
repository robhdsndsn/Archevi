import { useState, useEffect, useCallback, useRef } from 'react';
import { windmill } from '@/api/windmill';
import { useAuthStore } from '@/store/auth-store';
import type { SearchSuggestion, SearchSuggestionType } from '@/api/windmill/types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { FileText, User, Tag, Clock, Database, FolderOpen, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Default tenant for MVP
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

interface SearchSuggestionsProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Icon mapping for suggestion types
const suggestionIcons: Record<SearchSuggestionType, React.ReactNode> = {
  document: <FileText className="h-4 w-4 text-blue-500" />,
  person: <User className="h-4 w-4 text-green-500" />,
  tag: <Tag className="h-4 w-4 text-purple-500" />,
  recent: <Clock className="h-4 w-4 text-orange-500" />,
  entity: <Database className="h-4 w-4 text-cyan-500" />,
  category: <FolderOpen className="h-4 w-4 text-yellow-500" />,
};

// Group labels for suggestion types
const groupLabels: Record<SearchSuggestionType, string> = {
  document: 'Documents',
  person: 'People',
  tag: 'Tags',
  recent: 'Recent Searches',
  entity: 'Extracted Data',
  category: 'Categories',
};

export function SearchSuggestions({
  onSubmit,
  isLoading,
  placeholder = 'Ask Archevi...',
}: SearchSuggestionsProps) {
  const { user } = useAuthStore();
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;
  const userEmail = user?.email;

  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the input for API calls
  const debouncedInput = useDebounce(input, 200);

  // Fetch suggestions when debounced input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      // Only fetch if we have at least 2 characters
      if (debouncedInput.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsFetchingSuggestions(true);
      try {
        const result = await windmill.getSearchSuggestions({
          query_prefix: debouncedInput,
          tenant_id: tenantId,
          user_email: userEmail,
          limit: 10,
        });

        if (result.success && result.suggestions.length > 0) {
          setSuggestions(result.suggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('[SearchSuggestions] Failed to fetch:', error);
        setSuggestions([]);
      } finally {
        setIsFetchingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedInput, tenantId, userEmail]);

  // Group suggestions by type
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.type]) {
      acc[suggestion.type] = [];
    }
    acc[suggestion.type].push(suggestion);
    return acc;
  }, {} as Record<SearchSuggestionType, SearchSuggestion[]>);

  const handleSelect = useCallback((value: string) => {
    setInput(value);
    setShowSuggestions(false);
    // Focus back on input after selection
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (trimmed && !isLoading) {
      onSubmit(trimmed);
      setInput('');
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [input, isLoading, onSubmit]);

  // Keep input focused after loading completes
  useEffect(() => {
    if (!isLoading) {
      // Small delay to ensure React has finished updating
      const timer = setTimeout(() => {
        const inputEl = document.querySelector('[cmdk-input]') as HTMLInputElement;
        inputEl?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle Enter without suggestions showing
    if (e.key === 'Enter' && !e.shiftKey && !showSuggestions) {
      e.preventDefault();
      handleSubmit();
    }
    // Escape closes suggestions
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [handleSubmit, showSuggestions]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    // Don't show suggestions immediately - wait for debounce
  }, []);

  const handleFocus = useCallback(() => {
    // Show suggestions if we have some and input is long enough
    if (suggestions.length > 0 && input.length >= 2) {
      setShowSuggestions(true);
    }
  }, [suggestions.length, input.length]);

  return (
    <div className="border-t bg-background p-4" role="region" aria-label="Chat input with suggestions">
      <span id="chat-input-hint" className="sr-only">
        Press Enter to send, type to see suggestions
      </span>
      <div className="relative">
        <Command
          className="rounded-lg border border-input shadow-sm"
          shouldFilter={false}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center w-full">
            <CommandInput
              ref={inputRef}
              value={input}
              onValueChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={() => {
                // Delay hiding to allow click on suggestion
                setTimeout(() => setShowSuggestions(false), 300);
              }}
              placeholder={placeholder}
              disabled={isLoading}
              className="h-12 flex-1 border-0 focus:ring-0 text-base"
              aria-describedby="chat-input-hint"
            />
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-9 w-9 mr-2 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              aria-label={isLoading ? "Sending message..." : "Send message"}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <CommandList className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-input rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
              {isFetchingSuggestions && (
                <div className="flex items-center justify-center p-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Loading...
                </div>
              )}

              <CommandEmpty>No suggestions found.</CommandEmpty>

              {/* Render grouped suggestions */}
              {Object.entries(groupedSuggestions).map(([type, items]) => (
                <CommandGroup
                  key={type}
                  heading={groupLabels[type as SearchSuggestionType]}
                >
                  {items.map((suggestion, index) => (
                    <CommandItem
                      key={`${type}-${index}-${suggestion.value}`}
                      value={suggestion.value}
                      onSelect={() => handleSelect(suggestion.value)}
                      onMouseDown={(e) => {
                        // Prevent blur from firing before selection
                        e.preventDefault();
                        handleSelect(suggestion.value);
                      }}
                      className="flex items-center gap-2 cursor-pointer hover:bg-accent"
                    >
                      {suggestionIcons[suggestion.type]}
                      <span className="flex-1 truncate">{suggestion.label}</span>
                      {suggestion.document_id && (
                        <span className="text-xs text-muted-foreground">
                          #{suggestion.document_id}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          )}
        </Command>
      </div>
    </div>
  );
}

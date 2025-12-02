import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { X, Plus, Sparkles, Loader2, CheckIcon, Tag, Calendar, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExpiryDate } from '@/api/windmill/types';

export interface TagSuggestionsResult {
  suggested_category: string;
  category_confidence: number;
  suggested_tags: string[];
  existing_tags_matched: string[];
  new_tags_suggested: string[];
  expiry_dates: ExpiryDate[];
  tokens_used: number;
}

interface TagSuggestionsProps {
  suggestions: TagSuggestionsResult | null;
  isLoading?: boolean;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  availableCategories: { value: string; label: string }[];
  onAcceptAll?: () => void;
}

export function TagSuggestions({
  suggestions,
  isLoading,
  selectedTags,
  onTagsChange,
  selectedCategory,
  onCategoryChange,
  availableCategories: _availableCategories,
  onAcceptAll,
}: TagSuggestionsProps) {
  void _availableCategories; // Reserved for future category filtering
  const [newTagInput, setNewTagInput] = useState('');
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim().replace(/\s+/g, '-');
    if (normalizedTag && !selectedTags.includes(normalizedTag)) {
      onTagsChange([...selectedTags, normalizedTag]);
    }
    setNewTagInput('');
  };

  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  const handleAcceptAll = () => {
    if (suggestions) {
      // Add all suggested tags
      const newTags = new Set([...selectedTags, ...suggestions.suggested_tags]);
      onTagsChange(Array.from(newTags));

      // Set suggested category if none selected
      if (!selectedCategory && suggestions.suggested_category) {
        onCategoryChange(suggestions.suggested_category);
      }

      onAcceptAll?.();
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Analyzing document for tags and category...</span>
        </div>
      </div>
    );
  }

  if (!suggestions) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Suggestions
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAcceptAll}
          className="gap-1"
        >
          <CheckIcon className="h-3 w-3" />
          Accept All
        </Button>
      </div>

      {/* Category Suggestion */}
      {suggestions.suggested_category && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Suggested Category:</span>
            <Badge
              variant={selectedCategory === suggestions.suggested_category ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => onCategoryChange(suggestions.suggested_category)}
            >
              {suggestions.suggested_category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              ({Math.round(suggestions.category_confidence * 100)}% confidence)
            </span>
          </div>
        </div>
      )}

      {/* Tag Suggestions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Suggested Tags:</span>
        </div>

        {/* Suggested tags to add */}
        <div className="flex flex-wrap gap-1.5">
          {suggestions.suggested_tags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            const isExisting = suggestions.existing_tags_matched.includes(tag);

            return (
              <Badge
                key={tag}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  !isSelected && "hover:bg-primary/10",
                  isExisting && !isSelected && "border-green-500/50 text-green-700 dark:text-green-400"
                )}
                onClick={() => isSelected ? removeTag(tag) : addTag(tag)}
              >
                {isExisting && !isSelected && (
                  <CheckIcon className="h-3 w-3 mr-1 text-green-500" />
                )}
                {tag}
                {isSelected && (
                  <X className="h-3 w-3 ml-1 hover:text-destructive" />
                )}
              </Badge>
            );
          })}
        </div>

        {suggestions.existing_tags_matched.length > 0 && (
          <p className="text-xs text-muted-foreground">
            <CheckIcon className="h-3 w-3 inline mr-1 text-green-500" />
            Tags with green border already exist in your collection
          </p>
        )}
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">Selected Tags:</span>
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="default" className="gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Tag */}
      <div className="flex items-center gap-2">
        <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Plus className="h-3 w-3" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search or add tag..."
                value={newTagInput}
                onValueChange={setNewTagInput}
              />
              <CommandList>
                <CommandEmpty>
                  {newTagInput && (
                    <div
                      className="p-2 text-sm cursor-pointer hover:bg-accent rounded"
                      onClick={() => {
                        addTag(newTagInput);
                        setTagPopoverOpen(false);
                      }}
                    >
                      Create "{newTagInput}"
                    </div>
                  )}
                </CommandEmpty>
                {suggestions.existing_tags_matched.length > 0 && (
                  <CommandGroup heading="Existing Tags">
                    {suggestions.existing_tags_matched
                      .filter(tag => !selectedTags.includes(tag))
                      .map((tag) => (
                        <CommandItem
                          key={tag}
                          value={tag}
                          onSelect={() => {
                            addTag(tag);
                            setTagPopoverOpen(false);
                          }}
                        >
                          {tag}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
                {suggestions.new_tags_suggested.length > 0 && (
                  <CommandGroup heading="New Suggestions">
                    {suggestions.new_tags_suggested
                      .filter(tag => !selectedTags.includes(tag))
                      .map((tag) => (
                        <CommandItem
                          key={tag}
                          value={tag}
                          onSelect={() => {
                            addTag(tag);
                            setTagPopoverOpen(false);
                          }}
                        >
                          <Sparkles className="h-3 w-3 mr-2 text-primary" />
                          {tag}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Input
          placeholder="Type and press Enter..."
          value={newTagInput}
          onChange={(e) => setNewTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newTagInput.trim()) {
              e.preventDefault();
              addTag(newTagInput);
            }
          }}
          className="flex-1 h-8 text-sm"
        />
      </div>

      {/* Expiry Dates */}
      {suggestions.expiry_dates && suggestions.expiry_dates.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Detected Dates:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.expiry_dates.map((date, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {date.type}: {date.date}
                <span className="ml-1 text-muted-foreground">
                  ({Math.round(date.confidence * 100)}%)
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

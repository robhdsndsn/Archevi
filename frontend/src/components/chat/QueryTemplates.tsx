import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Lightbulb, ChevronRight, Sparkles } from 'lucide-react';
import {
  QUERY_TEMPLATES,
  FEATURED_TEMPLATES,
  type QueryTemplate,
  type TemplateCategory,
} from './query-templates';

interface QueryTemplatesProps {
  onSelect: (query: string) => void;
  disabled?: boolean;
  className?: string;
}

// Featured templates shown directly in the welcome screen
export function FeaturedTemplates({ onSelect, disabled, className }: QueryTemplatesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSelect = (query: string) => {
    onSelect(query);
    setIsDialogOpen(false);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Featured quick-access templates */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-xs">Try asking</span>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {FEATURED_TEMPLATES.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              size="sm"
              onClick={() => onSelect(template.query)}
              disabled={disabled}
              className={cn(
                'h-auto py-2 px-3 text-sm font-normal',
                'bg-background hover:bg-muted/50',
                'border-border/50 hover:border-border',
                'transition-all duration-200',
                'hover:shadow-sm'
              )}
            >
              {template.query}
            </Button>
          ))}
        </div>
      </div>

      {/* More suggestions button with dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            disabled={disabled}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            More suggestions
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Query Templates
            </DialogTitle>
            <DialogDescription>
              Choose a question to ask about your documents. Click to use it.
            </DialogDescription>
          </DialogHeader>
          <TemplatesBrowser onSelect={handleSelect} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Full templates browser with tabs
function TemplatesBrowser({ onSelect }: { onSelect: (query: string) => void }) {
  return (
    <Tabs defaultValue={QUERY_TEMPLATES[0].id} className="w-full">
      <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
        {QUERY_TEMPLATES.map((category) => {
          const Icon = category.icon;
          return (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="gap-1.5 text-xs sm:text-sm"
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {QUERY_TEMPLATES.map((category) => (
        <TabsContent key={category.id} value={category.id} className="mt-4">
          <CategoryTemplates category={category} onSelect={onSelect} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

// Templates for a single category
function CategoryTemplates({
  category,
  onSelect,
}: {
  category: TemplateCategory;
  onSelect: (query: string) => void;
}) {
  const Icon = category.icon;

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
          <Icon className="h-4 w-4" />
          {category.name} Questions
        </div>
        {category.templates.map((template) => (
          <TemplateItem key={template.id} template={template} onSelect={onSelect} />
        ))}
      </div>
    </ScrollArea>
  );
}

// Single template item
function TemplateItem({
  template,
  onSelect,
}: {
  template: QueryTemplate;
  onSelect: (query: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(template.query)}
      className={cn(
        'w-full text-left p-3 rounded-lg',
        'border border-transparent',
        'hover:bg-accent hover:border-border/50',
        'transition-all duration-150',
        'group'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium group-hover:text-primary transition-colors">
            {template.query}
          </p>
          {template.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {template.description}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
      </div>
    </button>
  );
}

// Compact inline templates (for use alongside chat input)
export function InlineTemplates({ onSelect, disabled, className }: QueryTemplatesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Show just 3 quick templates inline
  const quickTemplates = FEATURED_TEMPLATES.slice(0, 3);

  const handleSelect = (query: string) => {
    onSelect(query);
    setIsDialogOpen(false);
  };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {quickTemplates.map((template) => (
        <Button
          key={template.id}
          variant="ghost"
          size="sm"
          onClick={() => onSelect(template.query)}
          disabled={disabled}
          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          {template.query.length > 25
            ? template.query.slice(0, 25) + '...'
            : template.query}
        </Button>
      ))}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs text-muted-foreground"
            disabled={disabled}
          >
            <Lightbulb className="h-3 w-3 mr-1" />
            More
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Query Templates
            </DialogTitle>
            <DialogDescription>
              Choose a question to ask about your documents.
            </DialogDescription>
          </DialogHeader>
          <TemplatesBrowser onSelect={handleSelect} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

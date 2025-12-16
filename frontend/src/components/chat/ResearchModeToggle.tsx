import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Zap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Storage key for persistence
const STORAGE_KEY = 'archevi-research-mode';

// Model mapping for each mode
export const RESEARCH_MODE_MODELS = {
  quick: 'llama-3.3-70b-versatile',    // Fast, good for simple questions
  deep: 'command-a-03-2025',            // Thorough, better reasoning (256K context)
} as const;

export type ResearchMode = keyof typeof RESEARCH_MODE_MODELS;

interface ResearchModeToggleProps {
  value: ResearchMode;
  onChange: (mode: ResearchMode) => void;
  disabled?: boolean;
}

export function ResearchModeToggle({ value, onChange, disabled }: ResearchModeToggleProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5 p-1 bg-muted/80 rounded-lg border border-border/50">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange('quick')}
              disabled={disabled}
              className={cn(
                'h-7 px-3 gap-1.5 rounded-md transition-all',
                value === 'quick'
                  ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Quick</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="font-medium">Quick Mode</p>
            <p className="text-xs text-muted-foreground">Fast answers for simple questions</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange('deep')}
              disabled={disabled}
              className={cn(
                'h-7 px-3 gap-1.5 rounded-md transition-all',
                value === 'deep'
                  ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Deep</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="font-medium">Deep Research</p>
            <p className="text-xs text-muted-foreground">Thorough analysis for complex questions</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

// Hook for persisting research mode preference
export function useResearchMode() {
  const [mode, setMode] = useState<ResearchMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'quick' || stored === 'deep') {
        return stored;
      }
    }
    return 'quick'; // Default to quick mode
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // Return mode, setter, and the corresponding model ID
  const modelId = RESEARCH_MODE_MODELS[mode];

  return [mode, setMode, modelId] as const;
}

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { AVAILABLE_AI_MODELS, DEFAULT_AI_MODEL, type AIModelInfo } from '@/api/windmill/types';
import { Brain, Zap, Image } from 'lucide-react';

const STORAGE_KEY = 'archevi-preferred-model';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function ModelSelector({ value, onChange, disabled, compact }: ModelSelectorProps) {
  const selectedModel = AVAILABLE_AI_MODELS.find(m => m.id === value);

  // Group models by provider
  const groqModels = AVAILABLE_AI_MODELS.filter(m => m.provider === 'groq');
  const cohereModels = AVAILABLE_AI_MODELS.filter(m => m.provider === 'cohere');

  const ModelIcon = ({ model }: { model: AIModelInfo }) => {
    if (model.multimodal) return <Image className="h-3 w-3" />;
    if (model.provider === 'groq') return <Zap className="h-3 w-3" />;
    return <Brain className="h-3 w-3" />;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
              <SelectTrigger
                className={compact ? 'h-8 w-[180px] text-xs' : 'w-[220px]'}
              >
                <div className="flex items-center gap-2">
                  {selectedModel && <ModelIcon model={selectedModel} />}
                  <SelectValue placeholder="Select model">
                    {selectedModel?.name || 'Select model'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2">
                    <Zap className="h-3 w-3" /> Groq (Fast)
                  </SelectLabel>
                  {groqModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between gap-2 w-full">
                        <div className="flex items-center gap-2">
                          <ModelIcon model={model} />
                          <span>{model.name}</span>
                        </div>
                        {model.multimodal && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            Vision
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="flex items-center gap-2">
                    <Brain className="h-3 w-3" /> Cohere (Reliable)
                  </SelectLabel>
                  {cohereModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <ModelIcon model={model} />
                        <span>{model.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[280px]">
          {selectedModel ? (
            <div className="space-y-1">
              <p className="font-medium">{selectedModel.name}</p>
              <p className="text-xs text-muted-foreground">{selectedModel.description}</p>
              <div className="flex gap-2 text-xs">
                <span>{Math.round(selectedModel.contextLength / 1000)}K context</span>
                {selectedModel.multimodal && <span>Multimodal</span>}
              </div>
            </div>
          ) : (
            <p>Choose an AI model for your queries</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Hook for persisting model preference
export function useModelPreference() {
  const [model, setModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_AI_MODEL;
    }
    return DEFAULT_AI_MODEL;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, model);
  }, [model]);

  return [model, setModel] as const;
}

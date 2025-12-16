import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  MessageSquare,
  Upload,
  FolderOpen,
  Search,
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  Keyboard,
} from 'lucide-react';

const TOUR_STORAGE_KEY = 'archevi_onboarding_complete';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Archevi',
    description: "Your family's AI-powered document assistant. Let's take a quick tour of the key features.",
    icon: <Sparkles className="h-8 w-8 text-primary" />,
    position: 'center',
  },
  {
    id: 'ask-ai',
    title: 'Ask AI',
    description: 'Ask natural language questions about your documents. The AI searches your archive and provides answers with source citations.',
    icon: <MessageSquare className="h-8 w-8 text-blue-500" />,
    position: 'center',
  },
  {
    id: 'upload',
    title: 'Upload Documents',
    description: 'Add PDFs, photos, voice notes, or paste text. The AI automatically extracts text, suggests categories, and detects expiry dates.',
    icon: <Upload className="h-8 w-8 text-green-500" />,
    position: 'center',
  },
  {
    id: 'browse',
    title: 'Browse & Search',
    description: 'View all your documents in a table or grid. Filter by category, date, person, or use AI-powered semantic search.',
    icon: <FolderOpen className="h-8 w-8 text-orange-500" />,
    position: 'center',
  },
  {
    id: 'search',
    title: 'AI-Powered Search',
    description: 'Go beyond keyword search. Ask questions like "What\'s my insurance policy number?" and get intelligent answers.',
    icon: <Search className="h-8 w-8 text-purple-500" />,
    position: 'center',
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'Power users can use Cmd/Ctrl+K for the command palette, Cmd+U to upload, Cmd+N for new chat, and Cmd+Shift+? for help.',
    icon: <Keyboard className="h-8 w-8 text-slate-500" />,
    position: 'center',
  },
];

interface OnboardingTourProps {
  steps?: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  forceShow?: boolean; // For testing/demo purposes
}

export function OnboardingTour({
  steps = DEFAULT_TOUR_STEPS,
  onComplete,
  onSkip,
  forceShow = false,
}: OnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Check if tour should be shown
  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      return;
    }

    const hasCompletedTour = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!hasCompletedTour) {
      // Small delay to let the app render first
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [forceShow]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Tour complete
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setIsVisible(false);
      onComplete?.();
    }
  }, [currentStep, steps.length, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setIsVisible(false);
    onSkip?.();
  }, [onSkip]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleNext, handlePrevious, handleSkip]);

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Tour Card */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
          <CardHeader className="relative pb-2">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Skip tour</span>
            </Button>

            <div className="flex items-center gap-4">
              <div className="shrink-0 p-3 rounded-xl bg-muted">
                {step.icon}
              </div>
              <div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-4">
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>

            {/* Progress bar */}
            <div className="mt-4">
              <Progress value={progress} className="h-1.5" />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between gap-2 pt-0">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSkip}>
                Skip
              </Button>
              <Button onClick={handleNext} className="gap-1">
                {isLastStep ? "Get Started" : "Next"}
                {!isLastStep && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Step indicators (dots) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentStep
                ? 'bg-primary w-6'
                : index < currentStep
                ? 'bg-primary/60'
                : 'bg-muted-foreground/30'
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}

/**
 * Hook to manually trigger the onboarding tour
 */
export function useOnboardingTour() {
  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    window.location.reload();
  }, []);

  const hasCompletedTour = useCallback(() => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  }, []);

  return { resetTour, hasCompletedTour };
}

/**
 * Check if onboarding should show (for conditional rendering)
 */
export function shouldShowOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TOUR_STORAGE_KEY) !== 'true';
}

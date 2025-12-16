import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Volume2, Settings2,  Square, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BrowserVoice {
  name: string;
  lang: string;
  voiceURI: string;
}

interface TextToSpeechProps {
  /** Text to convert to speech */
  text: string;
  /** Title for display */
  title?: string;
  /** Compact mode - just a button */
  compact?: boolean;
  /** Custom class name */
  className?: string;
  /** Maximum characters (default: 10000 for browser TTS - it's free!) */
  maxChars?: number;
}

export function TextToSpeech({
  text,

  compact = false,
  className,
  maxChars = 10000,
}: TextToSpeechProps) {
  const [voices, setVoices] = useState<BrowserVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Voice settings
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Load browser voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        // Filter to English voices and sort by quality indicators
        const englishVoices = availableVoices
          .filter(v => v.lang.startsWith('en'))
          .map(v => ({
            name: v.name,
            lang: v.lang,
            voiceURI: v.voiceURI,
          }))
          .sort((a, b) => {
            // Prefer "natural" or "premium" voices
            const aScore = a.name.toLowerCase().includes('natural') ||
                          a.name.toLowerCase().includes('premium') ? 1 : 0;
            const bScore = b.name.toLowerCase().includes('natural') ||
                          b.name.toLowerCase().includes('premium') ? 1 : 0;
            return bScore - aScore;
          });

        setVoices(englishVoices);

        // Select first voice as default
        if (englishVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(englishVoices[0].voiceURI);
        }
        setIsLoadingVoices(false);
      }
    };

    // Voices may not be immediately available
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      stopSpeaking();
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const togglePause = useCallback(() => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  const handleSpeak = useCallback(() => {
    if (!text.trim()) {
      toast.error('No text to speak');
      return;
    }

    // If already speaking, stop
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    // Truncate text if too long
    const textToSpeak = text.slice(0, maxChars);
    if (text.length > maxChars) {
      toast.warning(`Text truncated to ${maxChars.toLocaleString()} characters`);
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    // Set voice
    const voice = window.speechSynthesis.getVoices().find(v => v.voiceURI === selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }

    // Set rate and pitch
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);

      // Estimate progress based on time and rate
      const estimatedDuration = (textToSpeak.length / 15) / rate; // ~15 chars/sec at rate 1
      let elapsed = 0;
      progressIntervalRef.current = window.setInterval(() => {
        elapsed += 0.1;
        const pct = Math.min((elapsed / estimatedDuration) * 100, 99);
        setProgress(pct);
      }, 100);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setProgress(100);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Reset progress after a moment
      setTimeout(() => setProgress(0), 1000);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      stopSpeaking();
      // Don't show error for user-initiated stops (cancel/interrupt)
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        toast.error('Speech synthesis failed');
      }
    };

    // Speak
    window.speechSynthesis.speak(utterance);
  }, [text, maxChars, selectedVoice, rate, pitch, isSpeaking, stopSpeaking]);

  // Compact mode - simple button
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSpeak}
          disabled={!text.trim() || isLoadingVoices}
        >
          {isSpeaking ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4 mr-2" />
              Listen
            </>
          )}
        </Button>
        {isSpeaking && (
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePause}
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Voice selector */}
        <Select
          value={selectedVoice}
          onValueChange={setSelectedVoice}
          disabled={isLoadingVoices || isSpeaking}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={isLoadingVoices ? "Loading voices..." : "Select voice"} />
          </SelectTrigger>
          <SelectContent>
            {voices.map((voice) => (
              <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                <div className="flex flex-col">
                  <span className="truncate max-w-[180px]">{voice.name}</span>
                  <span className="text-xs text-muted-foreground">{voice.lang}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Settings popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" disabled={isSpeaking}>
              <Settings2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-4">
              <h4 className="font-medium">Voice Settings</h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Speed</Label>
                  <span className="text-xs text-muted-foreground">{rate.toFixed(1)}x</span>
                </div>
                <Slider
                  value={[rate]}
                  onValueChange={([v]) => setRate(v)}
                  min={0.5}
                  max={2}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Pitch</Label>
                  <span className="text-xs text-muted-foreground">{pitch.toFixed(1)}</span>
                </div>
                <Slider
                  value={[pitch]}
                  onValueChange={([v]) => setPitch(v)}
                  min={0.5}
                  max={2}
                  step={0.1}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Using your browser's built-in text-to-speech engine (free).
              </p>
            </div>
          </PopoverContent>
        </Popover>

        {/* Play/Stop button */}
        <Button
          onClick={handleSpeak}
          disabled={!text.trim() || isLoadingVoices}
          variant={isSpeaking ? "destructive" : "default"}
        >
          {isSpeaking ? (
            <>
              <Square className="h-4 w-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4 mr-2" />
              Listen
            </>
          )}
        </Button>

        {/* Pause/Resume when speaking */}
        {isSpeaking && (
          <Button
            variant="outline"
            onClick={togglePause}
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {(isSpeaking || progress > 0) && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-muted-foreground">
        {text.length.toLocaleString()} characters
        {text.length > maxChars && (
          <span className="text-amber-500 ml-1">
            (will be truncated to {maxChars.toLocaleString()})
          </span>
        )}
        <span className="mx-2">-</span>
        <span className="text-green-600 dark:text-green-400">Free browser TTS</span>
      </p>
    </div>
  );
}

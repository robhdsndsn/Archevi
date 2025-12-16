import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Mic, Square, Upload, Loader2, CheckCircle2, Trash2, Play, Pause, FileAudio } from 'lucide-react';
import { windmill } from '@/api/windmill';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Default tenant for MVP - The Hudson Family
// TODO: Remove this when auth properly returns tenant_id
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

interface VoiceNoteRecorderProps {
  onSuccess?: () => void;
}

export function VoiceNoteRecorder({ onSuccess }: VoiceNoteRecorderProps) {
  const { user } = useAuthStore();
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [title, setTitle] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setDuration(0);
      setError(null);
      setSuccess(null);
      setUploadedFile(null);

      // Start timer
      timerRef.current = window.setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      setError('Could not access microphone. Please check permissions.');
      console.error('Microphone access error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/wav', 'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/m4a'];
    const validExtensions = ['.wav', '.webm', '.mp3', '.ogg', '.m4a', '.mp4'];

    const isValidType = validTypes.includes(file.type) ||
                        validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      setError('Supported formats: WAV, WebM, MP3, OGG, M4A');
      return;
    }

    // Clear any existing recording
    if (audioUrl) URL.revokeObjectURL(audioUrl);

    setUploadedFile(file);
    setAudioBlob(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setError(null);
    setSuccess(null);

    // Try to get duration from file
    const audio = new Audio(url);
    audio.onloadedmetadata = () => {
      setDuration(Math.round(audio.duration));
    };

    if (!title) {
      setTitle(file.name.replace(/\.(wav|webm|mp3|ogg|m4a|mp4)$/i, ''));
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const clearRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!audioBlob) {
      setError('No audio to upload');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const audioContent = await base64Promise;
      const filename = uploadedFile?.name || `voice_note_${Date.now()}.webm`;

      const result = await windmill.transcribeVoiceNote({
        audio_content: audioContent,
        tenant_id: tenantId,
        filename,
        title: title.trim() || undefined,
        category: 'personal',  // Default category for voice notes
      });

      setSuccess(`Transcribed: "${result.title}" (${result.duration_seconds}s)`);
      toast.success('Voice note saved', {
        description: `Transcribed ${result.duration_seconds}s of audio. Tags: ${result.tags.join(', ') || 'none'}`,
      });

      // Reset form
      clearRecording();
      setTitle('');
      onSuccess?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to transcribe voice note';
      setError(errorMsg);
      toast.error('Transcription failed', { description: errorMsg });
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Note
        </CardTitle>
        <CardDescription>
          Record or upload a voice memo to transcribe and add to the knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 dark:text-green-400 rounded-md flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex flex-col items-center gap-5 sm:gap-4 py-6 sm:py-4">
          {isRecording ? (
            <>
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75" />
                <Button
                  type="button"
                  size="lg"
                  variant="destructive"
                  className="relative rounded-full h-24 w-24 sm:h-20 sm:w-20"
                  onClick={stopRecording}
                  aria-label="Stop recording"
                >
                  <Square className="h-10 w-10 sm:h-8 sm:w-8" aria-hidden="true" />
                </Button>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-3xl font-mono">{formatDuration(duration)}</div>
                <div className="text-base sm:text-sm text-muted-foreground font-medium mt-1">
                  Tap to stop
                </div>
              </div>
            </>
          ) : audioBlob ? (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full max-w-xs">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="rounded-full h-20 w-20 sm:h-16 sm:w-16 shrink-0"
                  onClick={togglePlayback}
                  aria-label={isPlaying ? "Pause playback" : "Play recording"}
                >
                  {isPlaying ? <Pause className="h-8 w-8 sm:h-6 sm:w-6" aria-hidden="true" /> : <Play className="h-8 w-8 sm:h-6 sm:w-6" aria-hidden="true" />}
                </Button>
                <div className="text-center flex-1">
                  <div className="text-3xl sm:text-2xl font-mono">{formatDuration(duration)}</div>
                  <Badge variant="secondary" className="text-sm mt-1">
                    {uploadedFile ? uploadedFile.name : 'Recording ready'}
                  </Badge>
                </div>
                <Button
                  type="button"
                  size="lg"
                  variant="ghost"
                  className="text-destructive h-12 w-12 sm:h-10 sm:w-10 rounded-full"
                  onClick={clearRecording}
                  aria-label="Delete recording"
                >
                  <Trash2 className="h-6 w-6 sm:h-5 sm:w-5" aria-hidden="true" />
                </Button>
              </div>
              <audio
                ref={audioRef}
                src={audioUrl || undefined}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </>
          ) : (
            <>
              <Button
                type="button"
                size="lg"
                className="rounded-full h-24 w-24 sm:h-20 sm:w-20"
                onClick={startRecording}
                aria-label="Start recording"
              >
                <Mic className="h-10 w-10 sm:h-8 sm:w-8" aria-hidden="true" />
              </Button>
              <div className="text-base sm:text-sm text-muted-foreground font-medium">
                Tap to start recording
              </div>

              <div className="flex items-center gap-3 text-muted-foreground w-full max-w-[200px]">
                <div className="h-px bg-border flex-1" />
                <span className="text-xs uppercase tracking-wide">or</span>
                <div className="h-px bg-border flex-1" />
              </div>

              <div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.wav,.webm,.mp3,.ogg,.m4a"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="audio-upload"
                />
                <Label
                  htmlFor="audio-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 sm:px-4 sm:py-2 text-base sm:text-sm border-2 rounded-lg cursor-pointer hover:bg-accent active:scale-95 transition-transform"
                >
                  <FileAudio className="h-5 w-5 sm:h-4 sm:w-4" />
                  Upload audio file
                </Label>
              </div>
            </>
          )}
        </div>

        {/* Title input (optional) */}
        {audioBlob && (
          <div className="space-y-2">
            <Label htmlFor="voice-title">Title (optional)</Label>
            <Input
              id="voice-title"
              placeholder="Auto-generated from content if left empty"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Transcribing with Groq Whisper...
            </div>
            <Progress value={33} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!audioBlob || isUploading || isRecording}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Transcribing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Transcribe & Save
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

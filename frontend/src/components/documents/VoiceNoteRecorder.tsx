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
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface VoiceNoteRecorderProps {
  onSuccess?: () => void;
}

export function VoiceNoteRecorder({ onSuccess }: VoiceNoteRecorderProps) {
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
        filename,
        title: title.trim() || undefined,
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
        <div className="flex flex-col items-center gap-4 py-4">
          {isRecording ? (
            <>
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-75" />
                <Button
                  type="button"
                  size="lg"
                  variant="destructive"
                  className="relative rounded-full h-16 w-16"
                  onClick={stopRecording}
                >
                  <Square className="h-6 w-6" />
                </Button>
              </div>
              <div className="text-center">
                <div className="text-2xl font-mono">{formatDuration(duration)}</div>
                <div className="text-sm text-muted-foreground">Recording...</div>
              </div>
            </>
          ) : audioBlob ? (
            <>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="rounded-full h-16 w-16"
                  onClick={togglePlayback}
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                <div className="text-center">
                  <div className="text-2xl font-mono">{formatDuration(duration)}</div>
                  <Badge variant="secondary">
                    {uploadedFile ? uploadedFile.name : 'Recording ready'}
                  </Badge>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={clearRecording}
                >
                  <Trash2 className="h-5 w-5" />
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
                className="rounded-full h-16 w-16"
                onClick={startRecording}
              >
                <Mic className="h-6 w-6" />
              </Button>
              <div className="text-sm text-muted-foreground">Click to start recording</div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-px bg-border flex-1 w-16" />
                <span className="text-xs">or</span>
                <div className="h-px bg-border flex-1 w-16" />
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
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-md cursor-pointer hover:bg-accent"
                >
                  <FileAudio className="h-4 w-4" />
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

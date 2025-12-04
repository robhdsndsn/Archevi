import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Upload, Mic, FileText } from 'lucide-react';
import { DocumentUpload } from './DocumentUpload';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';

type AddMode = 'upload' | 'voice';

interface AddDocumentViewProps {
  onSuccess?: () => void;
  onViewDocument?: (documentId: number) => void;
}

export function AddDocumentView({ onSuccess, onViewDocument }: AddDocumentViewProps) {
  const [mode, setMode] = useState<AddMode>('upload');

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Choose how to add a document</span>
        </div>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => value && setMode(value as AddMode)}
          className="justify-center"
        >
          <ToggleGroupItem value="upload" aria-label="Upload file" className="gap-2 px-4">
            <Upload className="h-4 w-4" />
            <span>Upload File</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="voice" aria-label="Voice note" className="gap-2 px-4">
            <Mic className="h-4 w-4" />
            <span>Voice Note</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Content based on mode */}
      <div className="max-w-xl mx-auto">
        {mode === 'upload' ? (
          <DocumentUpload onSuccess={onSuccess} onViewDocument={onViewDocument} />
        ) : (
          <VoiceNoteRecorder onSuccess={onSuccess} />
        )}
      </div>
    </div>
  );
}

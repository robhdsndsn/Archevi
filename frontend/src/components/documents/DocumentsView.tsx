import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderOpen, Upload, Search, Mic, LayoutDashboard, List } from 'lucide-react';
import { DocumentUpload } from './DocumentUpload';
import { DocumentBrowser } from './DocumentBrowser';
import { FamilyDocumentsList } from './FamilyDocumentsList';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';
import { ExpiryAlerts } from './ExpiryAlerts';
import { TagCloud } from './TagCloud';
import type { DocumentsTab } from '@/App';

interface DocumentsViewProps {
  activeTab?: DocumentsTab;
  onTabChange?: (tab: DocumentsTab) => void;
}

export function DocumentsView({ activeTab = 'overview', onTabChange }: DocumentsViewProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-5xl mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <FolderOpen className="h-6 w-6" />
          Documents
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload and search your family knowledge base
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => onTabChange?.(v as DocumentsTab)} className="flex-1">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="browse" className="gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Browse</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-2">
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Voice</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ExpiryAlerts />
            <TagCloud />
          </div>
        </TabsContent>

        <TabsContent value="browse" className="mt-4">
          <FamilyDocumentsList />
        </TabsContent>

        <TabsContent value="search" className="mt-4">
          <DocumentBrowser />
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <div className="max-w-xl">
            <DocumentUpload />
          </div>
        </TabsContent>

        <TabsContent value="voice" className="mt-4">
          <div className="max-w-xl">
            <VoiceNoteRecorder />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderOpen, Upload, Search } from 'lucide-react';
import { DocumentUpload } from './DocumentUpload';
import { DocumentBrowser } from './DocumentBrowser';

export function DocumentsView() {
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

      <Tabs defaultValue="search" className="flex-1">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>
        <TabsContent value="search" className="mt-4">
          <DocumentBrowser />
        </TabsContent>
        <TabsContent value="upload" className="mt-4">
          <div className="max-w-xl">
            <DocumentUpload />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

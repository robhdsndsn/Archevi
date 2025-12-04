import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Search, LayoutDashboard, List, Plus, Upload, Sparkles, FileText } from 'lucide-react';
import { DocumentBrowser } from './DocumentBrowser';
import { FamilyDocumentsList } from './FamilyDocumentsList';
import { AddDocumentView } from './AddDocumentView';
import { ExpiryAlerts } from './ExpiryAlerts';
import { TagCloud } from './TagCloud';
import { windmill } from '@/api/windmill';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import type { DocumentsTab } from '@/App';

// Default tenant for MVP
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

interface DocumentsViewProps {
  activeTab?: DocumentsTab;
  onTabChange?: (tab: DocumentsTab) => void;
}

export function DocumentsView({ activeTab = 'overview', onTabChange }: DocumentsViewProps) {
  const { user } = useAuthStore();
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;
  const [documentCount, setDocumentCount] = useState<number | null>(null);

  // Check if user has any documents
  useEffect(() => {
    const checkDocuments = async () => {
      try {
        // Use search with empty query to check for any documents
        const result = await windmill.advancedSearchDocuments({
          tenant_id: tenantId,
          limit: 1,
        });
        setDocumentCount(result.total || result.documents?.length || 0);
      } catch {
        // If error, assume they might have documents
        setDocumentCount(1);
      }
    };
    checkDocuments();
  }, [tenantId]);

  const isNewUser = documentCount === 0;

  const handleViewDocument = (documentId: number) => {
    // Switch to browse tab
    onTabChange?.('browse');
    // Show toast to help user find the document
    toast.success('Switched to All Docs', {
      description: `Your document (ID: ${documentId}) is in the list. Sort by "Newest" to find it at the top.`,
    });
  };

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
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="browse" className="gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">All Docs</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">AI Search</span>
          </TabsTrigger>
          <TabsTrigger value="add" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {isNewUser ? (
            /* Welcome card for new users */
            <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10 w-fit">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl">Welcome to Archevi</CardTitle>
                <CardDescription className="text-base">
                  Start building your family's digital archive
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Upload your first document to unlock AI-powered search, automatic tagging,
                  and expiry tracking for your important family documents.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => onTabChange?.('add')} className="gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Your First Document
                  </Button>
                  <Button variant="outline" onClick={() => onTabChange?.('search')} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Try AI Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
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

        <TabsContent value="add" className="mt-4">
          <AddDocumentView onViewDocument={handleViewDocument} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

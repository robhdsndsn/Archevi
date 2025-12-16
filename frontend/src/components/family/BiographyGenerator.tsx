import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  BookOpen,
  User,
  Sparkles,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Download,
  RefreshCw,
  History,
  AlertCircle,
} from 'lucide-react';
import { windmill, type FamilyMember } from '@/api/windmill';
import type { BiographyStyle, BiographySource } from '@/api/windmill/types';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '@/store/auth-store';

const STYLE_OPTIONS: { value: BiographyStyle; label: string; description: string }[] = [
  { value: 'narrative', label: 'Narrative', description: 'Warm, engaging storytelling' },
  { value: 'formal', label: 'Formal', description: 'Documentary style for records' },
  { value: 'casual', label: 'Casual', description: 'Conversational, like talking to friends' },
  { value: 'children', label: "Children's", description: 'Simple, accessible for kids' },
];

interface BiographyHistory {
  id: string;
  personName: string;
  style: BiographyStyle;
  biography: string;
  sources: BiographySource[];
  wordCount: number;
  createdAt: Date;
}

export function BiographyGenerator() {
  const { user } = useAuthStore();
  const tenantId = user?.tenant_id;
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  // Form state
  const [personName, setPersonName] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [style, setStyle] = useState<BiographyStyle>('narrative');
  const [maxWords, setMaxWords] = useState(500);
  const [includeHistoricalContext, setIncludeHistoricalContext] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [biography, setBiography] = useState<string | null>(null);
  const [sources, setSources] = useState<BiographySource[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<BiographyHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Load family members
  useEffect(() => {
    async function loadMembers() {
      try {
        const result = await windmill.listFamilyMembers();
        if (result.success && result.members) {
          setMembers(result.members);
        }
      } catch (err) {
        console.error('Failed to load family members:', err);
      } finally {
        setIsLoadingMembers(false);
      }
    }
    loadMembers();
  }, []);

  // Handle member selection
  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    if (memberId === 'custom') {
      setPersonName('');
    } else {
      const member = members.find(m => m.id.toString() === memberId);
      if (member) {
        setPersonName(member.name);
      }
    }
  };

  // Generate biography
  const handleGenerate = async () => {
    if (!personName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    if (!tenantId) {
      toast.error('Not authenticated');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setBiography(null);
    setSources([]);

    try {
      const result = await windmill.generateBiography({
        person_name: personName.trim(),
        tenant_id: tenantId,
        style,
        max_words: maxWords,
        include_historical_context: includeHistoricalContext,
      });

      if (result.success && result.biography) {
        setBiography(result.biography);
        setSources(result.sources || []);
        setWordCount(result.word_count || 0);

        // Add to history
        const historyItem: BiographyHistory = {
          id: Date.now().toString(),
          personName: personName.trim(),
          style,
          biography: result.biography,
          sources: result.sources || [],
          wordCount: result.word_count || 0,
          createdAt: new Date(),
        };
        setHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10

        toast.success(`Biography generated! ${result.word_count} words`);
      } else {
        setError(result.error || 'Failed to generate biography');
        toast.error(result.error || 'Generation failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error(`Error: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!biography) return;
    try {
      await navigator.clipboard.writeText(biography);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Download as markdown
  const handleDownload = () => {
    if (!biography) return;
    const blob = new Blob([biography], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${personName.replace(/\s+/g, '_')}_biography.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded');
  };

  // Restore from history
  const handleRestoreHistory = (item: BiographyHistory) => {
    setPersonName(item.personName);
    setStyle(item.style);
    setBiography(item.biography);
    setSources(item.sources);
    setWordCount(item.wordCount);
    setShowHistory(false);
    toast.success('Restored from history');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Biography Generator</h1>
            <p className="text-muted-foreground text-sm">
              Create AI-powered biographies from your family documents
            </p>
          </div>
        </div>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="h-4 w-4 mr-2" />
            History ({history.length})
          </Button>
        )}
      </div>

      {/* History Panel */}
      {showHistory && history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Biographies</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleRestoreHistory(item)}
                  >
                    <div>
                      <p className="font-medium">{item.personName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.style} - {item.wordCount} words - {item.createdAt.toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{item.sources.length} sources</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Who would you like to write about?
          </CardTitle>
          <CardDescription>
            Select a family member or enter any name mentioned in your documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Person Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Family Member</Label>
              <Select
                value={selectedMemberId}
                onValueChange={handleMemberSelect}
                disabled={isLoadingMembers}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingMembers ? 'Loading...' : 'Select a member'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Enter custom name...</SelectItem>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personName">Name</Label>
              <Input
                id="personName"
                placeholder="e.g., Grandma Rose, Uncle John"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
              />
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <Label>Writing Style</Label>
            <div className="grid gap-2 md:grid-cols-4">
              {STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStyle(option.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    style === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Word Count & Options */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Target Length</Label>
                <span className="text-sm text-muted-foreground">{maxWords} words</span>
              </div>
              <Slider
                value={[maxWords]}
                onValueChange={([value]) => setMaxWords(value)}
                min={200}
                max={1500}
                step={100}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Brief (200)</span>
                <span>Detailed (1500)</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Historical Context</Label>
                  <p className="text-xs text-muted-foreground">
                    Add era-appropriate background
                  </p>
                </div>
                <Switch
                  checked={includeHistoricalContext}
                  onCheckedChange={setIncludeHistoricalContext}
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !personName.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Researching documents and writing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Biography
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Generation Failed</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Biography Display */}
      {biography && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Biography of {personName}
                </CardTitle>
                <CardDescription className="mt-1">
                  {wordCount} words - {STYLE_OPTIONS.find(s => s.value === style)?.label} style
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{biography}</ReactMarkdown>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <Collapsible open={isSourcesOpen} onOpenChange={setIsSourcesOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Source Documents ({sources.length})
                  </span>
                  {isSourcesOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {sources.map((source, idx) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6">{idx + 1}.</span>
                        <div>
                          <p className="font-medium text-sm">{source.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {source.category}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(source.relevance * 100)}% relevant
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { windmill } from '@/api/windmill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Lock,
  Loader2,
  AlertTriangle,
  Clock,
  Eye,
  Download,
  Calendar,
  Tag,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface SharePageProps {
  token: string;
}

interface SharedDocument {
  id: number;
  title: string;
  content: string;
  category: string;
  source_file: string | null;
  created_at: string | null;
  expiry_date: string | null;
  metadata: Record<string, unknown> | null;
}

type PageState = 'loading' | 'password' | 'document' | 'error';

export function SharePage({ token }: SharePageProps) {
  const [state, setState] = useState<PageState>('loading');
  const [error, setError] = useState<string>('');
  const [document, setDocument] = useState<SharedDocument | null>(null);
  const [linkLabel, setLinkLabel] = useState<string | null>(null);
  const [viewsRemaining, setViewsRemaining] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // Password form
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAccess();
  }, [token]);

  const checkAccess = async (pwd?: string) => {
    if (pwd) setSubmitting(true);
    else setState('loading');

    try {
      const result = await windmill.accessSecureLink({
        token,
        password: pwd,
        user_agent: navigator.userAgent,
      });

      if (result.success && result.document) {
        setDocument(result.document);
        setLinkLabel(result.link_label || null);
        setViewsRemaining(result.views_remaining ?? null);
        setExpiresAt(result.expires_at || null);
        setState('document');
      } else if (result.requires_password) {
        setState('password');
      } else {
        setError(result.error || 'Unable to access this document');
        setState('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
      setState('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      checkAccess(password);
    }
  };

  const downloadAsText = () => {
    if (!document) return;
    const blob = new Blob([document.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title}.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading shared document...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Unable to Access Document</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              This link may have expired, been revoked, or reached its view limit.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Go to Archevi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password required state
  if (state === 'password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Password Required</CardTitle>
            <CardDescription>
              This document is password protected. Enter the password to view.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!password || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Unlock Document
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Document view state
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-semibold">Archevi</span>
            <Badge variant="secondary" className="text-xs">
              Shared Document
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {viewsRemaining !== null && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {viewsRemaining} views left
              </span>
            )}
            {expiresAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expires {formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Document Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <CardTitle className="text-xl md:text-2xl">{document?.title}</CardTitle>
                {linkLabel && (
                  <p className="text-sm text-muted-foreground">
                    Shared: {linkLabel}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={downloadAsText}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            {/* Metadata badges */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline">
                <Tag className="h-3 w-3 mr-1" />
                {document?.category}
              </Badge>
              {document?.created_at && (
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  {format(new Date(document.created_at), 'MMM d, yyyy')}
                </Badge>
              )}
              {document?.expiry_date && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50 dark:bg-yellow-950">
                  <Clock className="h-3 w-3 mr-1" />
                  Expires {format(new Date(document.expiry_date), 'MMM d, yyyy')}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm bg-muted/50 p-4 rounded-lg overflow-auto max-h-[60vh]">
                {document?.content}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Footer notice */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          This document was shared securely via{' '}
          <a href="/" className="text-primary hover:underline">
            Archevi
          </a>
          . The family document vault.
        </p>
      </main>
    </div>
  );
}

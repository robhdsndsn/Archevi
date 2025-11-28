import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Archive, Loader2, AlertCircle, ArrowLeft, CheckCircle2, Copy, Check } from 'lucide-react';
import { windmill } from '@/api/windmill';
import { toast } from 'sonner';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const result = await windmill.requestPasswordReset(email);

      if (result.success && result.reset_token) {
        // Build reset URL
        const baseUrl = window.location.origin;
        const resetUrl = `${baseUrl}?token=${result.reset_token}&email=${encodeURIComponent(email)}`;
        setResetLink(resetUrl);
        toast.success('Reset link generated!', {
          description: 'Share this link to reset your password.',
        });
      } else if (result.success) {
        // User not found but we don't reveal that
        toast.info('Request processed', {
          description: result.message || 'If an account exists, a reset link will be available.',
        });
        onBack();
      } else {
        setError(result.error || 'Failed to generate reset link');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!resetLink) return;
    try {
      await navigator.clipboard.writeText(resetLink);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Archive className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Archevi</h1>
          <p className="text-muted-foreground">Family Archive</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">
              {resetLink ? 'Reset Link Ready' : 'Forgot password?'}
            </CardTitle>
            <CardDescription>
              {resetLink
                ? 'Share this link to reset your password'
                : "Enter your email and we'll generate a reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetLink ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 text-sm text-green-700 bg-green-100 dark:bg-green-900/20 dark:text-green-400 rounded-md">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Reset link generated successfully!</span>
                </div>

                <div className="space-y-2">
                  <Label>Reset Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={resetLink}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">How to use:</p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1 text-xs">
                    <li>Copy the reset link above</li>
                    <li>Open it in your browser (or share it)</li>
                    <li>Set your new password</li>
                    <li>Sign in with your new password</li>
                  </ol>
                  <p className="mt-2 text-xs text-muted-foreground">
                    This link expires in 1 hour.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={onBack} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign in
                  </Button>
                  <Button onClick={handleCopy} className="flex-1">
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !email}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Reset Link'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={onBack}
                  disabled={isLoading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign in
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Archevi v1.0 - 2026
        </p>
      </div>
    </div>
  );
}

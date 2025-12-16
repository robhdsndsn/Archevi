/**
 * Auth Callback Component
 *
 * Handles the redirect from the marketing site signup flow.
 * Reads tokens from URL fragment and sets up authentication.
 *
 * URL format: /auth/callback#access_token=...&refresh_token=...
 */

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { windmill } from '@/api/windmill';

type Status = 'processing' | 'success' | 'error';

interface AuthCallbackProps {
  onComplete: () => void;
}

export function AuthCallback({ onComplete }: AuthCallbackProps) {
  const [status, setStatus] = useState<Status>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        // Read tokens from URL fragment (hash)
        const hash = window.location.hash.substring(1); // Remove #
        const params = new URLSearchParams(hash);

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken || !refreshToken) {
          throw new Error('Missing authentication tokens');
        }

        // Verify the token and get user info
        const result = await windmill.verifyToken(accessToken);

        if (!result.valid || !result.user) {
          throw new Error('Invalid authentication token');
        }

        // Set auth state directly in the store
        // Access the store's setState function
        useAuthStore.setState({
          user: result.user,
          accessToken,
          refreshToken,
          expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes default
          isAuthenticated: true,
          isLoading: false,
          error: null,
          twoFactorPending: null,
        });

        // Clean up URL - remove the hash with tokens
        window.history.replaceState({}, '', window.location.pathname.replace('/auth/callback', '/'));

        setStatus('success');

        // Small delay to show success state before redirect
        setTimeout(() => {
          onComplete();
        }, 1000);

      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');

        // Redirect to login after showing error
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    processAuthCallback();
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 p-8 max-w-md text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h1 className="text-xl font-semibold">Setting up your account...</h1>
            <p className="text-muted-foreground">
              Please wait while we complete your signup.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h1 className="text-xl font-semibold">Welcome to Archevi!</h1>
            <p className="text-muted-foreground">
              Your account is ready. Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-destructive" />
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground">
              {error || 'Failed to complete authentication'}
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

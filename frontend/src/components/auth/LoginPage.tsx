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
import {
  Archive,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  Key,
  ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

interface LoginPageProps {
  onForgotPassword?: () => void;
}

export function LoginPage({ onForgotPassword }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2FA state
  const [verifyCode, setVerifyCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const {
    login,
    verify2FA,
    verifyBackupCode,
    cancel2FA,
    isLoading,
    error,
    clearError,
    twoFactorPending,
  } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      return;
    }

    const result = await login(email, password);
    if (result === true) {
      toast.success('Welcome back!', {
        description: 'You have been signed in successfully.',
      });
    } else if (result === 'requires_2fa') {
      // 2FA required - the UI will switch to the 2FA form
      toast.info('Enter your verification code', {
        description: 'Two-factor authentication is enabled for this account.',
      });
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!verifyCode) {
      return;
    }

    const success = useBackupCode
      ? await verifyBackupCode(verifyCode.replace(/\s/g, ''))
      : await verify2FA(verifyCode.replace(/\s/g, ''));

    if (success) {
      toast.success('Welcome back!', {
        description: 'You have been signed in successfully.',
      });
    }
  };

  const handleCancel2FA = () => {
    cancel2FA();
    setVerifyCode('');
    setUseBackupCode(false);
  };

  // 2FA Verification Form
  if (twoFactorPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
            <p className="text-muted-foreground">
              {twoFactorPending.name && `Welcome, ${twoFactorPending.name}`}
            </p>
          </div>

          {/* 2FA Card */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">
                {useBackupCode ? 'Enter Backup Code' : 'Enter Verification Code'}
              </CardTitle>
              <CardDescription>
                {useBackupCode
                  ? 'Enter one of your backup codes to sign in'
                  : 'Enter the 6-digit code from your authenticator app'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify2FA} className="space-y-4">
                {/* Error Alert */}
                {error && (
                  <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Verification Code Input */}
                <div className="space-y-2">
                  <Label htmlFor="verify-code">
                    {useBackupCode ? 'Backup Code' : 'Verification Code'}
                  </Label>
                  <Input
                    id="verify-code"
                    type="text"
                    inputMode={useBackupCode ? 'text' : 'numeric'}
                    pattern={useBackupCode ? undefined : '[0-9]*'}
                    maxLength={useBackupCode ? 9 : 6}
                    placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
                    value={verifyCode}
                    onChange={(e) =>
                      setVerifyCode(
                        useBackupCode
                          ? e.target.value.toUpperCase()
                          : e.target.value.replace(/\D/g, '')
                      )
                    }
                    disabled={isLoading}
                    autoComplete="one-time-code"
                    autoFocus
                    className={
                      useBackupCode
                        ? 'text-center text-lg tracking-wider font-mono'
                        : 'text-center text-2xl tracking-widest font-mono'
                    }
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading ||
                    (useBackupCode ? verifyCode.length < 8 : verifyCode.length !== 6)
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>

                {/* Toggle to backup code */}
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-primary"
                    onClick={() => {
                      setUseBackupCode(!useBackupCode);
                      setVerifyCode('');
                      clearError();
                    }}
                  >
                    <Key className="mr-1 h-3 w-3" />
                    {useBackupCode
                      ? 'Use authenticator app instead'
                      : "Can't access your authenticator? Use a backup code"}
                  </Button>
                </div>

                {/* Back to login */}
                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-sm text-muted-foreground"
                    onClick={handleCancel2FA}
                  >
                    <ArrowLeft className="mr-1 h-3 w-3" />
                    Back to login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Version */}
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Archevi v1.0 - 2026
          </p>
        </div>
      </div>
    );
  }

  // Normal Login Form
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

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your family archive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
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

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Forgot Password Link */}
              {onForgotPassword && (
                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm text-muted-foreground hover:text-primary"
                    onClick={onForgotPassword}
                  >
                    Forgot password?
                  </Button>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                This is a private family archive.
                <br />
                Contact your admin if you need access.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Version */}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Archevi v1.0 - 2026
        </p>
      </div>
    </div>
  );
}

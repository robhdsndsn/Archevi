import { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Key,
  Copy,
  Check,
  HelpCircle,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { windmill } from '@/api/windmill';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

type SetupStep = 'idle' | 'qr' | 'verify' | 'backup_codes' | 'complete';

export function TwoFactorAuth() {
  const { user } = useAuthStore();

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false); // TODO: Get from user profile
  const [setupStep, setSetupStep] = useState<SetupStep>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);

  // Disable 2FA dialog state
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);

  // Generate backup codes dialog state
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [backupPassword, setBackupPassword] = useState('');
  const [isGeneratingBackup, setIsGeneratingBackup] = useState(false);
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);

  const memberId = user?.member_id;

  // Start 2FA setup - get QR code
  const handleStartSetup = async () => {
    if (!memberId) {
      toast.error('User not authenticated');
      return;
    }

    setIsLoading(true);
    try {
      const result = await windmill.setup2FA(memberId);

      if (result.success && result.qr_code && result.secret) {
        setQrCode(result.qr_code);
        setSecret(result.secret);
        setSetupStep('qr');
      } else {
        toast.error(result.error || 'Failed to start 2FA setup');
      }
    } catch (err) {
      toast.error('Failed to start 2FA setup');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify the TOTP code and enable 2FA
  const handleVerifyAndEnable = async () => {
    if (!memberId || !verifyCode) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await windmill.verify2FA(verifyCode, {
        userId: memberId,
        enable2FA: true,
      });

      if (result.success && result.totp_enabled) {
        toast.success('2FA enabled successfully!');
        setSetupStep('backup_codes');
        // Auto-generate backup codes
        await generateInitialBackupCodes();
      } else {
        toast.error(result.error || 'Invalid verification code');
      }
    } catch (err) {
      toast.error('Verification failed');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate initial backup codes after enabling 2FA
  const generateInitialBackupCodes = async () => {
    if (!memberId) return;

    // For initial setup, we need to prompt for password
    // This will be handled in the backup_codes step
    setSetupStep('backup_codes');
  };

  // Generate new backup codes with password
  const handleGenerateBackupCodes = async (password: string) => {
    if (!memberId || !password) {
      toast.error('Password is required');
      return;
    }

    setIsGeneratingBackup(true);
    try {
      const result = await windmill.generateBackupCodes(memberId, password);

      if (result.success && result.codes) {
        setBackupCodes(result.codes);
        setNewBackupCodes(result.codes);
        toast.success('Backup codes generated successfully');
        return true;
      } else {
        toast.error(result.error || 'Failed to generate backup codes');
        return false;
      }
    } catch (err) {
      toast.error('Failed to generate backup codes');
      console.error(err);
      return false;
    } finally {
      setIsGeneratingBackup(false);
    }
  };

  // Complete setup
  const handleCompleteSetup = () => {
    setIs2FAEnabled(true);
    setSetupStep('idle');
    setQrCode(null);
    setSecret(null);
    setVerifyCode('');
    toast.success('Two-factor authentication is now active');
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!memberId || !disablePassword) {
      toast.error('Password is required');
      return;
    }

    setIsDisabling(true);
    try {
      const result = await windmill.disable2FA(memberId, disablePassword);

      if (result.success) {
        setIs2FAEnabled(false);
        setShowDisableDialog(false);
        setDisablePassword('');
        toast.success('Two-factor authentication disabled');
      } else {
        toast.error(result.error || 'Failed to disable 2FA');
      }
    } catch (err) {
      toast.error('Failed to disable 2FA');
      console.error(err);
    } finally {
      setIsDisabling(false);
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, type: 'secret' | 'backup') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'secret') {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      } else {
        setCopiedBackupCodes(true);
        setTimeout(() => setCopiedBackupCodes(false), 2000);
      }
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Cancel setup
  const handleCancelSetup = () => {
    setSetupStep('idle');
    setQrCode(null);
    setSecret(null);
    setVerifyCode('');
    setBackupCodes([]);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Two-Factor Authentication
            <HoverCard>
              <HoverCardTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </HoverCardTrigger>
              <HoverCardContent className="w-72">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Enhanced Security</h4>
                  <p className="text-sm text-muted-foreground">
                    Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
                  </p>
                </div>
              </HoverCardContent>
            </HoverCard>
            {is2FAEnabled ? (
              <Badge variant="default" className="ml-auto bg-green-600">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary" className="ml-auto">
                <ShieldOff className="h-3 w-3 mr-1" />
                Disabled
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Protect your account with an authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {is2FAEnabled ? (
            // 2FA is enabled - show status and options
            <>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Your account is protected
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Two-factor authentication is active
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Backup Codes</Label>
                  <p className="text-sm text-muted-foreground">
                    Generate new recovery codes
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBackupDialog(true)}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Generate New
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-destructive">Disable 2FA</Label>
                  <p className="text-sm text-muted-foreground">
                    Remove two-factor authentication
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDisableDialog(true)}
                >
                  <ShieldOff className="mr-2 h-4 w-4" />
                  Disable
                </Button>
              </div>
            </>
          ) : (
            // 2FA not enabled - show setup option or setup flow
            <>
              {setupStep === 'idle' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Recommended for security
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400">
                        Enable 2FA to protect your account
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleStartSetup} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Smartphone className="mr-2 h-4 w-4" />
                    )}
                    Set Up Two-Factor Authentication
                  </Button>
                </div>
              )}

              {setupStep === 'qr' && qrCode && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center p-4 rounded-lg border bg-white dark:bg-gray-950">
                    <p className="text-sm font-medium mb-3">
                      Scan this QR code with your authenticator app
                    </p>
                    <img
                      src={`data:image/png;base64,${qrCode}`}
                      alt="2FA QR Code"
                      className="w-48 h-48 mb-3"
                    />
                    <p className="text-xs text-muted-foreground text-center mb-2">
                      Works with Google Authenticator, Authy, 1Password, etc.
                    </p>
                    {secret && (
                      <div className="w-full p-2 bg-gray-100 dark:bg-gray-900 rounded text-center">
                        <p className="text-xs text-muted-foreground mb-1">
                          Can't scan? Enter this code manually:
                        </p>
                        <code className="text-xs font-mono break-all">{secret}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-6 w-6 p-0"
                          onClick={() => copyToClipboard(secret, 'secret')}
                        >
                          {copiedSecret ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelSetup}>
                      Cancel
                    </Button>
                    <Button onClick={() => setSetupStep('verify')}>
                      Next: Enter Code
                    </Button>
                  </div>
                </div>
              )}

              {setupStep === 'verify' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verify-code">Enter Verification Code</Label>
                    <p className="text-sm text-muted-foreground">
                      Open your authenticator app and enter the 6-digit code
                    </p>
                    <Input
                      id="verify-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-2xl tracking-widest font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSetupStep('qr')}>
                      Back
                    </Button>
                    <Button
                      onClick={handleVerifyAndEnable}
                      disabled={verifyCode.length !== 6 || isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="mr-2 h-4 w-4" />
                      )}
                      Verify & Enable
                    </Button>
                  </div>
                </div>
              )}

              {setupStep === 'backup_codes' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-medium">2FA Enabled Successfully!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your password to generate backup codes. These codes can be used to access your account if you lose your phone.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="backup-password">Password</Label>
                    <Input
                      id="backup-password"
                      type="password"
                      value={backupPassword}
                      onChange={(e) => setBackupPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                  </div>
                  {backupCodes.length > 0 ? (
                    <div className="space-y-3">
                      <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Save these codes now!
                          </span>
                        </div>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                          They will only be shown once. Store them securely.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {backupCodes.map((code, i) => (
                            <code
                              key={i}
                              className="text-sm font-mono bg-white dark:bg-gray-900 p-2 rounded text-center"
                            >
                              {code}
                            </code>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => copyToClipboard(backupCodes.join('\n'), 'backup')}
                      >
                        {copiedBackupCodes ? (
                          <>
                            <Check className="mr-2 h-4 w-4 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy All Codes
                          </>
                        )}
                      </Button>
                      <Button onClick={handleCompleteSetup} className="w-full">
                        I've Saved My Codes
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={async () => {
                        const success = await handleGenerateBackupCodes(backupPassword);
                        if (!success) {
                          setBackupPassword('');
                        }
                      }}
                      disabled={!backupPassword || isGeneratingBackup}
                    >
                      {isGeneratingBackup ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Key className="mr-2 h-4 w-4" />
                      )}
                      Generate Backup Codes
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Disable 2FA Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-destructive" />
              Disable Two-Factor Authentication
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This will make your account less secure. You'll only need your password to sign in.
              </p>
              <div className="space-y-2">
                <Label htmlFor="disable-password">Confirm your password</Label>
                <Input
                  id="disable-password"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDisablePassword('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable2FA}
              disabled={!disablePassword || isDisabling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDisabling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate New Backup Codes Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Generate New Backup Codes
            </DialogTitle>
            <DialogDescription>
              {newBackupCodes.length > 0
                ? 'Your new backup codes are ready. Save them securely!'
                : 'This will invalidate your old backup codes. Enter your password to continue.'}
            </DialogDescription>
          </DialogHeader>

          {newBackupCodes.length > 0 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-yellow-50 dark:bg-yellow-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Save these codes now!
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {newBackupCodes.map((code, i) => (
                    <code
                      key={i}
                      className="text-sm font-mono bg-white dark:bg-gray-900 p-2 rounded text-center"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => copyToClipboard(newBackupCodes.join('\n'), 'backup')}
              >
                {copiedBackupCodes ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy All Codes
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-backup-password">Password</Label>
                <Input
                  id="new-backup-password"
                  type="password"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {newBackupCodes.length > 0 ? (
              <Button
                onClick={() => {
                  setShowBackupDialog(false);
                  setNewBackupCodes([]);
                  setBackupPassword('');
                }}
              >
                I've Saved My Codes
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBackupDialog(false);
                    setBackupPassword('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    const success = await handleGenerateBackupCodes(backupPassword);
                    if (!success) {
                      setBackupPassword('');
                    }
                  }}
                  disabled={!backupPassword || isGeneratingBackup}
                >
                  {isGeneratingBackup ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Generate Codes
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

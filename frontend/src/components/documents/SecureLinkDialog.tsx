import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Link2,
  Loader2,
  Copy,
  Check,
  Clock,
  Eye,
  Lock,
  Trash2,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { windmill } from '@/api/windmill';
import type { SecureLink, SecureLinkExpiration } from '@/api/windmill';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SecureLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: number;
  documentTitle: string;
  tenantId: string;
}

const EXPIRATION_OPTIONS: { value: SecureLinkExpiration; label: string }[] = [
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export function SecureLinkDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  tenantId,
}: SecureLinkDialogProps) {
  const { user } = useAuthStore();

  // Existing links for this document
  const [existingLinks, setExistingLinks] = useState<SecureLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // New link form
  const [expiration, setExpiration] = useState<SecureLinkExpiration>('7d');
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [useMaxViews, setUseMaxViews] = useState(false);
  const [maxViews, setMaxViews] = useState(10);
  const [label, setLabel] = useState('');
  const [creating, setCreating] = useState(false);

  // Newly created link (to show copy UI)
  const [newLink, setNewLink] = useState<{ url: string; password?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoking state
  const [revoking, setRevoking] = useState<string | null>(null);

  // Load existing links when dialog opens
  useEffect(() => {
    if (open) {
      loadExistingLinks();
      // Reset form
      setNewLink(null);
      setExpiration('7d');
      setUsePassword(false);
      setPassword('');
      setUseMaxViews(false);
      setMaxViews(10);
      setLabel('');
    }
  }, [open, documentId]);

  const loadExistingLinks = async () => {
    setLoadingLinks(true);
    try {
      const result = await windmill.listSecureLinks({
        tenant_id: tenantId,
        document_id: documentId,
        include_revoked: false,
        include_expired: false,
      });
      if (result.success && result.links) {
        setExistingLinks(result.links);
      }
    } catch (err) {
      console.error('Failed to load secure links:', err);
    } finally {
      setLoadingLinks(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.id) return;

    setCreating(true);
    try {
      const result = await windmill.createSecureLink({
        document_id: documentId,
        tenant_id: tenantId,
        user_id: user.id,
        expires_in: expiration,
        password: usePassword && password ? password : undefined,
        max_views: useMaxViews ? maxViews : undefined,
        label: label || undefined,
      });

      if (result.success && result.url) {
        const fullUrl = `${window.location.origin}${result.url}`;
        setNewLink({
          url: fullUrl,
          password: usePassword && password ? password : undefined,
        });
        toast.success('Secure link created');
        loadExistingLinks();
        // Reset form
        setPassword('');
        setLabel('');
      } else {
        toast.error(result.error || 'Failed to create link');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (linkId: string) => {
    if (!user?.id) return;

    setRevoking(linkId);
    try {
      const result = await windmill.revokeSecureLink({
        link_id: linkId,
        tenant_id: tenantId,
        user_id: user.id,
      });

      if (result.success) {
        toast.success('Link revoked');
        loadExistingLinks();
      } else {
        toast.error(result.error || 'Failed to revoke link');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke link');
    } finally {
      setRevoking(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const copyLinkWithPassword = async () => {
    if (!newLink) return;
    let text = newLink.url;
    if (newLink.password) {
      text += `\nPassword: ${newLink.password}`;
    }
    await copyToClipboard(text);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Create Secure Link
          </DialogTitle>
          <DialogDescription>
            Share "{documentTitle}" via a secure, expiring link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Newly Created Link */}
          {newLink && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 space-y-3">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Check className="h-5 w-5" />
                <span className="font-medium">Link Created</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={newLink.url}
                  className="text-sm bg-white dark:bg-gray-900"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyLinkWithPassword}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => window.open(newLink.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              {newLink.password && (
                <p className="text-sm text-green-700 dark:text-green-300">
                  <Lock className="h-3 w-3 inline mr-1" />
                  Password: <code className="bg-green-100 dark:bg-green-900 px-1 rounded">{newLink.password}</code>
                </p>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewLink(null)}
                className="text-green-700 dark:text-green-300"
              >
                Create another link
              </Button>
            </div>
          )}

          {/* Create New Link Form */}
          {!newLink && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expires in</Label>
                  <Select
                    value={expiration}
                    onValueChange={(v) => setExpiration(v as SecureLinkExpiration)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPIRATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Label (optional)</Label>
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g., For accountant"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Password Protection</p>
                    <p className="text-xs text-muted-foreground">Require password to view</p>
                  </div>
                </div>
                <Switch checked={usePassword} onCheckedChange={setUsePassword} />
              </div>

              {usePassword && (
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              )}

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">View Limit</p>
                    <p className="text-xs text-muted-foreground">Limit number of views</p>
                  </div>
                </div>
                <Switch checked={useMaxViews} onCheckedChange={setUseMaxViews} />
              </div>

              {useMaxViews && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={maxViews}
                    onChange={(e) => setMaxViews(parseInt(e.target.value) || 10)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">views maximum</span>
                </div>
              )}
            </div>
          )}

          {/* Existing Links */}
          {existingLinks.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <Label className="text-sm font-medium">Active Links</Label>
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {existingLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {link.label ? (
                            <span className="text-sm font-medium truncate">{link.label}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">No label</span>
                          )}
                          {link.requires_password && (
                            <Badge variant="outline" className="shrink-0">
                              <Lock className="h-3 w-3 mr-1" />
                              Protected
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires {formatDistanceToNow(new Date(link.expires_at), { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {link.view_count} views
                            {link.max_views && ` / ${link.max_views} max`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(`${window.location.origin}${link.url}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRevoke(link.id)}
                          disabled={revoking === link.id}
                        >
                          {revoking === link.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {loadingLinks && existingLinks.length === 0 && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Anyone with this link can view the document. Use password protection for sensitive documents.
              Revoke links when no longer needed.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
          {!newLink && (
            <Button
              onClick={handleCreate}
              disabled={creating || (usePassword && !password)}
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Create Link
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

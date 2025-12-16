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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Share2,
  Loader2,
  Eye,
  Pencil,
  Users,
  Trash2,
} from 'lucide-react';
import { windmill } from '@/api/windmill';
import type { ShareMember, SharePermission } from '@/api/windmill';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

interface ShareDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: number;
  documentTitle: string;
  tenantId: string;
  onShareUpdate?: () => void;
}

interface ExistingShare {
  share_id: string;
  user_id: string;
  name: string;
  email: string;
  permission: SharePermission;
  shared_at: string | null;
  shared_by_name: string;
}

export function ShareDocumentDialog({
  open,
  onOpenChange,
  documentId,
  documentTitle,
  tenantId,
  onShareUpdate,
}: ShareDocumentDialogProps) {
  const { user } = useAuthStore();

  const [members, setMembers] = useState<ShareMember[]>([]);
  const [existingShares, setExistingShares] = useState<ExistingShare[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [_loadingShares, setLoadingShares] = useState(false);

  // New share form
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [permission, setPermission] = useState<SharePermission>('view');
  const [message, setMessage] = useState('');
  const [sharing, setSharing] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  // Load members and existing shares when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      loadMembers();
      loadExistingShares();
    }
  }, [open, user?.id, documentId]);

  const loadMembers = async () => {
    if (!user?.id) return;
    setLoadingMembers(true);
    try {
      const result = await windmill.getTenantMembersForSharing(tenantId, user.id);
      if (result.success) {
        setMembers(result.members);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const loadExistingShares = async () => {
    setLoadingShares(true);
    try {
      const result = await windmill.getDocumentShares(documentId.toString());
      if (result.success) {
        setExistingShares(result.shares);
      }
    } catch (err) {
      console.error('Failed to load shares:', err);
    } finally {
      setLoadingShares(false);
    }
  };

  const handleShare = async () => {
    if (!selectedMember || !user?.id) return;

    setSharing(true);
    try {
      const result = await windmill.shareDocument(
        documentId.toString(),
        user.id,
        selectedMember,
        permission,
        message || undefined
      );

      if (result.success) {
        toast.success(result.message || `Shared with ${result.shared_with_name}`);
        setSelectedMember('');
        setMessage('');
        setPermission('view');
        loadExistingShares();
        onShareUpdate?.();
      } else {
        toast.error(result.error || 'Failed to share document');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to share document');
    } finally {
      setSharing(false);
    }
  };

  const handleUnshare = async (sharedWithUserId: string) => {
    if (!user?.id) return;

    setRemoving(sharedWithUserId);
    try {
      const result = await windmill.unshareDocument(
        documentId.toString(),
        user.id,
        sharedWithUserId
      );

      if (result.success) {
        toast.success('Share removed');
        loadExistingShares();
        onShareUpdate?.();
      } else {
        toast.error(result.error || 'Failed to remove share');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove share');
    } finally {
      setRemoving(null);
    }
  };

  // Filter out members who already have access
  const availableMembers = members.filter(
    (m) => !existingShares.some((s) => s.user_id === m.user_id)
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Document
          </DialogTitle>
          <DialogDescription>
            Share "{documentTitle}" with family members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Shares */}
          {existingShares.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Currently shared with</Label>
              <ScrollArea className="max-h-[150px]">
                <div className="space-y-2">
                  {existingShares.map((share) => (
                    <div
                      key={share.share_id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(share.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{share.name}</p>
                          <p className="text-xs text-muted-foreground">{share.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1">
                          {share.permission === 'edit' ? (
                            <Pencil className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                          {share.permission}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleUnshare(share.user_id)}
                          disabled={removing === share.user_id}
                        >
                          {removing === share.user_id ? (
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

          {/* Add New Share */}
          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-medium">Share with</Label>

            {loadingMembers ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : availableMembers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                {members.length === 0
                  ? 'No other family members to share with'
                  : 'Already shared with all family members'}
              </div>
            ) : (
              <>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a family member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            {member.avatar_url && (
                              <AvatarImage src={member.avatar_url} />
                            )}
                            <AvatarFallback className="text-xs">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({member.role})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="permission" className="text-xs">
                      Permission
                    </Label>
                    <Select
                      value={permission}
                      onValueChange={(v) => setPermission(v as SharePermission)}
                    >
                      <SelectTrigger id="permission">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Can view
                          </div>
                        </SelectItem>
                        <SelectItem value="edit">
                          <div className="flex items-center gap-2">
                            <Pencil className="h-4 w-4" />
                            Can edit
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="message" className="text-xs">
                    Message (optional)
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a note for the recipient..."
                    className="h-16 resize-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
          {availableMembers.length > 0 && (
            <Button
              onClick={handleShare}
              disabled={!selectedMember || sharing}
            >
              {sharing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

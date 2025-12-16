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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Users,
  UserPlus,
  Crown,
  User,
  Mail,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Shield,
  Key,
  CheckCircle2,
  Clock,
  AlertCircle,
  Link2,
  Copy,
  Check,
} from 'lucide-react';
import { windmill, type FamilyMember, type MemberRole, type MemberType, MEMBER_TYPES } from '@/api/windmill';
import { toast } from 'sonner';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface MemberFormData {
  name: string;
  email: string;
  role: MemberRole;
  member_type: MemberType;
}

const EMPTY_FORM: MemberFormData = {
  name: '',
  email: '',
  role: 'member',
  member_type: 'adult',
};

export function FamilyMembersView() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState<MemberFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  // Password management
  const [passwordDialogMember, setPasswordDialogMember] = useState<FamilyMember | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  // Invite link management
  const [inviteDialogMember, setInviteDialogMember] = useState<FamilyMember | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteExpires, setInviteExpires] = useState<string | null>(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteEmailSent, setInviteEmailSent] = useState(false);

  const fetchMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await windmill.listFamilyMembers();
      if (result.success && result.members) {
        setMembers(result.members);
      } else {
        setError(result.error || 'Failed to load family members');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load family members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async () => {
    if (!formData.name || !formData.email) return;

    setIsSaving(true);
    try {
      const result = await windmill.addFamilyMember({
        name: formData.name,
        email: formData.email,
        role: formData.role,
      });

      if (result.success) {
        setIsAddDialogOpen(false);
        setFormData(EMPTY_FORM);
        fetchMembers();
        toast.success('Member added', {
          description: `${formData.name} has been added to the family.`,
        });
      } else {
        toast.error('Failed to add member', {
          description: result.error || 'Please try again.',
        });
      }
    } catch (err) {
      toast.error('Failed to add member', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditMember = async () => {
    if (!editingMember || !formData.name || !formData.email) return;

    setIsSaving(true);
    try {
      const result = await windmill.updateFamilyMember(editingMember.id, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        member_type: formData.member_type,
      });

      if (result.success) {
        setIsEditDialogOpen(false);
        setEditingMember(null);
        setFormData(EMPTY_FORM);
        fetchMembers();
        toast.success('Member updated', {
          description: `${formData.name}'s information has been saved.`,
        });
      } else {
        toast.error('Failed to update member', {
          description: result.error || 'Please try again.',
        });
      }
    } catch (err) {
      toast.error('Failed to update member', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    const memberToDelete = members.find(m => m.id === memberId);
    try {
      const result = await windmill.removeFamilyMember(memberId);
      if (result.success) {
        setDeleteConfirmId(null);
        fetchMembers();
        toast.success('Member removed', {
          description: memberToDelete ? `${memberToDelete.name} has been removed from the family.` : 'Member removed successfully.',
        });
      } else {
        toast.error('Failed to remove member', {
          description: result.error || 'Please try again.',
        });
      }
    } catch (err) {
      toast.error('Failed to remove member', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const openEditDialog = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      member_type: member.member_type || 'adult',
    });
    setIsEditDialogOpen(true);
  };

  const openPasswordDialog = (member: FamilyMember) => {
    setPasswordDialogMember(member);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSuccess(false);
  };

  const handleSetPassword = async () => {
    if (!passwordDialogMember || !newPassword || newPassword !== confirmPassword) return;

    setIsSettingPassword(true);
    try {
      const result = await windmill.setPassword(
        passwordDialogMember.email,
        newPassword,
        undefined,
        true // adminOverride
      );

      if (result.success) {
        setPasswordSuccess(true);
        fetchMembers();
        toast.success('Password set', {
          description: `${passwordDialogMember.name} can now sign in with their new password.`,
        });
        setTimeout(() => {
          setPasswordDialogMember(null);
          setPasswordSuccess(false);
        }, 1500);
      } else {
        toast.error('Failed to set password', {
          description: result.error || 'Please try again.',
        });
      }
    } catch (err) {
      toast.error('Failed to set password', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleGenerateInvite = async (member: FamilyMember) => {
    setInviteDialogMember(member);
    setInviteLink(null);
    setInviteExpires(null);
    setInviteCopied(false);
    setInviteEmailSent(false);
    setIsGeneratingInvite(true);

    try {
      const result = await windmill.generateInvite(member.id);
      if (result.success && result.invite_token) {
        // Build the invite URL
        const baseUrl = window.location.origin;
        const inviteUrl = `${baseUrl}?token=${result.invite_token}&email=${encodeURIComponent(result.email || member.email)}`;
        setInviteLink(inviteUrl);
        setInviteExpires(result.expires_at || null);
        setInviteEmailSent(result.email_sent || false);
        fetchMembers(); // Refresh to show invite_pending status

        if (result.email_sent) {
          toast.success('Invitation sent!', {
            description: `An email has been sent to ${member.email}`,
          });
        }
      } else {
        toast.error('Failed to generate invite', {
          description: result.error || 'Please try again.',
        });
        setInviteDialogMember(null);
      }
    } catch (err) {
      toast.error('Failed to generate invite', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
      setInviteDialogMember(null);
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteCopied(true);
      toast.success('Invite link copied!', {
        description: 'Share this link with the family member.',
      });
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      toast.error('Failed to copy', {
        description: 'Please copy the link manually.',
      });
    }
  };

  const adminCount = members.filter((m) => m.role === 'admin').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Family Members
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage who has access to your family archive
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchMembers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Family Member</DialogTitle>
                <DialogDescription>
                  Add a new member to your family archive.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Name</Label>
                  <Input
                    id="add-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-email">Email</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => setFormData({ ...formData, role: v as MemberRole })}
                  >
                    <SelectTrigger id="add-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">
                        <span className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Member
                        </span>
                      </SelectItem>
                      <SelectItem value="admin">
                        <span className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Admin
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Admins can manage members and settings. Members can only view and query documents.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember} disabled={isSaving || !formData.name || !formData.email}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-auto p-1"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {/* Summary Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{members.length}</p>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{adminCount}</p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{members.length - adminCount}</p>
                  <p className="text-sm text-muted-foreground">Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Members</CardTitle>
              <CardDescription>
                {members.length === 0
                  ? 'No members added yet'
                  : `${members.length} member${members.length === 1 ? '' : 's'} in your family`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium relative">
                        {getInitials(member.name)}
                        {/* Auth status indicator */}
                        <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card flex items-center justify-center ${
                          member.has_password ? 'bg-green-500' : member.invite_pending ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}>
                          {member.has_password ? (
                            <CheckCircle2 className="h-2 w-2 text-white" />
                          ) : member.invite_pending ? (
                            <Clock className="h-2 w-2 text-white" />
                          ) : (
                            <AlertCircle className="h-2 w-2 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{member.name}</span>
                          <Badge
                            variant={member.role === 'admin' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {member.role === 'admin' ? (
                              <Crown className="mr-1 h-3 w-3" />
                            ) : (
                              <User className="mr-1 h-3 w-3" />
                            )}
                            {member.role}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {member.member_type || 'adult'}
                          </Badge>
                          {!member.has_password && (
                            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-600">
                              No password
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </span>
                          {member.last_login && (
                            <span className="text-xs">
                              Last login: {formatDate(member.last_login)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!member.has_password && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Generate invite link"
                          onClick={() => handleGenerateInvite(member)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Link2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Set password"
                        onClick={() => openPasswordDialog(member)}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(member)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirmId(member.id)}
                        disabled={member.role === 'admin' && adminCount === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {members.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-1">No family members yet</p>
                    <p className="text-sm mb-4">Add your first member to get started</p>
                    <Button
                      onClick={() => {
                        setFormData(EMPTY_FORM);
                        setIsAddDialogOpen(true);
                      }}
                      size="sm"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add First Member
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Roles Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                About Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="default" className="mt-0.5">
                  <Crown className="mr-1 h-3 w-3" />
                  Admin
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Full access to all features. Can manage family members, view analytics,
                  configure settings, and upload documents.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge variant="secondary" className="mt-0.5">
                  <User className="mr-1 h-3 w-3" />
                  Member
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Can chat with the archive, view documents, and see their own usage.
                  Cannot manage other members or change system settings.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>Update member information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v as MemberRole })}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-member-type">Member Type</Label>
              <Select
                value={formData.member_type}
                onValueChange={(v) => setFormData({ ...formData, member_type: v as MemberType })}
              >
                <SelectTrigger id="edit-member-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Controls which documents this member can see based on visibility settings.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditMember} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Family Member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the member from your family archive. They will no longer
              have access to documents or chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleDeleteMember(deleteConfirmId)}
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Set Password Dialog */}
      <Dialog open={passwordDialogMember !== null} onOpenChange={() => setPasswordDialogMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Set Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for {passwordDialogMember?.name}
            </DialogDescription>
          </DialogHeader>
          {passwordSuccess ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="font-medium">Password set successfully!</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Password must be at least 8 characters.
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPasswordDialogMember(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSetPassword}
                  disabled={isSettingPassword || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                >
                  {isSettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Set Password
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Invite Link Dialog */}
      <Dialog open={inviteDialogMember !== null} onOpenChange={() => setInviteDialogMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Invite Link
            </DialogTitle>
            <DialogDescription>
              {inviteDialogMember
                ? `Share this link with ${inviteDialogMember.name} so they can set their password`
                : 'Generate an invite link'}
            </DialogDescription>
          </DialogHeader>
          {isGeneratingInvite ? (
            <div className="py-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Generating invite link...</p>
            </div>
          ) : inviteLink ? (
            <div className="space-y-4 py-4">
              {inviteEmailSent && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
                  <Mail className="h-4 w-4" />
                  <span>Email sent to {inviteDialogMember?.email}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label>{inviteEmailSent ? 'Or share this link directly' : 'Invite Link'}</Label>
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyInvite}
                    className="shrink-0"
                  >
                    {inviteCopied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {inviteExpires && (
                <p className="text-xs text-muted-foreground">
                  This link expires on {formatDate(inviteExpires)}
                </p>
              )}
              {!inviteEmailSent && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium mb-1">How to use:</p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1 text-xs">
                    <li>Copy the invite link above</li>
                    <li>Share it with {inviteDialogMember?.name}</li>
                    <li>They'll be prompted to set their password</li>
                    <li>Once set, they can sign in normally</li>
                  </ol>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogMember(null)}>
              Done
            </Button>
            {inviteLink && (
              <Button onClick={handleCopyInvite}>
                {inviteCopied ? (
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
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Palette,
  Bell,
  Database,
  Key,
  Info,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Download,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  User,
  LogOut,
  Loader2,
  Shield,
  HelpCircle,
} from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

interface SettingsViewProps {
  isDark: boolean;
  onToggleTheme: () => void;
  isEffectiveAdmin?: boolean;
}

type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  theme: ThemeMode;
  notifications: {
    documentUploads: boolean;
    queryResults: boolean;
    systemUpdates: boolean;
  };
  data: {
    autoSaveChats: boolean;
    retainHistory: string;
  };
  api: {
    endpoint: string;
    workspace: string;
  };
}

const DEFAULT_SETTINGS: SettingsState = {
  theme: 'system',
  notifications: {
    documentUploads: true,
    queryResults: false,
    systemUpdates: true,
  },
  data: {
    autoSaveChats: true,
    retainHistory: '30',
  },
  api: {
    endpoint: 'http://localhost',
    workspace: 'family-brain',
  },
};

export function SettingsView({ isDark, onToggleTheme, isEffectiveAdmin }: SettingsViewProps) {
  const [settings, setSettings] = useState<SettingsState>(() => {
    const saved = localStorage.getItem('archevi-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  const [saved, setSaved] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const { user, logout } = useAuthStore();
  // Use effective admin status from props (respects "View as" toggle), fallback to role check
  const isAdmin = isEffectiveAdmin ?? user?.role === 'admin';

  const handleLogout = async () => {
    setLoggingOut(true);
    toast.info('Signing out...');
    await logout();
  };

  const handleLogoutAll = async () => {
    if (confirm('This will sign you out of all devices. Continue?')) {
      setLoggingOut(true);
      toast.info('Signing out of all devices...');
      await logout(true);
    }
  };

  useEffect(() => {
    // Sync theme state with actual theme
    const savedTheme = localStorage.getItem('archevi-theme');
    if (savedTheme === 'dark') {
      setSettings(s => ({ ...s, theme: 'dark' }));
    } else if (savedTheme === 'light') {
      setSettings(s => ({ ...s, theme: 'light' }));
    }
  }, []);

  const handleThemeChange = (theme: ThemeMode) => {
    setSettings(s => ({ ...s, theme }));

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark !== isDark) {
        onToggleTheme();
      }
      localStorage.removeItem('archevi-theme');
    } else if (theme === 'dark' && !isDark) {
      onToggleTheme();
    } else if (theme === 'light' && isDark) {
      onToggleTheme();
    }
  };

  const updateNotification = (key: keyof SettingsState['notifications'], value: boolean) => {
    setSettings(s => ({
      ...s,
      notifications: { ...s.notifications, [key]: value },
    }));
  };

  const updateData = (key: keyof SettingsState['data'], value: string | boolean) => {
    setSettings(s => ({
      ...s,
      data: { ...s.data, [key]: value },
    }));
  };

  const updateApi = (key: keyof SettingsState['api'], value: string) => {
    setSettings(s => ({
      ...s,
      api: { ...s.api, [key]: value },
    }));
  };

  const saveSettings = () => {
    localStorage.setItem('archevi-settings', JSON.stringify(settings));
    setSaved(true);
    toast.success('Settings saved', {
      description: 'Your preferences have been updated.',
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const exportData = () => {
    const data = {
      settings: localStorage.getItem('archevi-settings'),
      theme: localStorage.getItem('archevi-theme'),
      chatSessions: localStorage.getItem('archevi-chat-sessions'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archevi-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Settings
            {isAdmin && (
              <Badge variant="secondary" className="ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? 'Manage your preferences and system configuration'
              : 'Manage your personal preferences'}
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saved}>
          {saved ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Saved
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6 pr-4">
          {/* Account */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Account
              </CardTitle>
              <CardDescription>
                Manage your account and sign out
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Signed in as</Label>
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="mr-2 h-4 w-4" />
                  )}
                  Sign Out
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogoutAll}
                  disabled={loggingOut}
                  className="text-muted-foreground"
                >
                  Sign Out All Devices
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Appearance
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Theme Settings</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose your preferred color scheme. "System" will automatically match your device's dark/light mode preference.
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </CardTitle>
              <CardDescription>
                Customize how Archevi looks on your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred color scheme
                  </p>
                </div>
                <Select value={settings.theme} onValueChange={(v) => handleThemeChange(v as ThemeMode)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <span className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </span>
                    </SelectItem>
                    <SelectItem value="dark">
                      <span className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </span>
                    </SelectItem>
                    <SelectItem value="system">
                      <span className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Browser Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        These settings control in-app toast notifications that appear in the corner of your screen. They don't send emails or push notifications to your phone.
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </CardTitle>
              <CardDescription>
                Configure when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-uploads">Document uploads</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when documents finish processing
                  </p>
                </div>
                <Switch
                  id="notify-uploads"
                  checked={settings.notifications.documentUploads}
                  onCheckedChange={(v) => updateNotification('documentUploads', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-queries">Query results</Label>
                  <p className="text-sm text-muted-foreground">
                    Show notification when queries complete
                  </p>
                </div>
                <Switch
                  id="notify-queries"
                  checked={settings.notifications.queryResults}
                  onCheckedChange={(v) => updateNotification('queryResults', v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-system">System updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about new features
                  </p>
                </div>
                <Switch
                  id="notify-system"
                  checked={settings.notifications.systemUpdates}
                  onCheckedChange={(v) => updateNotification('systemUpdates', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Data & Storage - Admin only */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data & Storage
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-72">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Local Data Management</h4>
                        <p className="text-sm text-muted-foreground">
                          These settings control data stored in your browser. Documents in the knowledge base are stored on the server and not affected by these settings.
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  <Badge variant="outline" className="ml-auto text-xs">Admin</Badge>
                </CardTitle>
                <CardDescription>
                  Manage system data and storage preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save">Auto-save chat sessions</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save conversations locally
                    </p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={settings.data.autoSaveChats}
                    onCheckedChange={(v) => updateData('autoSaveChats', v)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Retain chat history</Label>
                    <p className="text-sm text-muted-foreground">
                      How long to keep chat history
                    </p>
                  </div>
                  <Select
                    value={settings.data.retainHistory}
                    onValueChange={(v) => updateData('retainHistory', v)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="forever">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={exportData}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={clearAllData}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Configuration - Admin only */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Configuration
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-72">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Backend Connection</h4>
                        <p className="text-sm text-muted-foreground">
                          Windmill is the backend that powers Archevi's AI features, document storage, and user management. Only change these if you know what you're doing.
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  <Badge variant="outline" className="ml-auto text-xs">Admin</Badge>
                </CardTitle>
                <CardDescription>
                  Configure your Windmill backend connection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">API Endpoint</Label>
                  <Input
                    id="api-endpoint"
                    value={settings.api.endpoint}
                    onChange={(e) => updateApi('endpoint', e.target.value)}
                    placeholder="http://localhost"
                  />
                  <p className="text-xs text-muted-foreground">
                    The base URL for your Windmill instance
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-workspace">Workspace</Label>
                  <Input
                    id="api-workspace"
                    value={settings.api.workspace}
                    onChange={(e) => updateApi('workspace', e.target.value)}
                    placeholder="family-brain"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Windmill workspace name
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test Connection
                </Button>
              </CardContent>
            </Card>
          )}

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                About Archevi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="text-sm font-mono">0.1.0</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Build</span>
                <span className="text-sm font-mono">dev</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Archevi is your family's smart document assistant, powered by RAG
                  (Retrieval-Augmented Generation) to help you find and understand
                  your important documents.
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="link" size="sm" className="h-auto p-0">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Documentation
                  </Button>
                  <span className="text-muted-foreground">|</span>
                  <Button variant="link" size="sm" className="h-auto p-0">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Report an Issue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

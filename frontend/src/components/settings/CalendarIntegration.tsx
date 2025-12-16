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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  Copy,
  RefreshCw,
  Check,
  HelpCircle,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { windmill } from '@/api/windmill';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import type { CalendarSettings } from '@/api/windmill/types';

// Default tenant for MVP
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

// Available document categories
const DOCUMENT_CATEGORIES = [
  { id: 'insurance', label: 'Insurance' },
  { id: 'legal', label: 'Legal' },
  { id: 'medical', label: 'Medical' },
  { id: 'financial', label: 'Financial' },
  { id: 'receipts', label: 'Receipts' },
  { id: 'auto', label: 'Auto' },
  { id: 'home', label: 'Home' },
];

// Available reminder options
const REMINDER_OPTIONS = [
  { days: 1, label: '1 day before' },
  { days: 7, label: '1 week before' },
  { days: 14, label: '2 weeks before' },
  { days: 30, label: '1 month before' },
];

export function CalendarIntegration() {
  const [settings, setSettings] = useState<CalendarSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local edit state
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedReminders, setSelectedReminders] = useState<number[]>([]);

  const { user } = useAuthStore();
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;

  useEffect(() => {
    fetchSettings();
  }, [tenantId]);

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await windmill.getCalendarSettings({
        tenant_id: tenantId,
      });

      if (result.success && result.settings) {
        setSettings(result.settings);
        setIsEnabled(result.settings.is_enabled);
        setSelectedCategories(result.settings.include_categories);
        setSelectedReminders(result.settings.reminder_days);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const result = await windmill.updateCalendarSettings(tenantId, {
        is_enabled: isEnabled,
        include_categories: selectedCategories,
        reminder_days: selectedReminders,
      });

      if (result.success && result.settings) {
        setSettings(result.settings);
        toast.success('Calendar settings saved');
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateToken = async () => {
    setIsRegenerating(true);

    try {
      const result = await windmill.regenerateCalendarToken(tenantId);

      if (result.success && result.settings) {
        setSettings(result.settings);
        toast.success('Calendar feed URL regenerated', {
          description: 'Your old URL will no longer work. Update your calendar subscription.',
        });
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate token');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!settings?.feed_url) return;

    try {
      await navigator.clipboard.writeText(settings.feed_url);
      setCopied(true);
      toast.success('Feed URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleReminder = (days: number) => {
    setSelectedReminders((prev) =>
      prev.includes(days)
        ? prev.filter((d) => d !== days)
        : [...prev, days].sort((a, b) => a - b)
    );
  };

  const hasChanges =
    settings &&
    (isEnabled !== settings.is_enabled ||
      JSON.stringify([...selectedCategories].sort()) !==
        JSON.stringify([...settings.include_categories].sort()) ||
      JSON.stringify([...selectedReminders].sort()) !==
        JSON.stringify([...settings.reminder_days].sort()));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchSettings} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Calendar Integration
          <HoverCard>
            <HoverCardTrigger asChild>
              <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">iCal Feed Subscription</h4>
                <p className="text-sm text-muted-foreground">
                  Subscribe to your document expiry dates in any calendar app (Google Calendar,
                  Apple Calendar, Outlook). The calendar automatically updates when you add
                  documents with expiry dates.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </CardTitle>
        <CardDescription>
          Sync document expiry dates to your calendar app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="calendar-enabled">Enable calendar feed</Label>
            <p className="text-sm text-muted-foreground">
              Allow external calendar apps to subscribe
            </p>
          </div>
          <Switch
            id="calendar-enabled"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        <Separator />

        {/* Feed URL */}
        <div className="space-y-3">
          <Label>Calendar Feed URL</Label>
          <div className="flex gap-2">
            <Input
              value={settings?.feed_url || ''}
              readOnly
              className="font-mono text-xs"
              placeholder="Loading..."
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyUrl}
              disabled={!settings?.feed_url}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {settings?.last_accessed_at && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last accessed: {new Date(settings.last_accessed_at).toLocaleDateString()}
              </span>
            )}
            {settings && settings.access_count > 0 && (
              <span>Accessed {settings.access_count} times</span>
            )}
          </div>
        </div>

        <Separator />

        {/* Categories to include */}
        <div className="space-y-3">
          <Label>Include document categories</Label>
          <div className="grid grid-cols-2 gap-2">
            {DOCUMENT_CATEGORIES.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => toggleCategory(category.id)}
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="text-sm cursor-pointer"
                >
                  {category.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Reminder timing */}
        <div className="space-y-3">
          <Label>Reminder alerts</Label>
          <p className="text-sm text-muted-foreground">
            When to show reminders before document expiry
          </p>
          <div className="flex flex-wrap gap-2">
            {REMINDER_OPTIONS.map((option) => (
              <Badge
                key={option.days}
                variant={selectedReminders.includes(option.days) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleReminder(option.days)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Setup instructions */}
        <div className="space-y-3">
          <Label>How to subscribe</Label>
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Google Calendar:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Copy the feed URL above</li>
              <li>Open Google Calendar Settings</li>
              <li>Click "Add calendar" then "From URL"</li>
              <li>Paste the URL and click "Add calendar"</li>
            </ol>
            <p className="font-medium text-foreground mt-3">Apple Calendar:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Copy the feed URL above</li>
              <li>File - New Calendar Subscription</li>
              <li>Paste the URL and click Subscribe</li>
            </ol>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isRegenerating}>
                {isRegenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Regenerate URL
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Regenerate Calendar URL?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will create a new feed URL. Your old URL will stop working immediately.
                  You'll need to update your calendar subscription with the new URL.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRegenerateToken}>
                  Regenerate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

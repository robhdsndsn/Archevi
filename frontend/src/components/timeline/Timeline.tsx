import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Baby,
  Heart,
  HeartOff,
  Cake,
  GraduationCap,
  Stethoscope,
  Scale,
  Banknote,
  ShieldCheck,
  ShoppingCart,
  Plane,
  Trophy,
  Camera,
  Calendar,
  CalendarIcon,
  Plus,
  Filter,
  RefreshCw,
  FileText,
  User,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
} from 'lucide-react';
import { windmill } from '@/api/windmill';
import type {
  TimelineEvent,
  TimelineEventType,
  TimelineSummary,
} from '@/api/windmill/types';
import { useAuthStore } from '@/store/auth-store';
import { format, parseISO, getYear } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Default tenant for MVP
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

// Event type icon mapping
const EVENT_ICONS: Record<TimelineEventType, React.ComponentType<{ className?: string }>> = {
  birth: Baby,
  death: HeartOff,
  wedding: Heart,
  anniversary: Cake,
  graduation: GraduationCap,
  medical: Stethoscope,
  legal: Scale,
  financial: Banknote,
  insurance: ShieldCheck,
  purchase: ShoppingCart,
  travel: Plane,
  milestone: Trophy,
  photo: Camera,
  other: Calendar,
};

// Event type colors
const EVENT_COLORS: Record<TimelineEventType, string> = {
  birth: 'bg-pink-100 text-pink-700 border-pink-200',
  death: 'bg-gray-100 text-gray-700 border-gray-200',
  wedding: 'bg-red-100 text-red-700 border-red-200',
  anniversary: 'bg-purple-100 text-purple-700 border-purple-200',
  graduation: 'bg-blue-100 text-blue-700 border-blue-200',
  medical: 'bg-green-100 text-green-700 border-green-200',
  legal: 'bg-amber-100 text-amber-700 border-amber-200',
  financial: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  insurance: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  purchase: 'bg-orange-100 text-orange-700 border-orange-200',
  travel: 'bg-sky-100 text-sky-700 border-sky-200',
  milestone: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  photo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};

// Timeline line colors
const LINE_COLORS: Record<TimelineEventType, string> = {
  birth: 'bg-pink-400',
  death: 'bg-gray-400',
  wedding: 'bg-red-400',
  anniversary: 'bg-purple-400',
  graduation: 'bg-blue-400',
  medical: 'bg-green-400',
  legal: 'bg-amber-400',
  financial: 'bg-emerald-400',
  insurance: 'bg-cyan-400',
  purchase: 'bg-orange-400',
  travel: 'bg-sky-400',
  milestone: 'bg-yellow-400',
  photo: 'bg-indigo-400',
  other: 'bg-slate-400',
};

interface TimelineProps {
  onDocumentClick?: (documentId: number) => void;
}

export function Timeline({ onDocumentClick }: TimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [summary, setSummary] = useState<TimelineSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedTypes, setSelectedTypes] = useState<TimelineEventType[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Add event dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    event_date: '',
    event_type: 'other' as TimelineEventType,
    description: '',
    family_member_name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useAuthStore();
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;

  // Get available years from summary
  const availableYears = useMemo(() => {
    if (!summary?.by_year) return [];
    return Object.keys(summary.by_year)
      .map(Number)
      .sort((a, b) => b - a);
  }, [summary]);

  // Filter events by year and type
  const filteredEvents = useMemo(() => {
    let result = events;

    if (selectedYear !== 'all') {
      const year = parseInt(selectedYear);
      result = result.filter((e) => getYear(parseISO(e.event_date)) === year);
    }

    if (selectedTypes.length > 0) {
      result = result.filter((e) => selectedTypes.includes(e.event_type));
    }

    return result;
  }, [events, selectedYear, selectedTypes]);

  // Group events by year
  const groupedEvents = useMemo(() => {
    const grouped: Record<number, TimelineEvent[]> = {};

    filteredEvents.forEach((event) => {
      const year = getYear(parseISO(event.event_date));
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(event);
    });

    // Sort years descending, events within year by date descending
    const sortedYears = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a);

    return sortedYears.map((year) => ({
      year,
      events: grouped[year].sort(
        (a, b) =>
          new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      ),
    }));
  }, [filteredEvents]);

  const fetchTimeline = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await windmill.getTimelineEvents({
        tenant_id: tenantId,
        limit: 500, // Get plenty of events
      });

      if (result.success) {
        setEvents(result.events);
        setSummary(result.summary);
      } else {
        setError(result.error || 'Failed to load timeline');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [tenantId]);

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.event_date) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await windmill.manageTimelineEvent({
        action: 'create',
        tenant_id: tenantId,
        title: newEvent.title,
        event_date: newEvent.event_date,
        event_type: newEvent.event_type,
        description: newEvent.description || undefined,
        family_member_name: newEvent.family_member_name || undefined,
      });

      if (result.success) {
        toast.success('Event added to timeline');
        setShowAddDialog(false);
        setNewEvent({
          title: '',
          event_date: '',
          event_type: 'other',
          description: '',
          family_member_name: '',
        });
        fetchTimeline(); // Refresh
      } else {
        toast.error(result.error || 'Failed to add event');
      }
    } catch (err) {
      toast.error('Failed to add event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEventType = (type: TimelineEventType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <div className="ml-8 space-y-4">
              {[1, 2].map((j) => (
                <Skeleton key={j} className="h-24 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="m-4">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchTimeline} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <Card className="m-4">
        <CardContent className="p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Timeline Events Yet</h3>
          <p className="text-muted-foreground mb-4">
            Your family timeline will populate as you upload documents with dates,
            or you can add events manually.
          </p>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <AddEventDialogContent
              newEvent={newEvent}
              setNewEvent={setNewEvent}
              onSubmit={handleAddEvent}
              isSubmitting={isSubmitting}
            />
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Family Timeline</h1>
          <p className="text-muted-foreground">
            {summary?.total || 0} events across your family history
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {showFilters ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <AddEventDialogContent
              newEvent={newEvent}
              setNewEvent={setNewEvent}
              onSubmit={handleAddEvent}
              isSubmitting={isSubmitting}
            />
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-4">
              {/* Year filter */}
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All years</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Event type filters - compact dropdown */}
            <div className="space-y-2">
              <Label>Event Types</Label>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between min-w-[180px]">
                      {selectedTypes.length === 0 ? (
                        'All types'
                      ) : selectedTypes.length === 1 ? (
                        <span className="capitalize">{selectedTypes[0].replace('_', ' ')}</span>
                      ) : (
                        `${selectedTypes.length} types selected`
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                    <DropdownMenuLabel>Filter by type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(Object.keys(EVENT_ICONS) as TimelineEventType[]).map((type) => {
                      const Icon = EVENT_ICONS[type];
                      const isSelected = selectedTypes.includes(type);
                      return (
                        <DropdownMenuCheckboxItem
                          key={type}
                          checked={isSelected}
                          onCheckedChange={() => toggleEventType(type)}
                          className="capitalize"
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {type.replace('_', ' ')}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {selectedTypes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTypes([])}
                    className="text-xs h-8 px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              {/* Show selected types as small badges */}
              {selectedTypes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedTypes.map((type) => {
                    const Icon = EVENT_ICONS[type];
                    return (
                      <Badge
                        key={type}
                        variant="secondary"
                        className={cn('text-xs capitalize cursor-pointer', EVENT_COLORS[type])}
                        onClick={() => toggleEventType(type)}
                      >
                        <Icon className="mr-1 h-3 w-3" />
                        {type.replace('_', ' ')}
                        <X className="ml-1 h-3 w-3" />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Summary - compact, clickable badges */}
      {summary && !showFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {(() => {
            const sortedTypes = Object.entries(summary.by_type)
              .sort(([, a], [, b]) => b - a);
            const visibleTypes = sortedTypes.slice(0, 3);
            const hiddenCount = sortedTypes.length - 3;

            return (
              <>
                {visibleTypes.map(([type, count]) => {
                  const Icon = EVENT_ICONS[type as TimelineEventType] || Calendar;
                  const isFiltered = selectedTypes.includes(type as TimelineEventType);
                  return (
                    <Badge
                      key={type}
                      variant={isFiltered ? 'default' : 'secondary'}
                      className={cn(
                        'capitalize cursor-pointer transition-colors',
                        EVENT_COLORS[type as TimelineEventType],
                        isFiltered && 'ring-2 ring-primary ring-offset-1'
                      )}
                      onClick={() => toggleEventType(type as TimelineEventType)}
                    >
                      <Icon className="mr-1 h-3 w-3" />
                      {count} {type.replace('_', ' ')}
                    </Badge>
                  );
                })}
                {hiddenCount > 0 && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                      >
                        +{hiddenCount} more
                      </Badge>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-2" align="start">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground mb-2">Click to filter</p>
                        <div className="flex flex-wrap gap-1">
                          {sortedTypes.slice(3).map(([type, count]) => {
                            const Icon = EVENT_ICONS[type as TimelineEventType] || Calendar;
                            const isFiltered = selectedTypes.includes(type as TimelineEventType);
                            return (
                              <Badge
                                key={type}
                                variant={isFiltered ? 'default' : 'secondary'}
                                className={cn(
                                  'text-xs capitalize cursor-pointer',
                                  EVENT_COLORS[type as TimelineEventType],
                                  isFiltered && 'ring-1 ring-primary'
                                )}
                                onClick={() => toggleEventType(type as TimelineEventType)}
                              >
                                <Icon className="mr-1 h-3 w-3" />
                                {count}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {selectedTypes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTypes([])}
                    className="h-6 px-2 text-xs text-muted-foreground"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Timeline */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

          {groupedEvents.map(({ year, events: yearEvents }) => (
            <div key={year} className="mb-8">
              {/* Year marker */}
              <div className="flex items-center gap-3 mb-4">
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {year.toString().slice(-2)}
                </div>
                <span className="text-lg font-semibold">{year}</span>
                <span className="text-muted-foreground text-sm">
                  ({yearEvents.length} events)
                </span>
              </div>

              {/* Events for this year */}
              <div className="ml-12 space-y-4">
                {yearEvents.map((event) => (
                  <TimelineEventCard
                    key={event.id}
                    event={event}
                    onDocumentClick={onDocumentClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Timeline event card component
interface TimelineEventCardProps {
  event: TimelineEvent;
  onDocumentClick?: (documentId: number) => void;
}

function TimelineEventCard({ event, onDocumentClick }: TimelineEventCardProps) {
  const Icon = EVENT_ICONS[event.event_type] || Calendar;
  const colorClass = EVENT_COLORS[event.event_type] || EVENT_COLORS.other;
  const lineColor = LINE_COLORS[event.event_type] || LINE_COLORS.other;

  return (
    <div className="relative">
      {/* Connecting line dot */}
      <div
        className={cn(
          'absolute -left-10 top-4 h-3 w-3 rounded-full border-2 border-background',
          lineColor
        )}
      />

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Event icon */}
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg border',
                colorClass
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            {/* Event content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium truncate">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(event.event_date), 'MMMM d, yyyy')}
                    {event.event_end_date && (
                      <> - {format(parseISO(event.event_end_date), 'MMMM d, yyyy')}</>
                    )}
                  </p>
                </div>

                <Badge variant="outline" className={cn('capitalize shrink-0', colorClass)}>
                  {event.event_type.replace('_', ' ')}
                </Badge>
              </div>

              {event.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {event.description}
                </p>
              )}

              {/* Meta info */}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {event.family_member_name && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {event.family_member_name}
                  </span>
                )}

                {event.document_title && event.document_id && (
                  <button
                    onClick={() => onDocumentClick?.(event.document_id!)}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    <FileText className="h-3 w-3" />
                    <span className="truncate max-w-32">{event.document_title}</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}

                {event.source === 'extracted' && event.confidence && (
                  <span className="text-muted-foreground/70">
                    {Math.round(event.confidence * 100)}% confidence
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add event dialog content
interface AddEventDialogContentProps {
  newEvent: {
    title: string;
    event_date: string;
    event_type: TimelineEventType;
    description: string;
    family_member_name: string;
  };
  setNewEvent: React.Dispatch<
    React.SetStateAction<{
      title: string;
      event_date: string;
      event_type: TimelineEventType;
      description: string;
      family_member_name: string;
    }>
  >;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function AddEventDialogContent({
  newEvent,
  setNewEvent,
  onSubmit,
  isSubmitting,
}: AddEventDialogContentProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Parse the event_date string to Date object for the calendar
  const selectedDate = newEvent.event_date
    ? parseISO(newEvent.event_date)
    : undefined;

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Timeline Event</DialogTitle>
        <DialogDescription>
          Add a significant date or milestone to your family timeline.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="event-title">Title *</Label>
          <Input
            id="event-title"
            placeholder="e.g., John's Graduation"
            value={newEvent.title}
            onChange={(e) =>
              setNewEvent((prev) => ({ ...prev, title: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Date *</Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !newEvent.event_date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {newEvent.event_date ? (
                  format(parseISO(newEvent.event_date), 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setNewEvent((prev) => ({
                      ...prev,
                      event_date: format(date, 'yyyy-MM-dd'),
                    }));
                  }
                  setCalendarOpen(false);
                }}
                initialFocus
                captionLayout="dropdown"
                fromYear={1900}
                toYear={new Date().getFullYear() + 10}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-type">Event Type</Label>
          <Select
            value={newEvent.event_type}
            onValueChange={(value) =>
              setNewEvent((prev) => ({
                ...prev,
                event_type: value as TimelineEventType,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(EVENT_ICONS) as TimelineEventType[]).map((type) => {
                const Icon = EVENT_ICONS[type];
                return (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-person">Person (optional)</Label>
          <Input
            id="event-person"
            placeholder="e.g., John Smith"
            value={newEvent.family_member_name}
            onChange={(e) =>
              setNewEvent((prev) => ({
                ...prev,
                family_member_name: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-description">Description (optional)</Label>
          <Textarea
            id="event-description"
            placeholder="Add any additional details..."
            value={newEvent.description}
            onChange={(e) =>
              setNewEvent((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !newEvent.title || !newEvent.event_date}
          >
            {isSubmitting ? 'Adding...' : 'Add Event'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export default Timeline;

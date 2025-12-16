'use client';

import { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLatestAnnouncement } from '@/lib/strapi-client';
import type { Announcement, AnnouncementDisplayLocation, AnnouncementType } from '@/lib/types/strapi';
import { renderBlocksToText } from '@/lib/strapi-client';

interface AnnouncementBannerProps {
  /** The page location to filter announcements for */
  location: AnnouncementDisplayLocation;
  /** Additional CSS classes */
  className?: string;
}

const typeConfig: Record<AnnouncementType, {
  icon: typeof Info;
  bgClass: string;
  textClass: string;
  borderClass: string;
}> = {
  Info: {
    icon: Info,
    bgClass: 'bg-blue-50 dark:bg-blue-950',
    textClass: 'text-blue-800 dark:text-blue-200',
    borderClass: 'border-blue-200 dark:border-blue-800',
  },
  Warning: {
    icon: AlertTriangle,
    bgClass: 'bg-yellow-50 dark:bg-yellow-950',
    textClass: 'text-yellow-800 dark:text-yellow-200',
    borderClass: 'border-yellow-200 dark:border-yellow-800',
  },
  Success: {
    icon: CheckCircle,
    bgClass: 'bg-green-50 dark:bg-green-950',
    textClass: 'text-green-800 dark:text-green-200',
    borderClass: 'border-green-200 dark:border-green-800',
  },
  Alert: {
    icon: AlertCircle,
    bgClass: 'bg-red-50 dark:bg-red-950',
    textClass: 'text-red-800 dark:text-red-200',
    borderClass: 'border-red-200 dark:border-red-800',
  },
};

export function AnnouncementBanner({ location, className }: AnnouncementBannerProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnnouncement() {
      try {
        const data = await getLatestAnnouncement(location);

        // If this is a page-specific banner (not "Everywhere"), skip announcements
        // that are set to "Everywhere" since those are shown by the layout banner
        if (data && location !== 'Everywhere' && data.display_location === 'Everywhere') {
          setAnnouncement(null);
          setIsLoading(false);
          return;
        }

        setAnnouncement(data);

        // Check if this announcement was previously dismissed
        if (data) {
          const dismissedKey = `announcement-dismissed-${data.documentId}`;
          const wasDismissed = localStorage.getItem(dismissedKey);
          if (wasDismissed) {
            setIsDismissed(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch announcement:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAnnouncement();
  }, [location]);

  const handleDismiss = () => {
    if (announcement) {
      // Remember dismissal in localStorage
      const dismissedKey = `announcement-dismissed-${announcement.documentId}`;
      localStorage.setItem(dismissedKey, 'true');
      setIsDismissed(true);
    }
  };

  // Don't render anything while loading, if dismissed, or if no announcement
  if (isLoading || isDismissed || !announcement) {
    return null;
  }

  const config = typeConfig[announcement.announcement_type];
  const Icon = config.icon;
  const messageText = renderBlocksToText(announcement.message);

  return (
    <div
      className={cn(
        'relative w-full border-b px-4 py-3',
        config.bgClass,
        config.borderClass,
        className
      )}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Icon className={cn('h-5 w-5 flex-shrink-0', config.textClass)} />
          <div className="flex-1">
            <span className={cn('font-medium', config.textClass)}>
              {announcement.title}
            </span>
            {messageText && (
              <span className={cn('ml-2', config.textClass)}>
                {messageText}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className={cn(
            'p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors',
            config.textClass
          )}
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

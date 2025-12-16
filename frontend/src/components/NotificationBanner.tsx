import { useState, useEffect, useCallback } from 'react';
import { X, Bell, AlertTriangle, Info, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { windmill } from '@/api/windmill';
import type { InAppNotification, NotificationType } from '@/api/windmill/types';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

// Default tenant for MVP
const DEFAULT_TENANT_ID = '5302d94d-4c08-459d-b49f-d211abdb4047';

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'alert':
      return <AlertTriangle className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'error':
      return <XCircle className="h-4 w-4" />;
    case 'success':
      return <CheckCircle className="h-4 w-4" />;
    case 'info':
    default:
      return <Info className="h-4 w-4" />;
  }
}

function getNotificationStyles(type: NotificationType) {
  switch (type) {
    case 'alert':
    case 'error':
      return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100';
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100';
    case 'success':
      return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100';
    case 'info':
    default:
      return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100';
  }
}

interface NotificationBannerProps {
  position?: 'top' | 'inline';
  className?: string;
}

export function NotificationBanner({ position = 'top', className }: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const { user } = useAuthStore();
  const tenantId = user?.tenant_id || DEFAULT_TENANT_ID;

  const fetchNotifications = useCallback(async () => {
    try {
      const result = await windmill.getNotifications({
        tenant_id: tenantId,
        user_id: user?.id,
        include_read: false,
        include_dismissed: false,
        limit: 10,
      });
      setNotifications(result.notifications);
      setUnreadCount(result.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, user?.id]);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleDismiss = async (notificationId: number) => {
    try {
      await windmill.manageNotification({
        action: 'dismiss',
        tenant_id: tenantId,
        notification_id: notificationId,
        user_id: user?.id,
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await windmill.manageNotification({
        action: 'read_all',
        tenant_id: tenantId,
        user_id: user?.id,
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (isLoading || notifications.length === 0) {
    return null;
  }

  const activeNotification = notifications[0];

  // Compact badge view (when collapsed)
  if (!isExpanded && position === 'top') {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full',
          'bg-background border shadow-lg hover:shadow-xl transition-all',
          className
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center text-xs">
            {unreadCount}
          </Badge>
        )}
      </button>
    );
  }

  // Expanded banner view
  return (
    <div
      className={cn(
        'border rounded-lg p-4 shadow-lg',
        position === 'top' && 'fixed top-4 right-4 z-50 max-w-md',
        getNotificationStyles(activeNotification.notification_type),
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {getNotificationIcon(activeNotification.notification_type)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">
              {activeNotification.title}
            </h4>
            <p className="text-sm mt-1 opacity-90">
              {activeNotification.message}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 1 && (
            <Badge variant="secondary" className="text-xs">
              +{unreadCount - 1} more
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              if (position === 'top') {
                setIsExpanded(false);
              } else {
                handleDismiss(activeNotification.id);
              }
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/10">
        <div className="flex items-center gap-2">
          {activeNotification.action_url && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                if (activeNotification.action_url) {
                  window.location.hash = activeNotification.action_url.replace('/', '');
                }
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {activeNotification.action_label || 'View Details'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => handleDismiss(activeNotification.id)}
          >
            Dismiss
          </Button>
        </div>
        {unreadCount > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleMarkAllRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Additional notifications preview */}
      {notifications.length > 1 && (
        <div className="mt-3 pt-3 border-t border-current/10 space-y-2">
          {notifications.slice(1, 3).map((notification) => (
            <div
              key={notification.id}
              className="flex items-center justify-between text-sm opacity-80"
            >
              <div className="flex items-center gap-2 truncate">
                {getNotificationIcon(notification.notification_type)}
                <span className="truncate">{notification.title}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0"
                onClick={() => handleDismiss(notification.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

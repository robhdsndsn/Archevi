import { useState } from 'react';
import {
  Sparkles,
  FolderOpen,
  Plus,
  MoreHorizontal,
  BarChart3,
  Users,
  Building2,
  Clock,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import type { DocumentsTab } from '@/App';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: string, options?: { tab?: DocumentsTab }) => void;
  isSystemAdmin?: boolean;
  expiringCount?: number;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  badge?: number;
}

function NavItem({ icon, label, isActive, onClick, badge }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 relative transition-colors',
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full h-4 min-w-4 flex items-center justify-center px-1">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
      {isActive && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );
}

interface MoreMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  badge?: number;
  destructive?: boolean;
}

function MoreMenuItem({ icon, label, onClick, badge, destructive }: MoreMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full p-3 rounded-lg transition-colors',
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'hover:bg-accent'
      )}
    >
      {icon}
      <span className="flex-1 text-left font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
          {badge}
        </Badge>
      )}
    </button>
  );
}

export function MobileBottomNav({
  currentView,
  onNavigate,
  isSystemAdmin = false,
  expiringCount = 0,
}: MobileBottomNavProps) {
  const isMobile = useIsMobile();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Don't render on desktop
  if (!isMobile) return null;

  const handleNavigate = (view: string, options?: { tab?: DocumentsTab }) => {
    onNavigate(view, options);
    setIsMoreOpen(false);
  };

  // Check if "More" section has an active item
  const moreActiveViews = ['analytics', 'family', 'admin', 'settings', 'history'];
  const isMoreActive = moreActiveViews.includes(currentView);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden safe-area-bottom">
      <div className="flex items-stretch h-16">
        <NavItem
          icon={<Sparkles className="h-5 w-5" />}
          label="Ask AI"
          isActive={currentView === 'chat'}
          onClick={() => handleNavigate('chat')}
        />
        <NavItem
          icon={<FolderOpen className="h-5 w-5" />}
          label="Documents"
          isActive={currentView === 'documents'}
          onClick={() => handleNavigate('documents')}
        />
        <NavItem
          icon={<Plus className="h-5 w-5" />}
          label="Add"
          onClick={() => handleNavigate('documents', { tab: 'add' })}
        />
        <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 relative transition-colors',
                isMoreActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <MoreHorizontal className="h-5 w-5" />
                {expiringCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[10px] font-medium rounded-full h-4 min-w-4 flex items-center justify-center px-1">
                    {expiringCount > 99 ? '!' : expiringCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">More</span>
              {isMoreActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
            <SheetHeader className="pb-2">
              <SheetTitle>More Options</SheetTitle>
            </SheetHeader>
            <div className="space-y-1 pb-4">
              {/* Quick Access */}
              <div className="px-1 py-2">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Quick Access</p>
                <MoreMenuItem
                  icon={<AlertTriangle className={cn("h-5 w-5", expiringCount > 0 && "text-amber-500")} />}
                  label="Expiring Soon"
                  onClick={() => handleNavigate('documents', { tab: 'overview' })}
                  badge={expiringCount}
                />
                <MoreMenuItem
                  icon={<Clock className="h-5 w-5" />}
                  label="Recent Chats"
                  onClick={() => handleNavigate('history')}
                />
              </div>

              {/* Manage */}
              <div className="px-1 py-2 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Manage</p>
                <MoreMenuItem
                  icon={<BarChart3 className="h-5 w-5" />}
                  label="Analytics"
                  onClick={() => handleNavigate('analytics')}
                />
                <MoreMenuItem
                  icon={<Users className="h-5 w-5" />}
                  label="Family Members"
                  onClick={() => handleNavigate('family')}
                />
                {isSystemAdmin && (
                  <MoreMenuItem
                    icon={<Building2 className="h-5 w-5" />}
                    label="System Admin"
                    onClick={() => handleNavigate('admin')}
                  />
                )}
              </div>

              {/* Help */}
              <div className="px-1 py-2 border-t">
                <MoreMenuItem
                  icon={<HelpCircle className="h-5 w-5" />}
                  label="Help & Support"
                  onClick={() => alert('Help documentation coming soon!')}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

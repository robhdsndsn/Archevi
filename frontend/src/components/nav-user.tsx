import { useState } from 'react';
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Settings,
  Shield,
  User,
  Users,
  Eye,
  Loader2,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import type { ViewAsRole } from '@/App';

interface NavUserProps {
  onNavigate?: (view: string) => void;
  viewAs?: ViewAsRole;
  onViewAsChange?: (role: ViewAsRole) => void;
}

export function NavUser({ onNavigate, viewAs = 'admin', onViewAsChange }: NavUserProps) {
  const { isMobile } = useSidebar();
  const { user, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleLogout = async () => {
    setLoggingOut(true);
    toast.info('Signing out...');
    await logout();
  };

  const handleViewAsChange = (value: string) => {
    const role = value as ViewAsRole;
    onViewAsChange?.(role);
    toast.success(`Viewing as ${value}`, {
      description: value === 'admin'
        ? 'Full admin access enabled'
        : 'Viewing with standard user permissions',
    });
  };

  if (!user) return null;

  // Get initials for avatar fallback
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={undefined} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              {isAdmin && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  <Shield className="h-3 w-3 mr-0.5" />
                  {viewAs === 'admin' ? 'Admin' : 'User View'}
                </Badge>
              )}
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={undefined} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* View As (Admin only) */}
            {isAdmin && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Eye className="mr-2 h-4 w-4" />
                    <span>View as</span>
                    <Badge variant="outline" className="ml-auto text-[10px] h-5">
                      {viewAs === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={viewAs} onValueChange={handleViewAsChange}>
                      <DropdownMenuRadioItem value="admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin View
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="user">
                        <User className="mr-2 h-4 w-4" />
                        User View
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Navigation Items */}
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onNavigate?.('settings')}>
                <BadgeCheck className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate?.('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate?.('settings')}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>

            {/* Admin-only items */}
            {isAdmin && viewAs === 'admin' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onNavigate?.('family')}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Family
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-destructive focus:text-destructive"
            >
              {loggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              {loggingOut ? 'Signing out...' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

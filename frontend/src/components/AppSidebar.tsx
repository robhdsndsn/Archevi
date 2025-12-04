import { useState, useEffect } from 'react';
import {
  Archive,
  FolderOpen,
  Users,
  HelpCircle,
  Plus,
  Clock,
  BarChart3,
  Building2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { windmill } from '@/api/windmill';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavUser } from '@/components/nav-user';
import type { ViewAsRole, DocumentsTab } from '@/App';

interface AppSidebarProps {
  onNavigate?: (view: string, options?: { tab?: DocumentsTab }) => void;
  currentView?: string;
  viewAs?: ViewAsRole;
  onViewAsChange?: (role: ViewAsRole) => void;
}

export function AppSidebar({ onNavigate, currentView = 'chat', viewAs = 'admin', onViewAsChange }: AppSidebarProps) {
  const { user } = useAuthStore();
  const [expiringCount, setExpiringCount] = useState(0);

  // Show admin menu only to system admins
  const isSystemAdmin = user?.role === 'admin' && viewAs === 'admin';

  // Fetch expiring documents count on mount
  useEffect(() => {
    const fetchExpiringDocs = async () => {
      try {
        const result = await windmill.getExpiringDocuments(30); // Next 30 days
        if (result.success) {
          // Count urgent (< 7 days) and soon (< 14 days)
          const urgentCount = result.documents.filter(d => d.days_until_expiry <= 14).length;
          setExpiringCount(urgentCount);
        }
      } catch (error) {
        console.error('Failed to fetch expiring documents:', error);
      }
    };
    fetchExpiringDocs();
  }, []);

  const handleNavigate = (view: string, options?: { tab?: DocumentsTab }) => {
    onNavigate?.(view, options);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="w-full">
              <Archive className="h-6 w-6" />
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Archevi</span>
                <span className="text-xs text-muted-foreground">Family Archive</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation - Primary Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === 'documents'}
                  tooltip="Documents"
                  onClick={() => handleNavigate('documents')}
                >
                  <FolderOpen />
                  <span>Documents</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === 'chat'}
                  tooltip="Ask AI"
                  onClick={() => handleNavigate('chat')}
                >
                  <Sparkles />
                  <span>Ask AI</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Quick Access */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Access</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Add Document"
                  onClick={() => handleNavigate('documents', { tab: 'add' })}
                >
                  <Plus />
                  <span>Add Document</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Expiring Soon"
                  onClick={() => handleNavigate('documents', { tab: 'overview' })}
                  className="relative"
                >
                  <AlertTriangle className={expiringCount > 0 ? "text-amber-500" : ""} />
                  <span>Expiring Soon</span>
                  {expiringCount > 0 && (
                    <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-xs">
                      {expiringCount}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === 'history'}
                  tooltip="Recent Chats"
                  onClick={() => handleNavigate('history')}
                >
                  <Clock />
                  <span>Recent Chats</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Management */}
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === 'analytics'}
                  tooltip="Analytics"
                  onClick={() => handleNavigate('analytics')}
                >
                  <BarChart3 />
                  <span>Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === 'family'}
                  tooltip="Family Members"
                  onClick={() => handleNavigate('family')}
                >
                  <Users />
                  <span>Family Members</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isSystemAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={currentView === 'admin'}
                    tooltip="System Admin"
                    onClick={() => handleNavigate('admin')}
                  >
                    <Building2 />
                    <span>System Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Help"
              onClick={() => alert('Help documentation coming soon!')}
            >
              <HelpCircle />
              <span>Help & Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser onNavigate={handleNavigate} viewAs={viewAs} onViewAsChange={onViewAsChange} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

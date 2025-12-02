import {
  Archive,
  MessageSquare,
  FolderOpen,
  History,
  Users,
  HelpCircle,
  Upload,
  Search,
  BarChart3,
  Building2,
} from 'lucide-react';
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

  // Show admin menu only to system admins
  const isSystemAdmin = user?.role === 'admin' && viewAs === 'admin';

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
        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Upload Document"
                  onClick={() => handleNavigate('documents', { tab: 'upload' })}
                >
                  <Upload />
                  <span>Upload Document</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Search"
                  onClick={() => handleNavigate('documents', { tab: 'search' })}
                >
                  <Search />
                  <span>Search Documents</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === 'chat'}
                  tooltip="Chat"
                  onClick={() => handleNavigate('chat')}
                >
                  <MessageSquare />
                  <span>Chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
                  isActive={currentView === 'history'}
                  tooltip="Chat History"
                  onClick={() => handleNavigate('history')}
                >
                  <History />
                  <span>Chat History</span>
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

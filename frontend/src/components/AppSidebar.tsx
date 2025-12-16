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
  ChevronRight,
  CalendarDays,
  BookOpen,
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
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  const { isMobile, setOpenMobile } = useSidebar();
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
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setOpenMobile(false);
    }
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
        {/* Main Navigation - Primary Actions (Always visible) */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
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
                  isActive={currentView === 'timeline'}
                  tooltip="Family Timeline"
                  onClick={() => handleNavigate('timeline')}
                >
                  <CalendarDays />
                  <span>Timeline</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentView === 'biography'}
                  tooltip="Biography Generator"
                  onClick={() => handleNavigate('biography')}
                >
                  <BookOpen />
                  <span>Biographies</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Add Document"
                  onClick={() => handleNavigate('documents', { tab: 'add' })}
                >
                  <Plus />
                  <span>Add Document</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Quick Access - Collapsible on mobile for less clutter */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center">
                Quick Access
                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator />

        {/* Management - Collapsible */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center">
                Manage
                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Help"
              onClick={() => window.open('https://docs.archevi.ca', '_blank')}
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

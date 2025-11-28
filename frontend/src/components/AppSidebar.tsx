import { useState } from 'react';
import {
  Archive,
  MessageSquare,
  FolderOpen,
  History,
  Users,
  CreditCard,
  Stethoscope,
  Scale,
  Shield,
  GraduationCap,
  Heart,
  HelpCircle,
  Upload,
  Search,
  ChevronDown,
  BarChart3,
} from 'lucide-react';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { NavUser } from '@/components/nav-user';
import type { ViewAsRole } from '@/App';

interface AppSidebarProps {
  onNavigate?: (view: string) => void;
  currentView?: string;
  viewAs?: ViewAsRole;
  onViewAsChange?: (role: ViewAsRole) => void;
}

const categories = [
  { id: 'financial', label: 'Financial', icon: CreditCard },
  { id: 'medical', label: 'Medical', icon: Stethoscope },
  { id: 'legal', label: 'Legal', icon: Scale },
  { id: 'insurance', label: 'Insurance', icon: Shield },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'personal', label: 'Personal', icon: Heart },
];

export function AppSidebar({ onNavigate, currentView = 'chat', viewAs = 'admin', onViewAsChange }: AppSidebarProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const handleNavigate = (view: string) => {
    onNavigate?.(view);
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
                  onClick={() => handleNavigate('documents')}
                >
                  <Upload />
                  <span>Upload Document</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Search"
                  onClick={() => handleNavigate('documents')}
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Categories - hidden when sidebar collapsed to icons */}
        <Collapsible open={categoriesOpen} onOpenChange={setCategoriesOpen} className="group-data-[collapsible=icon]:hidden">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                Categories
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    categoriesOpen ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {categories.map((category) => (
                    <SidebarMenuItem key={category.id}>
                      <SidebarMenuButton
                        isActive={currentView === `category-${category.id}`}
                        tooltip={category.label}
                        onClick={() => handleNavigate(`category-${category.id}`)}
                      >
                        <category.icon />
                        <span>{category.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
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

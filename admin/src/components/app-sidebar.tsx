import {
  Activity,
  Brain,
  CreditCard,
  Database,
  FileText,
  Home,
  Server,
  Settings,
  Users,
  Workflow,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Dashboard",
    url: "#dashboard",
    icon: Home,
    isActive: true,
    items: [
      { title: "Overview", url: "#overview" },
      { title: "Activity Feed", url: "#activity" },
    ],
  },
  {
    title: "System Health",
    url: "#health",
    icon: Activity,
    items: [
      { title: "Services Status", url: "#services" },
      { title: "API Performance", url: "#api-perf" },
      { title: "Error Logs", url: "#errors" },
    ],
  },
  {
    title: "Tenants",
    url: "#tenants",
    icon: Users,
    items: [
      { title: "All Families", url: "#families" },
      { title: "Create Family", url: "#create-family" },
      { title: "Usage Stats", url: "#usage" },
    ],
  },
  {
    title: "Windmill",
    url: "#windmill",
    icon: Workflow,
    items: [
      { title: "Jobs", url: "#jobs" },
      { title: "Scripts", url: "#scripts" },
      { title: "Flows", url: "#flows" },
      { title: "Schedules", url: "#schedules" },
    ],
  },
  {
    title: "RAG System",
    url: "#rag",
    icon: Brain,
    items: [
      { title: "Documents", url: "#documents" },
      { title: "Embeddings", url: "#embeddings" },
      { title: "Query Stats", url: "#query-stats" },
    ],
  },
  {
    title: "Database",
    url: "#database",
    icon: Database,
    items: [
      { title: "PostgreSQL", url: "#postgres" },
      { title: "Qdrant", url: "#qdrant" },
      { title: "Migrations", url: "#migrations" },
    ],
  },
  {
    title: "Billing",
    url: "#billing",
    icon: CreditCard,
    items: [
      { title: "API Costs", url: "#api-costs" },
      { title: "Usage Tracking", url: "#usage-tracking" },
      { title: "Projections", url: "#projections" },
      { title: "Usage Alerts", url: "#alerts" },
    ],
  },
  {
    title: "Logs",
    url: "#logs",
    icon: FileText,
    items: [
      { title: "Application Logs", url: "#app-logs" },
      { title: "Audit Trail", url: "#audit" },
    ],
  },
  {
    title: "Settings",
    url: "#settings",
    icon: Settings,
    items: [
      { title: "General", url: "#general" },
      { title: "API Keys", url: "#api-keys" },
      { title: "Branding", url: "#branding" },
      { title: "Integrations", url: "#integrations" },
    ],
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name: string
    email: string
    avatar?: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Server className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">System Admin</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Family Second Brain
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

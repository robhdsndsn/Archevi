import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { DashboardOverview } from "@/components/dashboard/overview"
import { SystemHealth } from "@/components/dashboard/system-health"
import { UsageAlerts } from "@/components/dashboard/usage-alerts"
import { TenantList } from "@/components/tenants/tenant-list"
import { JobsList } from "@/components/windmill/jobs-list"
import { APICosts } from "@/components/billing/api-costs"
import { UsageTracking } from "@/components/billing/usage-tracking"
import { CostProjectionsPage } from "@/components/billing/cost-projections"
import { ActivityLog } from "@/components/logs/activity-log"
import { SystemSettings } from "@/components/settings/system-settings"
import { BrandingSettings } from "@/components/settings/branding-settings"
import { DocumentsList } from "@/components/rag/documents-list"
import { EmbeddingsStats } from "@/components/rag/embeddings-stats"
import { QueryStatsPage } from "@/components/rag/query-stats"
import { DatabaseStatsPage } from "@/components/database/database-stats"
import { ThemeToggle } from "@/components/theme-toggle"
import "./App.css"

// System admin user - in production this would come from auth
const SYSTEM_ADMIN = {
  name: "System Admin",
  email: "rhudson@archevi.com",
  avatar: undefined,
}

// Simple hash-based routing
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#overview")

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash || "#overview")
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  return hash
}

function getPageTitle(hash: string): { section: string; page: string } {
  const routes: Record<string, { section: string; page: string }> = {
    "#overview": { section: "Dashboard", page: "Overview" },
    "#activity": { section: "Dashboard", page: "Activity Feed" },
    "#services": { section: "System Health", page: "Services Status" },
    "#api-perf": { section: "System Health", page: "API Performance" },
    "#errors": { section: "System Health", page: "Error Logs" },
    "#families": { section: "Tenants", page: "All Families" },
    "#create-family": { section: "Tenants", page: "Create Family" },
    "#usage": { section: "Tenants", page: "Usage Stats" },
    "#jobs": { section: "Windmill", page: "Jobs" },
    "#scripts": { section: "Windmill", page: "Scripts" },
    "#flows": { section: "Windmill", page: "Flows" },
    "#schedules": { section: "Windmill", page: "Schedules" },
    "#documents": { section: "RAG System", page: "Documents" },
    "#embeddings": { section: "RAG System", page: "Embeddings" },
    "#query-stats": { section: "RAG System", page: "Query Stats" },
    "#postgres": { section: "Database", page: "PostgreSQL" },
    "#qdrant": { section: "Database", page: "Qdrant" },
    "#migrations": { section: "Database", page: "Migrations" },
    "#api-costs": { section: "Billing", page: "API Costs" },
    "#usage-tracking": { section: "Billing", page: "Usage Tracking" },
    "#projections": { section: "Billing", page: "Projections" },
    "#alerts": { section: "Billing", page: "Usage Alerts" },
    "#app-logs": { section: "Logs", page: "Application Logs" },
    "#audit": { section: "Logs", page: "Audit Trail" },
    "#general": { section: "Settings", page: "General" },
    "#api-keys": { section: "Settings", page: "API Keys" },
    "#integrations": { section: "Settings", page: "Integrations" },
    "#branding": { section: "Settings", page: "Branding" },
  }
  return routes[hash] || { section: "Dashboard", page: "Overview" }
}

function App() {
  const hash = useHashRoute()
  const { section, page } = getPageTitle(hash)

  return (
    <SidebarProvider>
      <AppSidebar user={SYSTEM_ADMIN} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">{section}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{page}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <PageContent hash={hash} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function PageContent({ hash }: { hash: string }) {
  switch (hash) {
    // Dashboard
    case "#overview":
    case "#dashboard":
      return <DashboardOverview />

    // System Health
    case "#services":
    case "#health":
      return <SystemHealth />

    // Tenants
    case "#families":
    case "#tenants":
    case "#create-family":
    case "#usage":
      return <TenantList />

    // Windmill
    case "#jobs":
    case "#windmill":
    case "#scripts":
    case "#flows":
    case "#schedules":
      return <JobsList />

    // Billing
    case "#api-costs":
    case "#billing":
      return <APICosts />

    case "#usage-tracking":
      return <UsageTracking />

    case "#projections":
      return <CostProjectionsPage />

    case "#alerts":
      return <UsageAlerts />

    // Logs
    case "#app-logs":
    case "#logs":
    case "#audit":
      return <ActivityLog />

    // Settings
    case "#general":
    case "#settings":
    case "#api-keys":
    case "#integrations":
      return <SystemSettings />

    case "#branding":
      return <BrandingSettings />

    // RAG System
    case "#documents":
    case "#rag":
      return <DocumentsList />

    case "#embeddings":
      return <EmbeddingsStats />

    case "#query-stats":
      return <QueryStatsPage />

    // Database
    case "#postgres":
    case "#qdrant":
    case "#migrations":
    case "#database":
      return <DatabaseStatsPage />

    case "#activity":
      return <ActivityLog />

    case "#api-perf":
    case "#errors":
      return <SystemHealth />

    default:
      return <ComingSoon title="Page Not Found" description="This page doesn't exist yet." />
  }
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export default App

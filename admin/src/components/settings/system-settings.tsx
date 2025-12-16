import { useState, useEffect } from "react"
import {
  Save,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

// Map URL hash to tab value
function getTabFromHash(): string {
  const hash = window.location.hash
  if (hash === "#api-keys") return "api-keys"
  if (hash === "#general") return "general"
  if (hash === "#integrations") return "integrations"
  // #settings maps to general (the first tab for settings)
  return "api-keys" // default
}

interface APIKeyConfig {
  name: string
  key: string
  masked: string
  status: "valid" | "invalid" | "unknown"
  lastValidated?: string
}

const initialApiKeys: APIKeyConfig[] = [
  {
    name: "Groq API Key",
    key: "",
    masked: "gsk_****************************XYZ",
    status: "valid",
    lastValidated: "2025-12-06T10:00:00Z",
  },
  {
    name: "Cohere API Key",
    key: "",
    masked: "****************************abc",
    status: "valid",
    lastValidated: "2025-12-06T10:00:00Z",
  },
  {
    name: "Windmill Token",
    key: "",
    masked: "t8u4****************************yi",
    status: "valid",
    lastValidated: "2025-12-06T10:00:00Z",
  },
  {
    name: "Supabase Anon Key",
    key: "",
    masked: "eyJ****************************...",
    status: "valid",
    lastValidated: "2025-12-06T10:00:00Z",
  },
]

function APIKeyField({
  config,
  onUpdate,
}: {
  config: APIKeyConfig
  onUpdate: (key: string) => void
}) {
  const [showKey, setShowKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newKey, setNewKey] = useState("")

  const handleCopy = () => {
    navigator.clipboard.writeText(config.masked)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    if (newKey) {
      onUpdate(newKey)
    }
    setEditing(false)
    setNewKey("")
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{config.name}</Label>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs ${
              config.status === "valid"
                ? "text-green-600"
                : config.status === "invalid"
                  ? "text-red-600"
                  : "text-muted-foreground"
            }`}
          >
            {config.status === "valid" ? "Valid" : config.status === "invalid" ? "Invalid" : "Unknown"}
          </span>
        </div>
      </div>
      {editing ? (
        <div className="flex gap-2">
          <Input
            type="password"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Enter new API key..."
            className="font-mono text-sm"
          />
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            type={showKey ? "text" : "password"}
            value={config.masked}
            readOnly
            className="font-mono text-sm"
          />
          <Button size="icon" variant="outline" onClick={() => setShowKey(!showKey)}>
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="outline" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Update
          </Button>
        </div>
      )}
    </div>
  )
}

export function SystemSettings() {
  const [apiKeys, setApiKeys] = useState(initialApiKeys)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(getTabFromHash)

  // Update tab when URL hash changes
  useEffect(() => {
    const handleHashChange = () => setActiveTab(getTabFromHash())
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  // System settings state - load from localStorage if available
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('archevi-admin-system-settings')
    const defaults = {
      maintenanceMode: false,
      debugLogging: false,
      rateLimitEnabled: true,
      rateLimitPerMinute: 30,
      maxDocumentsPerTenant: 1000,
      maxFileSizeMB: 50,
      allowedFileTypes: "pdf,doc,docx,txt,md,jpg,png",
      systemAdminEmail: "rhudson@archevi.com",
      smtpConfigured: false,
    }
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
  })
  const [saved, setSaved] = useState(false)

  const handleApiKeyUpdate = (index: number, key: string) => {
    const updated = [...apiKeys]
    updated[index] = { ...updated[index], key, status: "unknown" }
    setApiKeys(updated)
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    // Save to localStorage (in production, this would also save to backend)
    localStorage.setItem('archevi-admin-system-settings', JSON.stringify(settings))
    await new Promise((resolve) => setTimeout(resolve, 500)) // Brief delay for UX
    setIsSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000) // Reset saved state after 2s
  }

  const handleValidateKeys = async () => {
    // TODO: Validate API keys against their respective services
    console.log("Validating API keys...")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and API integrations.
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving || saved}>
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saved ? "Saved" : "Save Changes"}
        </Button>
      </div>

      {settings.maintenanceMode && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Maintenance Mode Active</AlertTitle>
          <AlertDescription>
            The system is currently in maintenance mode. Users cannot access the application.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for external services. Keys are stored securely and never exposed in full.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {apiKeys.map((config, index) => (
                <APIKeyField
                  key={config.name}
                  config={config}
                  onUpdate={(key) => handleApiKeyUpdate(index, key)}
                />
              ))}
              <div className="pt-4 border-t">
                <Button variant="outline" onClick={handleValidateKeys}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Validate All Keys
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Core system configuration options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Disable access for all users except system admins.
                  </p>
                </div>
                <Switch
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, maintenanceMode: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable verbose logging for troubleshooting.
                  </p>
                </div>
                <Switch
                  checked={settings.debugLogging}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, debugLogging: checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>System Admin Email</Label>
                <Input
                  value={settings.systemAdminEmail}
                  onChange={(e) =>
                    setSettings({ ...settings, systemAdminEmail: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Only this email can access the admin dashboard.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Allowed File Types</Label>
                <Textarea
                  value={settings.allowedFileTypes}
                  onChange={(e) =>
                    setSettings({ ...settings, allowedFileTypes: e.target.value })
                  }
                  placeholder="pdf,doc,docx,txt..."
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of allowed file extensions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limits & Quotas</CardTitle>
              <CardDescription>
                Configure rate limiting and resource quotas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable per-tenant API rate limiting.
                  </p>
                </div>
                <Switch
                  checked={settings.rateLimitEnabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, rateLimitEnabled: checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rate Limit (requests/minute)</Label>
                <Input
                  type="number"
                  value={settings.rateLimitPerMinute}
                  onChange={(e) =>
                    setSettings({ ...settings, rateLimitPerMinute: parseInt(e.target.value) || 30 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max Documents per Tenant</Label>
                <Input
                  type="number"
                  value={settings.maxDocumentsPerTenant}
                  onChange={(e) =>
                    setSettings({ ...settings, maxDocumentsPerTenant: parseInt(e.target.value) || 1000 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max File Size (MB)</Label>
                <Input
                  type="number"
                  value={settings.maxFileSizeMB}
                  onChange={(e) =>
                    setSettings({ ...settings, maxFileSizeMB: parseInt(e.target.value) || 50 })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>External Integrations</CardTitle>
              <CardDescription>
                Quick links and status of integrated services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  name: "Windmill",
                  description: "Background job orchestration",
                  url: "http://localhost",
                  status: "connected",
                },
                {
                  name: "PostgreSQL",
                  description: "Primary database",
                  url: undefined,
                  status: "connected",
                },
                {
                  name: "Qdrant",
                  description: "Vector database for embeddings",
                  url: "http://localhost:6333/dashboard",
                  status: "connected",
                },
                {
                  name: "Supabase Storage",
                  description: "File storage for documents",
                  url: "https://supabase.com/dashboard",
                  status: "connected",
                },
                {
                  name: "Groq",
                  description: "LLM inference API",
                  url: "https://console.groq.com",
                  status: "connected",
                },
                {
                  name: "Cohere",
                  description: "Embeddings and reranking API",
                  url: "https://dashboard.cohere.com",
                  status: "connected",
                },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div>
                    <h4 className="font-medium">{integration.name}</h4>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Connected
                    </span>
                    {integration.url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={integration.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

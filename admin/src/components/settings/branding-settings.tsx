import { useState, useEffect, useCallback } from "react"
import {
  Save,
  RefreshCw,
  Palette,
  Image,
  Type,
  Layout,
  Eye,
  RotateCcw,
  Check,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTheme } from "@/components/theme-provider"
import { windmillAdmin, type BrandingConfig, type ThemePreset, type Tenant } from "@/api/windmill"
import { DEFAULT_BRANDING } from "@/lib/theme-config"

// Color input component with preview
function ColorInput({
  label,
  value,
  onChange,
  description,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  description?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div
          className="w-10 h-10 rounded-md border cursor-pointer flex-shrink-0"
          style={{ backgroundColor: value }}
          onClick={() => {
            const input = document.createElement("input")
            input.type = "color"
            input.value = value
            input.addEventListener("change", (e) => {
              onChange((e.target as HTMLInputElement).value)
            })
            input.click()
          }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#3b82f6"
          className="font-mono"
        />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}

// Theme preset card
function PresetCard({
  preset,
  selected,
  onSelect,
}: {
  preset: ThemePreset
  selected: boolean
  onSelect: () => void
}) {
  return (
    <div
      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
      }`}
      onClick={onSelect}
    >
      {selected && (
        <div className="absolute top-2 right-2">
          <Check className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className="flex gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full border"
          style={{ backgroundColor: preset.primary_color }}
        />
        <div
          className="w-8 h-8 rounded-full border"
          style={{ backgroundColor: preset.accent_color || preset.primary_color }}
        />
        <div
          className="w-8 h-8 rounded-full border"
          style={{ backgroundColor: preset.secondary_color || "#64748b" }}
        />
      </div>
      <h4 className="font-medium text-sm">{preset.name}</h4>
      {preset.description && (
        <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
      )}
    </div>
  )
}

export function BrandingSettings() {
  const { branding, setBranding, resetBranding } = useTheme()
  const [localBranding, setLocalBranding] = useState<BrandingConfig>(branding)
  const [presets, setPresets] = useState<ThemePreset[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>("system")
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Load initial data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [presetsResult, tenantsResult] = await Promise.all([
        windmillAdmin.listThemePresets(),
        windmillAdmin.listTenants(),
      ])
      setPresets(presetsResult.presets)
      setTenants(tenantsResult)
    } catch (err) {
      console.error("Failed to load branding data:", err)
      setError(err instanceof Error ? err.message : "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Load branding for selected tenant (only updates local state, not global)
  const loadTenantBranding = useCallback(async () => {
    if (selectedTenant === "system") {
      setLocalBranding(DEFAULT_BRANDING)
      // Don't apply to global theme - just load for editing
      return
    }

    try {
      const brandingResult = await windmillAdmin.getTenantBranding(selectedTenant)
      setLocalBranding(brandingResult)
      // Don't apply to global theme - just load for editing
    } catch (err) {
      console.error("Failed to load tenant branding:", err)
      setError(err instanceof Error ? err.message : "Failed to load branding")
    }
  }, [selectedTenant])

  useEffect(() => {
    loadTenantBranding()
  }, [loadTenantBranding])

  // Update local state and track changes
  const updateBranding = (key: keyof BrandingConfig, value: unknown) => {
    setLocalBranding((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
    setSelectedPresetId(null) // Clear preset selection when manually editing
  }

  // Preview changes (apply to ThemeProvider without saving)
  const handlePreview = () => {
    setBranding(localBranding)
    setSuccess("Preview applied. Save to make permanent.")
    setTimeout(() => setSuccess(null), 3000)
  }

  // Apply a preset (updates local state only - use Preview to see changes)
  const handleApplyPreset = (preset: ThemePreset) => {
    setSelectedPresetId(preset.id)
    const updated: BrandingConfig = {
      ...localBranding,
      primary_color: preset.primary_color,
      primary_foreground: preset.primary_foreground,
      secondary_color: preset.secondary_color || localBranding.secondary_color,
      accent_color: preset.accent_color || localBranding.accent_color,
      background_light: preset.background_light || localBranding.background_light,
      background_dark: preset.background_dark || localBranding.background_dark,
    }
    setLocalBranding(updated)
    // Don't apply globally - user must click Preview
    setHasChanges(true)
  }

  // Save changes
  const handleSave = async () => {
    if (selectedTenant === "system") {
      setError("System branding can only be changed in the database directly")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const result = await windmillAdmin.updateTenantBranding(selectedTenant, localBranding)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(result.message || "Branding saved successfully!")
        setHasChanges(false)
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save branding")
    } finally {
      setIsSaving(false)
    }
  }

  // Reset to defaults
  const handleReset = () => {
    setLocalBranding(DEFAULT_BRANDING)
    resetBranding()
    setSelectedPresetId(null)
    setHasChanges(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Branding & Theming</h2>
          <p className="text-muted-foreground">
            Customize colors, logos, and styling for each tenant.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={!hasChanges}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving || selectedTenant === "system"}>
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Tenant selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Select Tenant</CardTitle>
          <CardDescription>Choose which tenant's branding to customize</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a tenant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System Default</SelectItem>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTenant === "system" && (
            <p className="text-xs text-muted-foreground mt-2">
              System default branding is read-only. Select a tenant to customize.
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="presets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="presets">
            <Palette className="h-4 w-4 mr-2" />
            Presets
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="identity">
            <Image className="h-4 w-4 mr-2" />
            Identity
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-4 w-4 mr-2" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Layout className="h-4 w-4 mr-2" />
            Layout
          </TabsTrigger>
        </TabsList>

        {/* Presets Tab */}
        <TabsContent value="presets">
          <Card>
            <CardHeader>
              <CardTitle>Theme Presets</CardTitle>
              <CardDescription>
                Quick start with pre-defined color schemes. Click to apply.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {presets.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    selected={selectedPresetId === preset.id}
                    onSelect={() => handleApplyPreset(preset)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>
                Customize the color palette for this tenant's experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <ColorInput
                  label="Primary Color"
                  value={localBranding.primary_color}
                  onChange={(v) => updateBranding("primary_color", v)}
                  description="Main brand color used for buttons, links, and accents"
                />
                <ColorInput
                  label="Primary Foreground"
                  value={localBranding.primary_foreground}
                  onChange={(v) => updateBranding("primary_foreground", v)}
                  description="Text color on primary backgrounds"
                />
                <ColorInput
                  label="Secondary Color"
                  value={localBranding.secondary_color}
                  onChange={(v) => updateBranding("secondary_color", v)}
                  description="Secondary UI elements and subtle backgrounds"
                />
                <ColorInput
                  label="Accent Color"
                  value={localBranding.accent_color}
                  onChange={(v) => updateBranding("accent_color", v)}
                  description="Highlights and interactive elements"
                />
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Background Colors</h4>
                <div className="grid gap-6 sm:grid-cols-2">
                  <ColorInput
                    label="Light Mode Background"
                    value={localBranding.background_light}
                    onChange={(v) => updateBranding("background_light", v)}
                  />
                  <ColorInput
                    label="Dark Mode Background"
                    value={localBranding.background_dark}
                    onChange={(v) => updateBranding("background_dark", v)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-4">Status Colors</h4>
                <div className="grid gap-6 sm:grid-cols-3">
                  <ColorInput
                    label="Success"
                    value={localBranding.success_color}
                    onChange={(v) => updateBranding("success_color", v)}
                  />
                  <ColorInput
                    label="Warning"
                    value={localBranding.warning_color}
                    onChange={(v) => updateBranding("warning_color", v)}
                  />
                  <ColorInput
                    label="Error"
                    value={localBranding.error_color}
                    onChange={(v) => updateBranding("error_color", v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Identity Tab */}
        <TabsContent value="identity">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>
                Logo, name, and visual identity elements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Brand Name</Label>
                <Input
                  value={localBranding.brand_name}
                  onChange={(e) => updateBranding("brand_name", e.target.value)}
                  placeholder="Family Second Brain"
                />
                <p className="text-xs text-muted-foreground">
                  Displayed in the header and browser tab
                </p>
              </div>

              <div className="space-y-2">
                <Label>Logo URL (Light Mode)</Label>
                <Input
                  value={localBranding.logo_url || ""}
                  onChange={(e) => updateBranding("logo_url", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="space-y-2">
                <Label>Logo URL (Dark Mode)</Label>
                <Input
                  value={localBranding.logo_dark_url || ""}
                  onChange={(e) => updateBranding("logo_dark_url", e.target.value)}
                  placeholder="https://example.com/logo-dark.png"
                />
              </div>

              <div className="space-y-2">
                <Label>Favicon URL</Label>
                <Input
                  value={localBranding.favicon_url || ""}
                  onChange={(e) => updateBranding("favicon_url", e.target.value)}
                  placeholder="https://example.com/favicon.ico"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography">
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>
                Font families and text styling options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Body Font Family</Label>
                <Input
                  value={localBranding.font_family || ""}
                  onChange={(e) => updateBranding("font_family", e.target.value)}
                  placeholder="Inter, system-ui, sans-serif"
                />
                <p className="text-xs text-muted-foreground">
                  CSS font-family value for body text
                </p>
              </div>

              <div className="space-y-2">
                <Label>Heading Font Family</Label>
                <Input
                  value={localBranding.font_heading || ""}
                  onChange={(e) => updateBranding("font_heading", e.target.value)}
                  placeholder="Playfair Display, serif"
                />
                <p className="text-xs text-muted-foreground">
                  CSS font-family value for headings (optional)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle>Layout & UI</CardTitle>
              <CardDescription>
                Customize UI appearance and behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <Input
                  value={localBranding.border_radius}
                  onChange={(e) => updateBranding("border_radius", e.target.value)}
                  placeholder="0.5rem"
                />
                <p className="text-xs text-muted-foreground">
                  CSS value for rounded corners (e.g., 0.5rem, 8px)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Sidebar Style</Label>
                <Select
                  value={localBranding.sidebar_style}
                  onValueChange={(v) => updateBranding("sidebar_style", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label>Show "Powered by" Footer</Label>
                  <p className="text-sm text-muted-foreground">
                    Display attribution in the footer
                  </p>
                </div>
                <Switch
                  checked={localBranding.show_powered_by}
                  onCheckedChange={(v) => updateBranding("show_powered_by", v)}
                />
              </div>

              <div className="space-y-2">
                <Label>Custom Footer Text</Label>
                <Input
                  value={localBranding.custom_footer_text || ""}
                  onChange={(e) => updateBranding("custom_footer_text", e.target.value)}
                  placeholder="2025 Your Company"
                />
              </div>

              <div className="space-y-2">
                <Label>Custom CSS</Label>
                <Textarea
                  value={localBranding.custom_css || ""}
                  onChange={(e) => updateBranding("custom_css", e.target.value)}
                  placeholder=".custom-class { color: red; }"
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Advanced: Add custom CSS rules (use with caution)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

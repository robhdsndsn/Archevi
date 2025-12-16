import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { type BrandingConfig, applyBranding, clearBranding, DEFAULT_BRANDING } from "@/lib/theme-config"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  initialBranding?: BrandingConfig
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  branding: BrandingConfig
  setBranding: (branding: BrandingConfig) => void
  resetBranding: () => void
  isBrandingActive: boolean
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  branding: DEFAULT_BRANDING,
  setBranding: () => null,
  resetBranding: () => null,
  isBrandingActive: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "fsb-admin-theme",
  initialBranding,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const [branding, setBrandingState] = useState<BrandingConfig>(
    initialBranding || DEFAULT_BRANDING
  )
  // Track if branding has been explicitly set (don't apply on initial render)
  const [isBrandingActive, setIsBrandingActive] = useState(false)
  const isInitialMount = useRef(true)

  // Apply theme class to document
  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  // Apply branding CSS variables ONLY when explicitly set (not on mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (isBrandingActive) {
      applyBranding(branding)
    }
  }, [branding, isBrandingActive])

  const setBranding = useCallback((newBranding: BrandingConfig) => {
    setBrandingState(newBranding)
    setIsBrandingActive(true)
    applyBranding(newBranding)
    // Optionally persist to localStorage for preview purposes
    localStorage.setItem("fsb-admin-branding-preview", JSON.stringify(newBranding))
  }, [])

  const resetBranding = useCallback(() => {
    clearBranding()
    setBrandingState(DEFAULT_BRANDING)
    setIsBrandingActive(false)
    localStorage.removeItem("fsb-admin-branding-preview")
  }, [])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    branding,
    setBranding,
    resetBranding,
    isBrandingActive,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}

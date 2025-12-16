/**
 * Theme Configuration Types and Utilities
 * Shared between admin dashboard and user-facing frontend
 */

// Brand configuration interface
export interface BrandingConfig {
  // Identity
  brand_name: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;

  // Core colors (hex values)
  primary_color: string;
  primary_foreground: string;
  secondary_color: string;
  accent_color: string;

  // Background colors
  background_light: string;
  background_dark: string;

  // Status colors
  success_color: string;
  warning_color: string;
  error_color: string;

  // Typography
  font_family?: string;
  font_heading?: string;

  // UI
  border_radius: string;
  sidebar_style: 'default' | 'compact' | 'minimal';

  // Custom CSS
  custom_css?: string;

  // Feature toggles
  show_powered_by: boolean;
  custom_footer_text?: string;
}

// Theme preset interface
export interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  primary_color: string;
  primary_foreground: string;
  secondary_color?: string;
  accent_color?: string;
  background_light?: string;
  background_dark?: string;
  preview_image_url?: string;
  sort_order: number;
}

// Default branding values
export const DEFAULT_BRANDING: BrandingConfig = {
  brand_name: 'Family Second Brain',
  primary_color: '#3b82f6',
  primary_foreground: '#ffffff',
  secondary_color: '#64748b',
  accent_color: '#8b5cf6',
  background_light: '#ffffff',
  background_dark: '#0f172a',
  success_color: '#22c55e',
  warning_color: '#f59e0b',
  error_color: '#ef4444',
  border_radius: '0.5rem',
  sidebar_style: 'default',
  show_powered_by: true,
};

// Convert hex to HSL (for CSS variables)
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert hex to OKLCH (for modern CSS)
export function hexToOklch(hex: string): string {
  // Simplified conversion - for production, use a proper color library
  const hsl = hexToHsl(hex);
  // Approximate OKLCH from HSL (not mathematically accurate but visually close)
  const l = hsl.l / 100;
  const c = (hsl.s / 100) * Math.min(l, 1 - l) * 0.4;
  return `oklch(${(l * 0.9 + 0.05).toFixed(2)} ${c.toFixed(3)} ${hsl.h})`;
}

// Convert branding config to CSS variables
export function brandingToCssVariables(branding: BrandingConfig): Record<string, string> {
  const hslPrimary = hexToHsl(branding.primary_color);
  const hslPrimaryFg = hexToHsl(branding.primary_foreground);
  const hslSecondary = hexToHsl(branding.secondary_color);
  const hslAccent = hexToHsl(branding.accent_color);
  const hslBgLight = hexToHsl(branding.background_light);
  const hslBgDark = hexToHsl(branding.background_dark);
  // Success/warning colors calculated but not exposed to CSS variables yet
  // const hslSuccess = hexToHsl(branding.success_color);
  // const hslWarning = hexToHsl(branding.warning_color);
  const hslError = hexToHsl(branding.error_color);

  return {
    // Primary
    '--primary': `${hslPrimary.h} ${hslPrimary.s}% ${hslPrimary.l}%`,
    '--primary-foreground': `${hslPrimaryFg.h} ${hslPrimaryFg.s}% ${hslPrimaryFg.l}%`,

    // Secondary
    '--secondary': `${hslSecondary.h} ${hslSecondary.s}% ${Math.min(hslSecondary.l + 35, 96)}%`,
    '--secondary-foreground': `${hslSecondary.h} ${hslSecondary.s}% ${hslSecondary.l}%`,

    // Accent
    '--accent': `${hslAccent.h} ${hslAccent.s}% ${Math.min(hslAccent.l + 35, 96)}%`,
    '--accent-foreground': `${hslAccent.h} ${hslAccent.s}% ${hslAccent.l}%`,

    // Destructive (error color)
    '--destructive': `${hslError.h} ${hslError.s}% ${hslError.l}%`,
    '--destructive-foreground': `${hslPrimaryFg.h} ${hslPrimaryFg.s}% ${hslPrimaryFg.l}%`,

    // Background (light mode)
    '--background': `${hslBgLight.h} ${hslBgLight.s}% ${hslBgLight.l}%`,
    '--foreground': `${hslBgDark.h} ${hslBgDark.s}% ${hslBgDark.l}%`,

    // Cards
    '--card': `${hslBgLight.h} ${hslBgLight.s}% ${hslBgLight.l}%`,
    '--card-foreground': `${hslBgDark.h} ${hslBgDark.s}% ${hslBgDark.l}%`,

    // Muted - ensure foreground has enough contrast (max 45% lightness for light mode)
    '--muted': `${hslSecondary.h} ${Math.max(hslSecondary.s - 20, 0)}% ${Math.min(hslSecondary.l + 40, 96)}%`,
    '--muted-foreground': `${hslSecondary.h} ${Math.max(hslSecondary.s - 10, 0)}% ${Math.min(hslSecondary.l, 45)}%`,

    // Border/Input
    '--border': `${hslSecondary.h} ${Math.max(hslSecondary.s - 20, 0)}% ${Math.min(hslSecondary.l + 30, 91)}%`,
    '--input': `${hslSecondary.h} ${Math.max(hslSecondary.s - 20, 0)}% ${Math.min(hslSecondary.l + 30, 91)}%`,
    '--ring': `${hslPrimary.h} ${hslPrimary.s}% ${hslPrimary.l}%`,

    // Radius
    '--radius': branding.border_radius,

    // Sidebar
    '--sidebar-background': `${hslBgLight.h} ${hslBgLight.s}% ${hslBgLight.l}%`,
    '--sidebar-foreground': `${hslBgDark.h} ${hslBgDark.s}% ${hslBgDark.l}%`,
    '--sidebar-primary': `${hslPrimary.h} ${hslPrimary.s}% ${hslPrimary.l}%`,
    '--sidebar-primary-foreground': `${hslPrimaryFg.h} ${hslPrimaryFg.s}% ${hslPrimaryFg.l}%`,
    '--sidebar-accent': `${hslAccent.h} ${hslAccent.s}% ${Math.min(hslAccent.l + 35, 96)}%`,
    '--sidebar-accent-foreground': `${hslAccent.h} ${hslAccent.s}% ${hslAccent.l}%`,
    '--sidebar-border': `${hslSecondary.h} ${Math.max(hslSecondary.s - 20, 0)}% ${Math.min(hslSecondary.l + 30, 91)}%`,
    '--sidebar-ring': `${hslPrimary.h} ${hslPrimary.s}% ${hslPrimary.l}%`,
  };
}

// Generate dark mode CSS variables from branding
export function brandingToDarkCssVariables(branding: BrandingConfig): Record<string, string> {
  const hslPrimary = hexToHsl(branding.primary_color);
  const hslPrimaryFg = hexToHsl(branding.primary_foreground);
  const hslSecondary = hexToHsl(branding.secondary_color);
  const hslAccent = hexToHsl(branding.accent_color);
  const hslBgDark = hexToHsl(branding.background_dark);
  const hslError = hexToHsl(branding.error_color);

  return {
    // Background (dark mode)
    '--background': `${hslBgDark.h} ${hslBgDark.s}% ${hslBgDark.l}%`,
    '--foreground': `${hslPrimaryFg.h} ${hslPrimaryFg.s}% ${hslPrimaryFg.l - 2}%`,

    // Primary (inverted for dark)
    '--primary': `${hslPrimaryFg.h} ${Math.max(hslPrimaryFg.s - 10, 0)}% ${hslPrimaryFg.l - 2}%`,
    '--primary-foreground': `${hslPrimary.h} ${hslPrimary.s}% ${Math.max(hslPrimary.l - 35, 11)}%`,

    // Secondary
    '--secondary': `${hslSecondary.h} ${Math.max(hslSecondary.s - 10, 0)}% ${Math.max(hslSecondary.l - 30, 17)}%`,
    '--secondary-foreground': `${hslPrimaryFg.h} ${hslPrimaryFg.s}% ${hslPrimaryFg.l - 2}%`,

    // Muted - ensure foreground has enough contrast (min 55% lightness for dark mode)
    '--muted': `${hslSecondary.h} ${Math.max(hslSecondary.s - 10, 0)}% ${Math.max(hslSecondary.l - 30, 17)}%`,
    '--muted-foreground': `${hslSecondary.h} ${Math.max(hslSecondary.s - 10, 0)}% ${Math.max(hslSecondary.l + 18, 55)}%`,

    // Accent
    '--accent': `${hslAccent.h} ${Math.max(hslAccent.s - 10, 0)}% ${Math.max(hslAccent.l - 30, 17)}%`,
    '--accent-foreground': `${hslPrimaryFg.h} ${hslPrimaryFg.s}% ${hslPrimaryFg.l - 2}%`,

    // Destructive
    '--destructive': `${hslError.h} ${Math.max(hslError.s - 22, 0)}% ${Math.max(hslError.l - 30, 30)}%`,
    '--destructive-foreground': `${hslPrimaryFg.h} ${hslPrimaryFg.s}% ${hslPrimaryFg.l - 2}%`,

    // Border/Input
    '--border': `${hslSecondary.h} ${Math.max(hslSecondary.s - 10, 0)}% ${Math.max(hslSecondary.l - 30, 17)}%`,
    '--input': `${hslSecondary.h} ${Math.max(hslSecondary.s - 10, 0)}% ${Math.max(hslSecondary.l - 30, 17)}%`,
    '--ring': `${hslSecondary.h} ${Math.max(hslSecondary.s - 6, 0)}% ${hslSecondary.l + 37}%`,

    // Cards
    '--card': `${hslBgDark.h} ${hslBgDark.s}% ${hslBgDark.l}%`,
    '--card-foreground': `${hslPrimaryFg.h} ${hslPrimaryFg.s}% ${hslPrimaryFg.l - 2}%`,

    // Sidebar
    '--sidebar-background': `${hslBgDark.h} ${hslBgDark.s}% ${hslBgDark.l}%`,
    '--sidebar-foreground': `${hslPrimaryFg.h} ${hslPrimaryFg.s}% ${hslPrimaryFg.l - 2}%`,
    '--sidebar-primary': `${hslPrimaryFg.h} ${hslPrimaryFg.s}% ${hslPrimaryFg.l - 2}%`,
    '--sidebar-primary-foreground': `${hslPrimary.h} ${hslPrimary.s}% ${Math.max(hslPrimary.l - 35, 11)}%`,
    '--sidebar-accent': `${hslAccent.h} ${Math.max(hslAccent.s - 10, 0)}% ${Math.max(hslAccent.l - 30, 17)}%`,
    '--sidebar-accent-foreground': `${hslPrimaryFg.h} ${hslPrimaryFg.s}% ${hslPrimaryFg.l - 2}%`,
    '--sidebar-border': `${hslSecondary.h} ${Math.max(hslSecondary.s - 10, 0)}% ${Math.max(hslSecondary.l - 30, 17)}%`,
    '--sidebar-ring': `${hslSecondary.h} ${Math.max(hslSecondary.s - 6, 0)}% ${hslSecondary.l + 37}%`,
  };
}

// Apply branding to the document
export function applyBranding(branding: BrandingConfig): void {
  const root = document.documentElement;

  // Apply light mode variables to :root
  const lightVars = brandingToCssVariables(branding);
  Object.entries(lightVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Apply dark mode variables via a style element
  const darkVars = brandingToDarkCssVariables(branding);
  let darkStyleEl = document.getElementById('dynamic-dark-theme');
  if (!darkStyleEl) {
    darkStyleEl = document.createElement('style');
    darkStyleEl.id = 'dynamic-dark-theme';
    document.head.appendChild(darkStyleEl);
  }

  const darkCss = Object.entries(darkVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  darkStyleEl.textContent = `.dark {\n${darkCss}\n}`;

  // Apply custom font if specified
  if (branding.font_family) {
    root.style.setProperty('--font-sans', branding.font_family);
  }

  // Apply custom CSS if specified
  if (branding.custom_css) {
    let customStyleEl = document.getElementById('dynamic-custom-css');
    if (!customStyleEl) {
      customStyleEl = document.createElement('style');
      customStyleEl.id = 'dynamic-custom-css';
      document.head.appendChild(customStyleEl);
    }
    customStyleEl.textContent = branding.custom_css;
  }

  // Update favicon if specified
  if (branding.favicon_url) {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = branding.favicon_url;
    }
  }
}

// Clear dynamic branding
export function clearBranding(): void {
  const root = document.documentElement;

  // Remove custom properties
  const lightVars = brandingToCssVariables(DEFAULT_BRANDING);
  Object.keys(lightVars).forEach((key) => {
    root.style.removeProperty(key);
  });

  // Remove dynamic style elements
  document.getElementById('dynamic-dark-theme')?.remove();
  document.getElementById('dynamic-custom-css')?.remove();
}

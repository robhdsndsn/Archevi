-- Migration 006: Tenant Branding & Theming
-- Adds customizable branding per tenant for white-label support
-- Includes colors, logos, and UI customization options

-- ============================================
-- TENANT BRANDING TABLE
-- ============================================

-- Tenant branding configuration
CREATE TABLE tenant_branding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Brand Identity
    brand_name TEXT,                              -- Override display name (e.g., "Smith Family Hub")
    logo_url TEXT,                                -- URL to logo image
    logo_dark_url TEXT,                           -- Logo for dark mode
    favicon_url TEXT,                             -- Favicon URL

    -- Color Palette (stored as hex values)
    primary_color TEXT DEFAULT '#3b82f6',         -- Primary brand color (blue)
    primary_foreground TEXT DEFAULT '#ffffff',    -- Text on primary color
    secondary_color TEXT DEFAULT '#64748b',       -- Secondary color
    accent_color TEXT DEFAULT '#8b5cf6',          -- Accent/highlight color

    -- Background colors
    background_light TEXT DEFAULT '#ffffff',      -- Light mode background
    background_dark TEXT DEFAULT '#0f172a',       -- Dark mode background

    -- Additional UI colors
    success_color TEXT DEFAULT '#22c55e',         -- Success/positive actions
    warning_color TEXT DEFAULT '#f59e0b',         -- Warning states
    error_color TEXT DEFAULT '#ef4444',           -- Error/destructive actions

    -- Typography
    font_family TEXT,                             -- Custom font family (CSS value)
    font_heading TEXT,                            -- Heading font family

    -- UI Customization
    border_radius TEXT DEFAULT '0.5rem',          -- Global border radius
    sidebar_style TEXT DEFAULT 'default' CHECK (sidebar_style IN ('default', 'compact', 'minimal')),

    -- Custom CSS (advanced users)
    custom_css TEXT,                              -- Additional CSS overrides

    -- Feature toggles
    show_powered_by BOOLEAN DEFAULT true,         -- Show "Powered by Family Second Brain"
    custom_footer_text TEXT,                      -- Custom footer message

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT unique_tenant_branding UNIQUE (tenant_id)
);

-- Index for fast lookups
CREATE INDEX idx_tenant_branding_tenant ON tenant_branding(tenant_id);

-- ============================================
-- SYSTEM-LEVEL BRANDING (DEFAULT THEME)
-- ============================================

-- System branding for non-tenant pages (login, admin, etc.)
CREATE TABLE system_branding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,                     -- 'default', 'admin', etc.

    -- Same structure as tenant_branding
    brand_name TEXT DEFAULT 'Family Second Brain',
    logo_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,

    primary_color TEXT DEFAULT '#3b82f6',
    primary_foreground TEXT DEFAULT '#ffffff',
    secondary_color TEXT DEFAULT '#64748b',
    accent_color TEXT DEFAULT '#8b5cf6',

    background_light TEXT DEFAULT '#ffffff',
    background_dark TEXT DEFAULT '#0f172a',

    success_color TEXT DEFAULT '#22c55e',
    warning_color TEXT DEFAULT '#f59e0b',
    error_color TEXT DEFAULT '#ef4444',

    font_family TEXT,
    font_heading TEXT,
    border_radius TEXT DEFAULT '0.5rem',

    custom_css TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default system branding
INSERT INTO system_branding (key, brand_name) VALUES
    ('default', 'Family Second Brain'),
    ('admin', 'FSB Admin');

-- ============================================
-- THEME PRESETS TABLE
-- ============================================

-- Pre-defined theme presets users can choose from
CREATE TABLE theme_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                           -- "Ocean Blue", "Forest Green", etc.
    description TEXT,

    -- Color values
    primary_color TEXT NOT NULL,
    primary_foreground TEXT NOT NULL,
    secondary_color TEXT,
    accent_color TEXT,
    background_light TEXT,
    background_dark TEXT,

    -- Preview
    preview_image_url TEXT,

    -- Ordering & visibility
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert some default theme presets
INSERT INTO theme_presets (name, description, primary_color, primary_foreground, secondary_color, accent_color, background_light, background_dark, sort_order) VALUES
    ('Ocean Blue', 'Calm and professional blue theme', '#3b82f6', '#ffffff', '#64748b', '#06b6d4', '#ffffff', '#0f172a', 1),
    ('Forest Green', 'Natural and earthy green theme', '#22c55e', '#ffffff', '#64748b', '#10b981', '#ffffff', '#14532d', 2),
    ('Royal Purple', 'Elegant purple accents', '#8b5cf6', '#ffffff', '#64748b', '#a855f7', '#ffffff', '#1e1b4b', 3),
    ('Sunset Orange', 'Warm and inviting orange theme', '#f97316', '#ffffff', '#64748b', '#fb923c', '#ffffff', '#431407', 4),
    ('Rose Pink', 'Soft and friendly pink theme', '#ec4899', '#ffffff', '#64748b', '#f472b6', '#ffffff', '#500724', 5),
    ('Slate Gray', 'Minimal and modern gray theme', '#475569', '#ffffff', '#64748b', '#94a3b8', '#ffffff', '#0f172a', 6);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get effective branding for a tenant (falls back to system default)
CREATE OR REPLACE FUNCTION get_tenant_branding(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_branding JSONB;
    v_default JSONB;
BEGIN
    -- Get system default
    SELECT jsonb_build_object(
        'brand_name', brand_name,
        'logo_url', logo_url,
        'logo_dark_url', logo_dark_url,
        'favicon_url', favicon_url,
        'primary_color', primary_color,
        'primary_foreground', primary_foreground,
        'secondary_color', secondary_color,
        'accent_color', accent_color,
        'background_light', background_light,
        'background_dark', background_dark,
        'success_color', success_color,
        'warning_color', warning_color,
        'error_color', error_color,
        'font_family', font_family,
        'font_heading', font_heading,
        'border_radius', border_radius,
        'custom_css', custom_css
    ) INTO v_default
    FROM system_branding
    WHERE key = 'default';

    -- Get tenant-specific branding
    SELECT jsonb_build_object(
        'brand_name', COALESCE(tb.brand_name, t.name),
        'logo_url', tb.logo_url,
        'logo_dark_url', tb.logo_dark_url,
        'favicon_url', tb.favicon_url,
        'primary_color', tb.primary_color,
        'primary_foreground', tb.primary_foreground,
        'secondary_color', tb.secondary_color,
        'accent_color', tb.accent_color,
        'background_light', tb.background_light,
        'background_dark', tb.background_dark,
        'success_color', tb.success_color,
        'warning_color', tb.warning_color,
        'error_color', tb.error_color,
        'font_family', tb.font_family,
        'font_heading', tb.font_heading,
        'border_radius', tb.border_radius,
        'custom_css', tb.custom_css,
        'show_powered_by', tb.show_powered_by,
        'custom_footer_text', tb.custom_footer_text,
        'sidebar_style', tb.sidebar_style
    ) INTO v_branding
    FROM tenants t
    LEFT JOIN tenant_branding tb ON tb.tenant_id = t.id
    WHERE t.id = p_tenant_id;

    -- Merge tenant branding over default (tenant values override where not null)
    RETURN v_default || COALESCE(v_branding, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql;

-- Function to apply a theme preset to a tenant
CREATE OR REPLACE FUNCTION apply_theme_preset(p_tenant_id UUID, p_preset_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS tenant_branding AS $$
DECLARE
    v_preset theme_presets;
    v_result tenant_branding;
BEGIN
    SELECT * INTO v_preset FROM theme_presets WHERE id = p_preset_id;

    IF v_preset IS NULL THEN
        RAISE EXCEPTION 'Theme preset not found';
    END IF;

    INSERT INTO tenant_branding (
        tenant_id, primary_color, primary_foreground, secondary_color,
        accent_color, background_light, background_dark, updated_by
    ) VALUES (
        p_tenant_id, v_preset.primary_color, v_preset.primary_foreground,
        v_preset.secondary_color, v_preset.accent_color,
        v_preset.background_light, v_preset.background_dark, p_user_id
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
        primary_color = EXCLUDED.primary_color,
        primary_foreground = EXCLUDED.primary_foreground,
        secondary_color = EXCLUDED.secondary_color,
        accent_color = EXCLUDED.accent_color,
        background_light = EXCLUDED.background_light,
        background_dark = EXCLUDED.background_dark,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger for tenant_branding
CREATE TRIGGER update_tenant_branding_timestamp
    BEFORE UPDATE ON tenant_branding
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Update timestamp trigger for system_branding
CREATE TRIGGER update_system_branding_timestamp
    BEFORE UPDATE ON system_branding
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_presets ENABLE ROW LEVEL SECURITY;

-- Tenant branding: owners/admins can manage, members can view
CREATE POLICY tenant_branding_view ON tenant_branding
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tenant_memberships tm
            WHERE tm.tenant_id = tenant_branding.tenant_id
            AND tm.user_id = current_user_id()
            AND tm.status = 'active'
        )
    );

CREATE POLICY tenant_branding_manage ON tenant_branding
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tenant_memberships tm
            WHERE tm.tenant_id = tenant_branding.tenant_id
            AND tm.user_id = current_user_id()
            AND tm.role IN ('owner', 'admin')
            AND tm.status = 'active'
        )
    );

-- System branding: viewable by all, editable by system admins only
CREATE POLICY system_branding_view ON system_branding FOR SELECT USING (true);
-- Note: System branding updates should be done through admin dashboard with proper auth

-- Theme presets: viewable by all
CREATE POLICY theme_presets_view ON theme_presets FOR SELECT USING (is_active = true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE tenant_branding IS 'Per-tenant branding configuration for white-label support';
COMMENT ON TABLE system_branding IS 'System-wide default branding configuration';
COMMENT ON TABLE theme_presets IS 'Pre-defined theme presets users can choose from';
COMMENT ON FUNCTION get_tenant_branding IS 'Returns effective branding for a tenant with system defaults as fallback';
COMMENT ON FUNCTION apply_theme_preset IS 'Applies a theme preset to a tenant branding configuration';

-- Migration: 009_usage_alerts.sql
-- Description: Add usage alerts and notifications system
-- Date: December 2025

-- ============================================
-- USAGE ALERTS
-- ============================================

-- Track usage threshold alerts for tenants
CREATE TABLE IF NOT EXISTS usage_alerts (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Alert configuration
    alert_type TEXT NOT NULL CHECK (alert_type IN (
        'ai_budget_warning',      -- 75% of AI allowance used
        'ai_budget_critical',     -- 90% of AI allowance used
        'ai_budget_exceeded',     -- 100% of AI allowance used
        'storage_warning',        -- 75% of storage used
        'storage_critical',       -- 90% of storage used
        'member_limit_reached',   -- Max members reached
        'rate_limit_warning',     -- Approaching rate limits
        'custom'                  -- Custom threshold alert
    )),

    -- Threshold configuration
    threshold_percent INTEGER,    -- For percentage-based alerts (e.g., 75, 90)
    threshold_value DECIMAL(10,4), -- For absolute value alerts

    -- Alert status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    triggered_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP,

    -- Alert context
    current_value DECIMAL(10,4),   -- Value that triggered the alert
    limit_value DECIMAL(10,4),     -- The limit being approached
    message TEXT,
    metadata JSONB DEFAULT '{}',   -- Additional context

    -- Notification tracking
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP,
    in_app_shown BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_alerts_tenant ON usage_alerts(tenant_id, status, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_type ON usage_alerts(alert_type, status);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_active ON usage_alerts(tenant_id) WHERE status = 'active';

-- ============================================
-- NOTIFICATION PREFERENCES
-- ============================================

-- Per-tenant notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL means tenant-wide default

    -- Alert thresholds (can override defaults)
    ai_budget_warning_percent INTEGER DEFAULT 75,
    ai_budget_critical_percent INTEGER DEFAULT 90,
    storage_warning_percent INTEGER DEFAULT 75,
    storage_critical_percent INTEGER DEFAULT 90,

    -- Notification channels
    email_alerts_enabled BOOLEAN DEFAULT TRUE,
    in_app_alerts_enabled BOOLEAN DEFAULT TRUE,

    -- Alert types to receive
    receive_budget_alerts BOOLEAN DEFAULT TRUE,
    receive_storage_alerts BOOLEAN DEFAULT TRUE,
    receive_member_alerts BOOLEAN DEFAULT TRUE,
    receive_security_alerts BOOLEAN DEFAULT TRUE,

    -- Quiet hours (don't send non-critical emails)
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    quiet_hours_timezone TEXT DEFAULT 'UTC',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_tenant ON notification_preferences(tenant_id);

-- ============================================
-- IN-APP NOTIFICATIONS
-- ============================================

-- Queue of in-app notifications for users
CREATE TABLE IF NOT EXISTS in_app_notifications (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL means all users in tenant

    -- Notification content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'alert',      -- Usage/system alerts
        'info',       -- Informational
        'success',    -- Successful operation
        'warning',    -- Warning
        'error'       -- Error notification
    )),

    -- Related entities
    alert_id INTEGER REFERENCES usage_alerts(id) ON DELETE SET NULL,
    action_url TEXT,              -- URL to navigate to on click
    action_label TEXT,            -- Button text for action

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMP,

    -- Expiry
    expires_at TIMESTAMP,         -- Auto-dismiss after this time

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON in_app_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON in_app_notifications(tenant_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON in_app_notifications(user_id) WHERE NOT is_read AND NOT is_dismissed;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check and create usage alerts for a tenant
CREATE OR REPLACE FUNCTION check_tenant_usage_alerts(p_tenant_id UUID)
RETURNS TABLE (
    alert_type TEXT,
    current_percent DECIMAL,
    threshold_percent INTEGER,
    should_alert BOOLEAN
) AS $$
DECLARE
    v_tenant RECORD;
    v_mtd_cost DECIMAL;
    v_storage_used DECIMAL;
    v_member_count INTEGER;
    v_prefs RECORD;
BEGIN
    -- Get tenant info
    SELECT * INTO v_tenant FROM tenants WHERE id = p_tenant_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Get notification preferences (or defaults)
    SELECT
        COALESCE(np.ai_budget_warning_percent, 75) as ai_warning,
        COALESCE(np.ai_budget_critical_percent, 90) as ai_critical,
        COALESCE(np.storage_warning_percent, 75) as storage_warning,
        COALESCE(np.storage_critical_percent, 90) as storage_critical
    INTO v_prefs
    FROM notification_preferences np
    WHERE np.tenant_id = p_tenant_id AND np.user_id IS NULL
    LIMIT 1;

    IF NOT FOUND THEN
        v_prefs := ROW(75, 90, 75, 90);
    END IF;

    -- Calculate month-to-date AI cost
    SELECT COALESCE(SUM(total_cost_cents)::DECIMAL / 100, 0) INTO v_mtd_cost
    FROM api_usage_daily
    WHERE tenant_id = p_tenant_id
      AND date >= DATE_TRUNC('month', CURRENT_DATE);

    -- Calculate storage used (placeholder - would need storage tracking table)
    -- For now, estimate based on document count
    SELECT COALESCE(COUNT(*) * 0.01, 0) INTO v_storage_used  -- ~10KB per doc estimate
    FROM documents
    WHERE tenant_id = p_tenant_id AND deleted_at IS NULL;

    -- Count members
    SELECT COUNT(*) INTO v_member_count
    FROM tenant_memberships
    WHERE tenant_id = p_tenant_id AND status = 'active';

    -- Check AI budget alerts
    IF v_tenant.ai_allowance_usd > 0 THEN
        -- Critical (90%)
        IF v_mtd_cost >= v_tenant.ai_allowance_usd * v_prefs.ai_critical / 100 THEN
            RETURN QUERY SELECT
                'ai_budget_critical'::TEXT,
                (v_mtd_cost / v_tenant.ai_allowance_usd * 100)::DECIMAL,
                v_prefs.ai_critical,
                TRUE;
        -- Warning (75%)
        ELSIF v_mtd_cost >= v_tenant.ai_allowance_usd * v_prefs.ai_warning / 100 THEN
            RETURN QUERY SELECT
                'ai_budget_warning'::TEXT,
                (v_mtd_cost / v_tenant.ai_allowance_usd * 100)::DECIMAL,
                v_prefs.ai_warning,
                TRUE;
        ELSE
            RETURN QUERY SELECT
                'ai_budget_warning'::TEXT,
                (v_mtd_cost / v_tenant.ai_allowance_usd * 100)::DECIMAL,
                v_prefs.ai_warning,
                FALSE;
        END IF;
    END IF;

    -- Check storage alerts
    IF v_tenant.max_storage_gb > 0 THEN
        -- Critical (90%)
        IF v_storage_used >= v_tenant.max_storage_gb * v_prefs.storage_critical / 100 THEN
            RETURN QUERY SELECT
                'storage_critical'::TEXT,
                (v_storage_used / v_tenant.max_storage_gb * 100)::DECIMAL,
                v_prefs.storage_critical,
                TRUE;
        -- Warning (75%)
        ELSIF v_storage_used >= v_tenant.max_storage_gb * v_prefs.storage_warning / 100 THEN
            RETURN QUERY SELECT
                'storage_warning'::TEXT,
                (v_storage_used / v_tenant.max_storage_gb * 100)::DECIMAL,
                v_prefs.storage_warning,
                TRUE;
        ELSE
            RETURN QUERY SELECT
                'storage_warning'::TEXT,
                (v_storage_used / v_tenant.max_storage_gb * 100)::DECIMAL,
                v_prefs.storage_warning,
                FALSE;
        END IF;
    END IF;

    -- Check member limit
    IF v_member_count >= v_tenant.max_members THEN
        RETURN QUERY SELECT
            'member_limit_reached'::TEXT,
            100::DECIMAL,
            100,
            TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

-- Active alerts summary per tenant
CREATE OR REPLACE VIEW active_alerts_summary AS
SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    COUNT(ua.id) as active_alerts,
    COUNT(ua.id) FILTER (WHERE ua.alert_type LIKE 'ai_budget%') as budget_alerts,
    COUNT(ua.id) FILTER (WHERE ua.alert_type LIKE 'storage%') as storage_alerts,
    MAX(ua.triggered_at) as latest_alert_at
FROM tenants t
LEFT JOIN usage_alerts ua ON t.id = ua.tenant_id AND ua.status = 'active'
GROUP BY t.id, t.name;

-- Unread notifications per user
CREATE OR REPLACE VIEW unread_notifications_count AS
SELECT
    COALESCE(user_id, tenant_id::TEXT::UUID) as user_id,
    tenant_id,
    COUNT(*) as unread_count,
    COUNT(*) FILTER (WHERE notification_type = 'alert') as alert_count,
    MIN(created_at) as oldest_unread_at
FROM in_app_notifications
WHERE NOT is_read AND NOT is_dismissed
  AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY COALESCE(user_id, tenant_id::TEXT::UUID), tenant_id;

-- ============================================
-- DEFAULT NOTIFICATION PREFERENCES
-- ============================================

-- Insert default preferences for existing tenants
INSERT INTO notification_preferences (tenant_id, user_id)
SELECT id, NULL FROM tenants
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- Log this migration
INSERT INTO system_logs (level, category, message, metadata)
VALUES ('info', 'system', 'Applied migration 009_usage_alerts', '{"version": "009"}');

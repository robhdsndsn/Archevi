-- Migration: 008_admin_audit_logs.sql
-- Description: Add admin audit logging for compliance and security
-- Date: December 2025

-- ============================================
-- ADMIN AUDIT LOGS
-- ============================================

-- Dedicated table for admin action audit trail
-- Tracks all administrative operations for compliance, debugging, and security
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id SERIAL PRIMARY KEY,

    -- Who performed the action
    actor_id TEXT,                   -- User ID or email of admin
    actor_email TEXT NOT NULL,       -- Email for display
    actor_type TEXT NOT NULL CHECK (actor_type IN ('admin', 'system', 'api')),

    -- What action was performed
    action TEXT NOT NULL,            -- e.g., 'tenant.update', 'member.remove'
    action_type TEXT NOT NULL CHECK (action_type IN (
        'create', 'read', 'update', 'delete',
        'auth', 'config', 'execute'
    )),

    -- What resource was affected
    resource_type TEXT NOT NULL,     -- e.g., 'tenant', 'member', 'document', 'settings'
    resource_id TEXT,                -- ID of affected resource
    resource_name TEXT,              -- Human-readable name

    -- Target tenant (if applicable)
    tenant_id UUID REFERENCES tenants(id),
    tenant_name TEXT,

    -- Change details
    old_value JSONB,                 -- Previous state (for updates)
    new_value JSONB,                 -- New state (for creates/updates)
    changes JSONB,                   -- Summary of what changed

    -- Context
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    request_id UUID,                 -- For correlating with other logs

    -- Outcome
    success BOOLEAN DEFAULT true,
    error_message TEXT,

    -- Metadata
    metadata JSONB,                  -- Additional context

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_actor ON admin_audit_logs(actor_email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_tenant ON admin_audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action_type ON admin_audit_logs(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_success ON admin_audit_logs(success, created_at DESC);

-- GIN index for JSONB searches
CREATE INDEX IF NOT EXISTS idx_admin_audit_changes ON admin_audit_logs USING GIN (changes);
CREATE INDEX IF NOT EXISTS idx_admin_audit_metadata ON admin_audit_logs USING GIN (metadata);

-- View: Recent admin activity
CREATE OR REPLACE VIEW admin_activity_recent AS
SELECT
    id,
    created_at,
    actor_email,
    actor_type,
    action,
    action_type,
    resource_type,
    resource_name,
    tenant_name,
    success,
    CASE
        WHEN changes IS NOT NULL THEN
            substring(changes::text from 1 for 200)
        ELSE NULL
    END as changes_preview
FROM admin_audit_logs
ORDER BY created_at DESC
LIMIT 100;

-- View: Admin activity summary by day
CREATE OR REPLACE VIEW admin_activity_daily AS
SELECT
    DATE(created_at) as date,
    actor_email,
    action_type,
    COUNT(*) as action_count,
    COUNT(*) FILTER (WHERE success = false) as failed_count
FROM admin_audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), actor_email, action_type
ORDER BY date DESC, actor_email;

-- View: Admin activity by resource type
CREATE OR REPLACE VIEW admin_activity_by_resource AS
SELECT
    resource_type,
    action_type,
    COUNT(*) as total_actions,
    COUNT(*) FILTER (WHERE success = false) as failed_actions,
    COUNT(DISTINCT actor_email) as unique_actors,
    COUNT(DISTINCT tenant_id) as affected_tenants,
    MAX(created_at) as last_action
FROM admin_audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY resource_type, action_type
ORDER BY total_actions DESC;

-- Function to log admin action
CREATE OR REPLACE FUNCTION log_admin_action(
    p_actor_id TEXT,
    p_actor_email TEXT,
    p_actor_type TEXT,
    p_action TEXT,
    p_action_type TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_resource_name TEXT DEFAULT NULL,
    p_tenant_id UUID DEFAULT NULL,
    p_tenant_name TEXT DEFAULT NULL,
    p_old_value JSONB DEFAULT NULL,
    p_new_value JSONB DEFAULT NULL,
    p_changes JSONB DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    log_id INTEGER;
BEGIN
    INSERT INTO admin_audit_logs (
        actor_id, actor_email, actor_type,
        action, action_type,
        resource_type, resource_id, resource_name,
        tenant_id, tenant_name,
        old_value, new_value, changes,
        ip_address, user_agent,
        success, error_message,
        metadata
    ) VALUES (
        p_actor_id, p_actor_email, p_actor_type,
        p_action, p_action_type,
        p_resource_type, p_resource_id, p_resource_name,
        p_tenant_id, p_tenant_name,
        p_old_value, p_new_value, p_changes,
        p_ip_address, p_user_agent,
        p_success, p_error_message,
        p_metadata
    ) RETURNING id INTO log_id;

    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function to remove old audit logs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM admin_audit_logs
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Log this migration
INSERT INTO system_logs (level, category, message, metadata)
VALUES ('info', 'migration', 'Applied migration 008_admin_audit_logs', '{"version": "008"}');

-- Migration 003: Multi-Tenant Schema with Multi-Family Access
-- Enables users to belong to multiple families with different roles
-- Supports proper tenant isolation and provisioning automation

-- ============================================
-- CORE TENANT TABLES
-- ============================================

-- Tenants (Families) - The billing/isolation unit
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,                          -- "The Hudson Family"
    slug TEXT UNIQUE NOT NULL,                   -- "hudson" for hudson.archevi.ca

    -- Subscription & Billing
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'family', 'family_office', 'trial')),
    plan_started_at TIMESTAMP,
    trial_ends_at TIMESTAMP,

    -- AI Configuration (Hybrid Model)
    api_mode TEXT DEFAULT 'managed' CHECK (api_mode IN ('managed', 'byok')),
    cohere_api_key_encrypted BYTEA,              -- Encrypted BYOK key
    ai_allowance_usd DECIMAL(10,4) DEFAULT 3.00, -- Monthly AI allowance

    -- Limits based on plan
    max_members INTEGER DEFAULT 5,
    max_storage_gb INTEGER DEFAULT 10,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'pending')),

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID                              -- User who created the tenant
);

-- Indexes for tenant lookup
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_stripe ON tenants(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_tenants_status ON tenants(status);

-- ============================================
-- USER & MEMBERSHIP TABLES
-- ============================================

-- Users - Global user accounts (can belong to multiple tenants)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT,
    avatar_url TEXT,

    -- Email verification
    email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    email_verification_expires TIMESTAMP,

    -- Password reset
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP,

    -- Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,

    -- Preferences
    default_tenant_id UUID REFERENCES tenants(id),  -- Last used / preferred tenant
    preferences JSONB DEFAULT '{}',                  -- Theme, notifications, etc.

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Indexes for user lookup
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX idx_users_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- Tenant Memberships - Links users to tenants with roles
CREATE TABLE tenant_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Role within this tenant
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),

    -- Invite tracking
    invited_by UUID REFERENCES users(id),
    invite_token TEXT UNIQUE,
    invite_expires TIMESTAMP,
    invite_accepted_at TIMESTAMP,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP,

    -- Ensure unique membership per tenant
    UNIQUE(tenant_id, user_id)
);

-- Indexes for membership lookup
CREATE INDEX idx_memberships_tenant ON tenant_memberships(tenant_id);
CREATE INDEX idx_memberships_user ON tenant_memberships(user_id);
CREATE INDEX idx_memberships_invite ON tenant_memberships(invite_token) WHERE invite_token IS NOT NULL;

-- ============================================
-- TENANT-SCOPED DATA TABLES
-- ============================================

-- Documents - Now tenant-scoped
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Content
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    source_file TEXT,
    file_size_bytes INTEGER,
    mime_type TEXT,

    -- Vector embedding (Cohere Embed v4 = 1024 dimensions)
    embedding vector(1024),
    embedding_model TEXT DEFAULT 'embed-v4.0',

    -- Ownership
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for document search
CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_category ON documents(tenant_id, category);
CREATE INDEX idx_documents_created ON documents(tenant_id, created_at DESC);
CREATE INDEX idx_documents_embedding ON documents USING hnsw (embedding vector_cosine_ops);

-- Conversations - Tenant-scoped chat history
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),

    title TEXT,                                  -- Auto-generated or user-set

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_tenant ON chat_sessions(tenant_id);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(tenant_id, user_id);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,

    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB,                               -- Referenced document IDs and snippets

    -- Model tracking
    model_used TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);

-- ============================================
-- AI USAGE TRACKING (Per Tenant)
-- ============================================

CREATE TABLE ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),

    -- Operation details
    operation TEXT NOT NULL CHECK (operation IN ('embed', 'generate', 'rerank')),
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER DEFAULT 0,

    -- Cost calculation
    cost_usd DECIMAL(10, 6) NOT NULL,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_tenant ON ai_usage(tenant_id, created_at DESC);
CREATE INDEX idx_ai_usage_tenant_month ON ai_usage(tenant_id, DATE_TRUNC('month', created_at));

-- Monthly usage summary for billing
CREATE TABLE monthly_usage_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    month DATE NOT NULL,                         -- First day of month

    -- Token counts
    embed_tokens BIGINT DEFAULT 0,
    generate_input_tokens BIGINT DEFAULT 0,
    generate_output_tokens BIGINT DEFAULT 0,
    rerank_tokens BIGINT DEFAULT 0,

    -- Costs
    total_cost_usd DECIMAL(10, 4) DEFAULT 0,
    included_allowance_usd DECIMAL(10, 4),
    overage_usd DECIMAL(10, 4) DEFAULT 0,

    -- Billing status
    billed BOOLEAN DEFAULT false,
    billed_at TIMESTAMP,
    stripe_invoice_id TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, month)
);

CREATE INDEX idx_monthly_usage_tenant ON monthly_usage_summary(tenant_id, month DESC);

-- ============================================
-- TENANT PROVISIONING
-- ============================================

-- Provisioning queue for async tenant setup
CREATE TABLE provisioning_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),

    -- Provisioning steps
    step TEXT NOT NULL CHECK (step IN (
        'create_tenant',
        'setup_stripe',
        'create_schema',
        'configure_subdomain',
        'send_welcome_email',
        'complete'
    )),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

    -- Error tracking
    attempts INTEGER DEFAULT 0,
    last_error TEXT,

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_provisioning_status ON provisioning_queue(status, created_at);
CREATE INDEX idx_provisioning_tenant ON provisioning_queue(tenant_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has access to tenant
CREATE OR REPLACE FUNCTION user_has_tenant_access(
    p_user_id UUID,
    p_tenant_id UUID,
    p_required_role TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_membership tenant_memberships%ROWTYPE;
BEGIN
    SELECT * INTO v_membership
    FROM tenant_memberships
    WHERE user_id = p_user_id
      AND tenant_id = p_tenant_id
      AND status = 'active';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- If no specific role required, just check membership
    IF p_required_role IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Check role hierarchy: owner > admin > member > viewer
    RETURN CASE v_membership.role
        WHEN 'owner' THEN TRUE
        WHEN 'admin' THEN p_required_role IN ('admin', 'member', 'viewer')
        WHEN 'member' THEN p_required_role IN ('member', 'viewer')
        WHEN 'viewer' THEN p_required_role = 'viewer'
        ELSE FALSE
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's tenants
CREATE OR REPLACE FUNCTION get_user_tenants(p_user_id UUID)
RETURNS TABLE (
    tenant_id UUID,
    tenant_name TEXT,
    tenant_slug TEXT,
    user_role TEXT,
    plan TEXT,
    member_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.name,
        t.slug,
        tm.role,
        t.plan,
        (SELECT COUNT(*) FROM tenant_memberships WHERE tenant_id = t.id AND status = 'active')
    FROM tenants t
    JOIN tenant_memberships tm ON t.id = tm.tenant_id
    WHERE tm.user_id = p_user_id
      AND tm.status = 'active'
      AND t.status = 'active'
    ORDER BY tm.last_active DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Function to provision new tenant
CREATE OR REPLACE FUNCTION provision_tenant(
    p_name TEXT,
    p_slug TEXT,
    p_owner_user_id UUID,
    p_plan TEXT DEFAULT 'trial'
) RETURNS UUID AS $$
DECLARE
    v_tenant_id UUID;
    v_trial_days INTEGER := 14;
BEGIN
    -- Create tenant
    INSERT INTO tenants (name, slug, plan, trial_ends_at, created_by, ai_allowance_usd, max_members, max_storage_gb)
    VALUES (
        p_name,
        p_slug,
        p_plan,
        CASE WHEN p_plan = 'trial' THEN NOW() + (v_trial_days || ' days')::INTERVAL ELSE NULL END,
        p_owner_user_id,
        CASE p_plan
            WHEN 'starter' THEN 3.00
            WHEN 'family' THEN 8.00
            WHEN 'family_office' THEN 999999.00  -- Unlimited
            ELSE 3.00  -- Trial gets starter allowance
        END,
        CASE p_plan
            WHEN 'starter' THEN 5
            WHEN 'family' THEN 999  -- Unlimited
            WHEN 'family_office' THEN 999
            ELSE 5
        END,
        CASE p_plan
            WHEN 'starter' THEN 10
            WHEN 'family' THEN 50
            WHEN 'family_office' THEN 500
            ELSE 10
        END
    )
    RETURNING id INTO v_tenant_id;

    -- Add owner as member
    INSERT INTO tenant_memberships (tenant_id, user_id, role, status, invite_accepted_at)
    VALUES (v_tenant_id, p_owner_user_id, 'owner', 'active', NOW());

    -- Set as user's default tenant if they don't have one
    UPDATE users
    SET default_tenant_id = v_tenant_id
    WHERE id = p_owner_user_id
      AND default_tenant_id IS NULL;

    -- Queue provisioning steps
    INSERT INTO provisioning_queue (tenant_id, step, metadata)
    VALUES
        (v_tenant_id, 'setup_stripe', jsonb_build_object('plan', p_plan)),
        (v_tenant_id, 'configure_subdomain', jsonb_build_object('slug', p_slug)),
        (v_tenant_id, 'send_welcome_email', jsonb_build_object('user_id', p_owner_user_id));

    RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- User's families with summary info
CREATE OR REPLACE VIEW user_families_view AS
SELECT
    u.id as user_id,
    t.id as tenant_id,
    t.name as family_name,
    t.slug,
    tm.role,
    t.plan,
    t.status as tenant_status,
    t.trial_ends_at,
    (SELECT COUNT(*) FROM tenant_memberships WHERE tenant_id = t.id AND status = 'active') as member_count,
    (SELECT COUNT(*) FROM documents WHERE tenant_id = t.id) as document_count,
    tm.last_active
FROM users u
JOIN tenant_memberships tm ON u.id = tm.user_id
JOIN tenants t ON tm.tenant_id = t.id
WHERE tm.status = 'active';

-- Tenant usage overview
CREATE OR REPLACE VIEW tenant_usage_view AS
SELECT
    t.id as tenant_id,
    t.name,
    t.plan,
    t.ai_allowance_usd,
    COALESCE(mus.total_cost_usd, 0) as current_month_cost,
    t.ai_allowance_usd - COALESCE(mus.total_cost_usd, 0) as remaining_allowance,
    (SELECT COUNT(*) FROM documents WHERE tenant_id = t.id) as document_count,
    (SELECT COUNT(*) FROM tenant_memberships WHERE tenant_id = t.id AND status = 'active') as member_count,
    t.max_members,
    t.max_storage_gb
FROM tenants t
LEFT JOIN monthly_usage_summary mus ON t.id = mus.tenant_id
    AND mus.month = DATE_TRUNC('month', CURRENT_DATE);

-- ============================================
-- ROW LEVEL SECURITY (Optional - for direct DB access)
-- ============================================

-- Enable RLS on tenant-scoped tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies would be added based on how authentication is handled
-- For Windmill, we typically pass tenant_id explicitly in queries

-- ============================================
-- MIGRATION HELPER: Migrate from old schema
-- ============================================

-- This would be run once to migrate existing data
-- COMMENTED OUT - Run manually after review

/*
-- Create default tenant for existing data
INSERT INTO tenants (id, name, slug, plan, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Default Family',
    'default',
    'starter',
    'active'
);

-- Migrate existing users
INSERT INTO users (email, name, password_hash, avatar_url, email_verified, default_tenant_id, created_at, updated_at, last_login)
SELECT
    email, name, password_hash, avatar_url, email_verified,
    '00000000-0000-0000-0000-000000000001',
    created_at, updated_at, last_login
FROM family_members;

-- Create memberships for migrated users
INSERT INTO tenant_memberships (tenant_id, user_id, role, status, created_at)
SELECT
    '00000000-0000-0000-0000-000000000001',
    u.id,
    fm.role,
    CASE WHEN fm.is_active THEN 'active' ELSE 'suspended' END,
    fm.created_at
FROM users u
JOIN family_members fm ON u.email = fm.email;

-- Migrate documents
INSERT INTO documents (tenant_id, title, content, category, source_file, embedding, created_at, updated_at)
SELECT
    '00000000-0000-0000-0000-000000000001',
    title, content, category, source_file, embedding, created_at, updated_at
FROM family_documents;
*/

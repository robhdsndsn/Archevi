-- Migration 012: Secure Links for External Document Sharing
-- Allows users to share documents via secure, expiring links
-- Useful for sharing with lawyers, accountants, advisors without adding them as members

-- ============================================
-- SECURE LINKS TABLE
-- ============================================

CREATE TABLE secure_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Document reference
    document_id INTEGER NOT NULL REFERENCES family_documents(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Creator
    created_by UUID NOT NULL REFERENCES users(id),

    -- Link token (used in URL)
    token VARCHAR(64) UNIQUE NOT NULL,

    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Optional password protection
    password_hash VARCHAR(255),  -- bcrypt hash, NULL = no password

    -- Access limits
    max_views INTEGER,           -- NULL = unlimited
    view_count INTEGER DEFAULT 0,

    -- Status
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES users(id),

    -- Metadata
    label TEXT,                  -- Optional friendly name like "For accountant"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT expires_in_future CHECK (expires_at > created_at)
);

-- Indexes for secure_links
CREATE INDEX idx_secure_links_token ON secure_links(token) WHERE NOT is_revoked;
CREATE INDEX idx_secure_links_document ON secure_links(document_id);
CREATE INDEX idx_secure_links_tenant ON secure_links(tenant_id);
CREATE INDEX idx_secure_links_creator ON secure_links(created_by);
CREATE INDEX idx_secure_links_expires ON secure_links(expires_at) WHERE NOT is_revoked;

-- ============================================
-- ACCESS LOG TABLE
-- ============================================

CREATE TABLE secure_link_access (
    id SERIAL PRIMARY KEY,

    -- Link reference
    link_id UUID NOT NULL REFERENCES secure_links(id) ON DELETE CASCADE,

    -- Access details
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,             -- Using INET type for proper IP handling
    user_agent TEXT,

    -- Access result
    success BOOLEAN DEFAULT TRUE,  -- FALSE if password wrong, expired, etc.
    failure_reason TEXT            -- 'expired', 'revoked', 'max_views', 'wrong_password'
);

-- Indexes for access log
CREATE INDEX idx_secure_link_access_link ON secure_link_access(link_id);
CREATE INDEX idx_secure_link_access_time ON secure_link_access(accessed_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate a secure random token
CREATE OR REPLACE FUNCTION generate_secure_token(length INTEGER DEFAULT 32)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Check if a secure link is valid (not expired, not revoked, not over limit)
CREATE OR REPLACE FUNCTION is_secure_link_valid(link_token VARCHAR)
RETURNS TABLE (
    is_valid BOOLEAN,
    reason TEXT,
    document_id INTEGER,
    requires_password BOOLEAN
) AS $$
DECLARE
    link_record RECORD;
BEGIN
    SELECT sl.* INTO link_record
    FROM secure_links sl
    WHERE sl.token = link_token;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Link not found'::TEXT, NULL::INTEGER, FALSE;
        RETURN;
    END IF;

    IF link_record.is_revoked THEN
        RETURN QUERY SELECT FALSE, 'Link has been revoked'::TEXT, NULL::INTEGER, FALSE;
        RETURN;
    END IF;

    IF link_record.expires_at < NOW() THEN
        RETURN QUERY SELECT FALSE, 'Link has expired'::TEXT, NULL::INTEGER, FALSE;
        RETURN;
    END IF;

    IF link_record.max_views IS NOT NULL AND link_record.view_count >= link_record.max_views THEN
        RETURN QUERY SELECT FALSE, 'Maximum views reached'::TEXT, NULL::INTEGER, FALSE;
        RETURN;
    END IF;

    RETURN QUERY SELECT
        TRUE,
        'Valid'::TEXT,
        link_record.document_id,
        (link_record.password_hash IS NOT NULL);
END;
$$ LANGUAGE plpgsql;

-- Increment view count and log access
CREATE OR REPLACE FUNCTION record_secure_link_access(
    link_token VARCHAR,
    client_ip INET DEFAULT NULL,
    client_user_agent TEXT DEFAULT NULL,
    access_success BOOLEAN DEFAULT TRUE,
    fail_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    link_id_val UUID;
BEGIN
    SELECT id INTO link_id_val FROM secure_links WHERE token = link_token;

    IF FOUND THEN
        -- Log the access
        INSERT INTO secure_link_access (link_id, ip_address, user_agent, success, failure_reason)
        VALUES (link_id_val, client_ip, client_user_agent, access_success, fail_reason);

        -- Increment view count only on successful access
        IF access_success THEN
            UPDATE secure_links SET view_count = view_count + 1 WHERE id = link_id_val;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE secure_links IS 'Expiring shareable links for documents - allows sharing with external parties without membership';
COMMENT ON TABLE secure_link_access IS 'Audit log of all access attempts to secure links';
COMMENT ON COLUMN secure_links.token IS 'URL-safe token used in share links like /share/abc123xyz';
COMMENT ON COLUMN secure_links.password_hash IS 'Optional bcrypt password hash for extra protection';
COMMENT ON COLUMN secure_links.max_views IS 'Maximum number of successful views allowed, NULL for unlimited';
COMMENT ON COLUMN secure_links.label IS 'User-friendly label like "For accountant" or "Tax preparer access"';

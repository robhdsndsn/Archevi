-- Migration 011: Calendar Feeds for Document Expiry Dates
-- Enables iCal feed generation for external calendar subscriptions
-- Users can subscribe to their expiry dates in Google Calendar, Apple Calendar, Outlook

-- ============================================
-- CALENDAR FEEDS TABLE
-- ============================================

-- Store calendar feed tokens per tenant
CREATE TABLE IF NOT EXISTS calendar_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Unique token for the feed URL (e.g., /api/calendar/abc123.ics)
    feed_token VARCHAR(64) UNIQUE NOT NULL,

    -- Feed configuration
    is_enabled BOOLEAN DEFAULT TRUE,
    reminder_days INTEGER[] DEFAULT '{7, 30}',  -- Days before expiry to show reminders

    -- Filter options (which document types to include)
    include_categories TEXT[] DEFAULT ARRAY['insurance', 'legal', 'medical', 'financial'],

    -- Security
    last_accessed_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- One feed per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_feeds_tenant
ON calendar_feeds(tenant_id);

-- Fast lookup by token
CREATE INDEX IF NOT EXISTS idx_calendar_feeds_token
ON calendar_feeds(feed_token);

-- ============================================
-- HELPER FUNCTION: Generate Secure Token
-- ============================================

CREATE OR REPLACE FUNCTION generate_calendar_token()
RETURNS VARCHAR(64) AS $$
DECLARE
    token VARCHAR(64);
BEGIN
    -- Generate URL-safe token: 32 random bytes -> 64 hex chars
    token := encode(gen_random_bytes(32), 'hex');
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTO-CREATE CALENDAR FEED FOR NEW TENANTS
-- ============================================

-- Trigger function to auto-create calendar feed when tenant is created
CREATE OR REPLACE FUNCTION create_calendar_feed_for_tenant()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO calendar_feeds (tenant_id, feed_token)
    VALUES (NEW.id, generate_calendar_token())
    ON CONFLICT (tenant_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_create_calendar_feed ON tenants;

-- Create trigger
CREATE TRIGGER trigger_create_calendar_feed
    AFTER INSERT ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION create_calendar_feed_for_tenant();

-- ============================================
-- CREATE FEEDS FOR EXISTING TENANTS
-- ============================================

INSERT INTO calendar_feeds (tenant_id, feed_token)
SELECT t.id, generate_calendar_token()
FROM tenants t
WHERE NOT EXISTS (
    SELECT 1 FROM calendar_feeds cf WHERE cf.tenant_id = t.id
);

-- ============================================
-- ENHANCED EXPIRING DOCUMENTS VIEW
-- ============================================

-- Drop and recreate view for iCal generation
DROP VIEW IF EXISTS documents_expiring_for_calendar;

CREATE VIEW documents_expiring_for_calendar AS
SELECT
    d.id as document_id,
    d.tenant_id,
    d.title as document_title,
    d.category,
    exp_date->>'date' as expiry_date_str,
    (exp_date->>'date')::DATE as expiry_date,
    exp_date->>'type' as expiry_type,
    COALESCE(exp_date->>'label', exp_date->>'type', 'Expiry') as expiry_label,
    d.metadata->>'storage_path' as storage_path,
    d.created_at as document_created_at
FROM family_documents d,
     jsonb_array_elements(COALESCE(d.metadata->'expiry_dates', '[]'::jsonb)) as exp_date
WHERE d.metadata->'expiry_dates' IS NOT NULL
  AND jsonb_array_length(d.metadata->'expiry_dates') > 0
  AND (exp_date->>'date')::DATE >= CURRENT_DATE
ORDER BY expiry_date;

-- ============================================
-- LOG CALENDAR FEED ACCESS
-- ============================================

CREATE TABLE IF NOT EXISTS calendar_feed_access_log (
    id SERIAL PRIMARY KEY,
    feed_id UUID REFERENCES calendar_feeds(id) ON DELETE CASCADE,
    accessed_at TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    event_count INTEGER  -- How many events were in the feed
);

-- Keep last 100 access logs per feed
CREATE INDEX IF NOT EXISTS idx_calendar_access_feed_time
ON calendar_feed_access_log(feed_id, accessed_at DESC);

-- ============================================
-- REGENERATE TOKEN FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION regenerate_calendar_token(p_tenant_id UUID)
RETURNS VARCHAR(64) AS $$
DECLARE
    new_token VARCHAR(64);
BEGIN
    new_token := generate_calendar_token();

    UPDATE calendar_feeds
    SET feed_token = new_token,
        updated_at = NOW()
    WHERE tenant_id = p_tenant_id;

    RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE calendar_feeds IS 'iCal feed tokens for external calendar subscription';
COMMENT ON COLUMN calendar_feeds.feed_token IS 'Unique token used in feed URL (e.g., /api/calendar/{token}.ics)';
COMMENT ON COLUMN calendar_feeds.reminder_days IS 'Array of days before expiry to include VALARM reminders';
COMMENT ON COLUMN calendar_feeds.include_categories IS 'Document categories to include in the feed';
COMMENT ON VIEW documents_expiring_for_calendar IS 'Documents with expiry dates for iCal generation';

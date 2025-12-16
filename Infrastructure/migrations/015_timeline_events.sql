-- Migration: 015_timeline_events.sql
-- Description: Family timeline for visualizing events extracted from documents
-- Created: 2025-12-10

-- Timeline events table
-- Stores events extracted from documents or manually added
CREATE TABLE IF NOT EXISTS timeline_events (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Event timing
    event_date DATE NOT NULL,
    event_end_date DATE,  -- For events spanning a period (e.g., insurance coverage)
    event_time TIME,  -- Optional time of day

    -- Event details
    event_type VARCHAR(50) NOT NULL,  -- birth, death, wedding, medical, legal, financial, insurance, photo, milestone, other
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Source document (optional - can be manually added events)
    -- References family_documents (legacy INTEGER id table) not documents (UUID table)
    document_id INTEGER REFERENCES family_documents(id) ON DELETE SET NULL,

    -- Family member association (optional)
    family_member_id INTEGER REFERENCES family_members(id) ON DELETE SET NULL,
    family_member_name VARCHAR(255),  -- Cached name or for non-member people

    -- Metadata
    source VARCHAR(50) DEFAULT 'extracted',  -- 'extracted' (AI), 'manual', 'imported'
    confidence FLOAT,  -- AI extraction confidence (0-1)
    extracted_data JSONB,  -- Raw extracted data for reference

    -- Tracking
    created_by INTEGER REFERENCES family_members(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_timeline_tenant_date
    ON timeline_events(tenant_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_type
    ON timeline_events(tenant_id, event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_document
    ON timeline_events(document_id) WHERE document_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_timeline_member
    ON timeline_events(family_member_id) WHERE family_member_id IS NOT NULL;

-- Event type enum for reference (not enforced, for documentation)
COMMENT ON COLUMN timeline_events.event_type IS
    'Event types: birth, death, wedding, anniversary, graduation, medical, legal, financial, insurance, purchase, travel, photo, milestone, other';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_timeline_event_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_timeline_event_updated
    BEFORE UPDATE ON timeline_events
    FOR EACH ROW
    EXECUTE FUNCTION update_timeline_event_timestamp();

-- Helper function to get timeline for a tenant with optional filters
CREATE OR REPLACE FUNCTION get_tenant_timeline(
    p_tenant_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_event_types TEXT[] DEFAULT NULL,
    p_family_member_id INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    event_date DATE,
    event_end_date DATE,
    event_time TIME,
    event_type VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    document_id INTEGER,
    document_title TEXT,
    family_member_id INTEGER,
    family_member_name VARCHAR(255),
    source VARCHAR(50),
    confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        te.id,
        te.event_date,
        te.event_end_date,
        te.event_time,
        te.event_type,
        te.title,
        te.description,
        te.document_id,
        d.title AS document_title,
        te.family_member_id,
        COALESCE(te.family_member_name, fm.name) AS family_member_name,
        te.source,
        te.confidence,
        te.created_at
    FROM timeline_events te
    LEFT JOIN family_documents d ON te.document_id = d.id
    LEFT JOIN family_members fm ON te.family_member_id = fm.id
    WHERE te.tenant_id = p_tenant_id
        AND (p_start_date IS NULL OR te.event_date >= p_start_date)
        AND (p_end_date IS NULL OR te.event_date <= p_end_date)
        AND (p_event_types IS NULL OR te.event_type = ANY(p_event_types))
        AND (p_family_member_id IS NULL OR te.family_member_id = p_family_member_id)
    ORDER BY te.event_date DESC, te.event_time DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get timeline summary (event counts by type and year)
CREATE OR REPLACE FUNCTION get_timeline_summary(p_tenant_id UUID)
RETURNS TABLE (
    year INTEGER,
    event_type VARCHAR(50),
    event_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        EXTRACT(YEAR FROM te.event_date)::INTEGER AS year,
        te.event_type,
        COUNT(*)::BIGINT AS event_count
    FROM timeline_events te
    WHERE te.tenant_id = p_tenant_id
    GROUP BY EXTRACT(YEAR FROM te.event_date), te.event_type
    ORDER BY year DESC, event_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON timeline_events TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE timeline_events_id_seq TO authenticated;

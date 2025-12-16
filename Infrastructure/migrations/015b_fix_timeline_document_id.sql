-- Migration: 015b_fix_timeline_document_id.sql
-- Description: Fix document_id type from UUID to INTEGER to match family_documents table
-- Created: 2025-12-11

-- The original migration incorrectly referenced documents(id) which is UUID
-- But the app uses family_documents(id) which is INTEGER

-- Step 1: Drop the foreign key constraint if it exists
ALTER TABLE timeline_events DROP CONSTRAINT IF EXISTS timeline_events_document_id_fkey;

-- Step 2: Drop the index on document_id
DROP INDEX IF EXISTS idx_timeline_document;

-- Step 3: Alter the column type (will lose any existing UUID data)
-- Since this is early in deployment, we can safely convert
ALTER TABLE timeline_events ALTER COLUMN document_id TYPE INTEGER USING NULL;

-- Step 4: Add the correct foreign key constraint
ALTER TABLE timeline_events
    ADD CONSTRAINT timeline_events_document_id_fkey
    FOREIGN KEY (document_id) REFERENCES family_documents(id) ON DELETE SET NULL;

-- Step 5: Recreate the index
CREATE INDEX IF NOT EXISTS idx_timeline_document
    ON timeline_events(document_id) WHERE document_id IS NOT NULL;

-- Step 6: Update the helper function to use correct table
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

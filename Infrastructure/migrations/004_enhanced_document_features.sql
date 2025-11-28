-- Migration 004: Enhanced Document Features
-- Adds metadata support for AI features: tags, expiry dates, category confidence
-- Adds voice notes support

-- ============================================
-- ADD METADATA TO EXISTING TABLES
-- ============================================

-- Add metadata column to family_documents (legacy table)
ALTER TABLE family_documents
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add metadata column to documents (new multi-tenant table)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for JSONB queries on tags
CREATE INDEX IF NOT EXISTS idx_family_documents_tags
ON family_documents USING GIN ((metadata->'tags'));

CREATE INDEX IF NOT EXISTS idx_documents_tags
ON documents USING GIN ((metadata->'tags'));

-- Create index for expiry date queries
CREATE INDEX IF NOT EXISTS idx_family_documents_expiry
ON family_documents USING GIN ((metadata->'expiry_dates'));

CREATE INDEX IF NOT EXISTS idx_documents_expiry
ON documents USING GIN ((metadata->'expiry_dates'));

-- ============================================
-- VOICE NOTES TABLE
-- ============================================

-- Voice notes for both legacy and multi-tenant
CREATE TABLE IF NOT EXISTS voice_notes (
    id SERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL for legacy single-tenant

    -- Content
    title TEXT NOT NULL,
    transcript TEXT NOT NULL,
    duration_seconds INTEGER,
    language TEXT DEFAULT 'en',

    -- Original audio reference (optional - if we store audio files)
    audio_file_path TEXT,
    audio_file_size INTEGER,
    mime_type TEXT DEFAULT 'audio/webm',

    -- Transcription details
    transcription_model TEXT DEFAULT 'whisper-large-v3',
    transcription_confidence DECIMAL(3,2),

    -- Vector embedding (same as documents)
    embedding vector(1024),
    embedding_model TEXT DEFAULT 'embed-v4.0',

    -- Ownership
    created_by TEXT,  -- Email for legacy, UUID ref for multi-tenant
    created_by_user_id UUID REFERENCES users(id),

    -- AI-extracted metadata
    metadata JSONB DEFAULT '{}',  -- tags, category, etc.

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for voice notes
CREATE INDEX IF NOT EXISTS idx_voice_notes_tenant ON voice_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_voice_notes_created ON voice_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_notes_embedding ON voice_notes USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_voice_notes_tags ON voice_notes USING GIN ((metadata->'tags'));

-- ============================================
-- DOCUMENT CATEGORIES (Expanded)
-- ============================================

-- Add new categories to check constraint (if using constraints)
-- Note: This is informational - actual validation happens in application

COMMENT ON TABLE voice_notes IS 'Voice memos with automatic transcription and embedding for RAG queries';

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View for documents with upcoming expiry dates
CREATE OR REPLACE VIEW documents_expiring_soon AS
SELECT
    d.id,
    d.title,
    d.category,
    d.created_at,
    (exp_date->>'date')::DATE as expiry_date,
    exp_date->>'type' as expiry_type,
    (exp_date->>'confidence')::DECIMAL as confidence
FROM family_documents d,
LATERAL jsonb_array_elements(d.metadata->'expiry_dates') as exp_date
WHERE (exp_date->>'date')::DATE BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
ORDER BY (exp_date->>'date')::DATE;

-- View for documents by tag (legacy)
CREATE OR REPLACE VIEW documents_by_tag AS
SELECT
    d.id,
    d.title,
    d.category,
    d.created_at,
    tag as tag
FROM family_documents d,
LATERAL jsonb_array_elements_text(d.metadata->'tags') as tag;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to search documents by tag
CREATE OR REPLACE FUNCTION search_documents_by_tag(
    p_tag TEXT,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    id INTEGER,
    title TEXT,
    category TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.title,
        d.category,
        d.created_at
    FROM family_documents d
    WHERE d.metadata->'tags' ? p_tag
    ORDER BY d.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get documents expiring within N days
CREATE OR REPLACE FUNCTION get_expiring_documents(
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    id INTEGER,
    title TEXT,
    category TEXT,
    expiry_date DATE,
    expiry_type TEXT,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.title,
        d.category,
        (exp_date->>'date')::DATE,
        exp_date->>'type',
        ((exp_date->>'date')::DATE - CURRENT_DATE)::INTEGER
    FROM family_documents d,
    LATERAL jsonb_array_elements(d.metadata->'expiry_dates') as exp_date
    WHERE d.metadata->'expiry_dates' IS NOT NULL
      AND jsonb_array_length(d.metadata->'expiry_dates') > 0
      AND (exp_date->>'date')::DATE BETWEEN CURRENT_DATE AND CURRENT_DATE + (p_days || ' days')::INTERVAL
    ORDER BY (exp_date->>'date')::DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to get all unique tags
CREATE OR REPLACE FUNCTION get_all_tags()
RETURNS TABLE (
    tag TEXT,
    document_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.tag,
        COUNT(*) as doc_count
    FROM family_documents d,
    LATERAL jsonb_array_elements_text(d.metadata->'tags') as t(tag)
    GROUP BY t.tag
    ORDER BY doc_count DESC, t.tag;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- UPDATE API USAGE LOG FOR NEW OPERATIONS
-- ============================================

-- Add new operation types if not using enum
-- The api_usage_log table should accept 'transcribe' operation
COMMENT ON TABLE api_usage_log IS 'Tracks API usage including embed, generate, rerank, and transcribe operations';

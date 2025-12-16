-- Migration 010: Document Versioning
-- Track document versions when re-uploaded with changes
-- Enables version history and rollback

-- ============================================
-- DOCUMENT VERSIONS TABLE
-- ============================================

-- Store version history for documents
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

    -- Version info
    version_number INTEGER NOT NULL,

    -- Snapshot of document at this version
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,          -- SHA-256 hash for comparison
    file_size_bytes INTEGER,

    -- Storage reference (if file was stored)
    storage_path TEXT,                    -- Path in Supabase storage

    -- Change tracking
    change_summary TEXT,                  -- Auto-generated or user-provided
    change_type TEXT CHECK (change_type IN ('initial', 'update', 'correction', 'major_revision')),

    -- Who made this version
    created_by UUID REFERENCES users(id),

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),

    -- Ensure version numbers are unique per document
    UNIQUE(document_id, version_number)
);

-- Indexes for version lookup
CREATE INDEX idx_doc_versions_document ON document_versions(document_id, version_number DESC);
CREATE INDEX idx_doc_versions_hash ON document_versions(content_hash);
CREATE INDEX idx_doc_versions_created ON document_versions(created_at DESC);

-- ============================================
-- ALTER DOCUMENTS TABLE
-- ============================================

-- Add versioning columns to documents
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS version_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create index on content_hash for duplicate/version detection
CREATE INDEX IF NOT EXISTS idx_documents_content_hash ON documents(tenant_id, content_hash);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to create a new version when document is updated
CREATE OR REPLACE FUNCTION create_document_version(
    p_document_id UUID,
    p_title TEXT,
    p_content TEXT,
    p_content_hash TEXT,
    p_file_size INTEGER,
    p_storage_path TEXT,
    p_change_summary TEXT,
    p_change_type TEXT,
    p_created_by UUID
) RETURNS INTEGER AS $$
DECLARE
    v_next_version INTEGER;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
    FROM document_versions
    WHERE document_id = p_document_id;

    -- Insert version record
    INSERT INTO document_versions (
        document_id,
        version_number,
        title,
        content,
        content_hash,
        file_size_bytes,
        storage_path,
        change_summary,
        change_type,
        created_by
    ) VALUES (
        p_document_id,
        v_next_version,
        p_title,
        p_content,
        p_content_hash,
        p_file_size,
        p_storage_path,
        p_change_summary,
        p_change_type,
        p_created_by
    );

    -- Update document's version tracking
    UPDATE documents
    SET current_version = v_next_version,
        version_count = v_next_version,
        content_hash = p_content_hash,
        updated_at = NOW(),
        updated_by = p_created_by
    WHERE id = p_document_id;

    RETURN v_next_version;
END;
$$ LANGUAGE plpgsql;

-- Function to get version history for a document
CREATE OR REPLACE FUNCTION get_document_versions(p_document_id UUID)
RETURNS TABLE (
    version_number INTEGER,
    title TEXT,
    content_preview TEXT,
    content_hash TEXT,
    file_size_bytes INTEGER,
    change_summary TEXT,
    change_type TEXT,
    created_by_name TEXT,
    created_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dv.version_number,
        dv.title,
        LEFT(dv.content, 200) as content_preview,
        dv.content_hash,
        dv.file_size_bytes,
        dv.change_summary,
        dv.change_type,
        u.name as created_by_name,
        dv.created_at
    FROM document_versions dv
    LEFT JOIN users u ON dv.created_by = u.id
    WHERE dv.document_id = p_document_id
    ORDER BY dv.version_number DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to rollback to a specific version
CREATE OR REPLACE FUNCTION rollback_document_to_version(
    p_document_id UUID,
    p_target_version INTEGER,
    p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_version_record document_versions%ROWTYPE;
    v_new_version INTEGER;
BEGIN
    -- Get the target version
    SELECT * INTO v_version_record
    FROM document_versions
    WHERE document_id = p_document_id
      AND version_number = p_target_version;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Version % not found for document %', p_target_version, p_document_id;
    END IF;

    -- Create a new version from the rollback (preserves history)
    SELECT create_document_version(
        p_document_id,
        v_version_record.title,
        v_version_record.content,
        v_version_record.content_hash,
        v_version_record.file_size_bytes,
        v_version_record.storage_path,
        'Rolled back to version ' || p_target_version,
        'correction',
        p_user_id
    ) INTO v_new_version;

    -- Update the main document content
    UPDATE documents
    SET title = v_version_record.title,
        content = v_version_record.content,
        content_hash = v_version_record.content_hash,
        file_size_bytes = v_version_record.file_size_bytes,
        source_file = v_version_record.storage_path,
        updated_at = NOW(),
        updated_by = p_user_id
    WHERE id = p_document_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if content is a new version of existing document
-- Returns existing document info if content hash matches filename pattern
CREATE OR REPLACE FUNCTION check_for_version_candidate(
    p_tenant_id UUID,
    p_title TEXT,
    p_content_hash TEXT
) RETURNS TABLE (
    document_id UUID,
    document_title TEXT,
    current_version INTEGER,
    is_exact_duplicate BOOLEAN,
    title_similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.title,
        d.current_version,
        (d.content_hash = p_content_hash) as is_exact_duplicate,
        similarity(d.title, p_title) as title_similarity
    FROM documents d
    WHERE d.tenant_id = p_tenant_id
      AND (
          -- Exact content match (duplicate)
          d.content_hash = p_content_hash
          -- Or similar title (potential version)
          OR similarity(d.title, p_title) > 0.6
      )
    ORDER BY
        CASE WHEN d.content_hash = p_content_hash THEN 0 ELSE 1 END,
        similarity(d.title, p_title) DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATE EXISTING DOCUMENTS
-- ============================================

-- Create initial version records for existing documents
-- This runs once to backfill version history

DO $$
DECLARE
    doc_record RECORD;
BEGIN
    FOR doc_record IN
        SELECT id, title, content,
               COALESCE(metadata->>'content_hash',
                        encode(sha256(content::bytea), 'hex')) as content_hash,
               file_size_bytes, source_file, created_by, created_at
        FROM documents
        WHERE id NOT IN (SELECT DISTINCT document_id FROM document_versions)
    LOOP
        INSERT INTO document_versions (
            document_id,
            version_number,
            title,
            content,
            content_hash,
            file_size_bytes,
            storage_path,
            change_summary,
            change_type,
            created_by,
            created_at
        ) VALUES (
            doc_record.id,
            1,
            doc_record.title,
            doc_record.content,
            doc_record.content_hash,
            doc_record.file_size_bytes,
            doc_record.source_file,
            'Initial version',
            'initial',
            doc_record.created_by,
            doc_record.created_at
        );

        -- Update document's content_hash if not set
        UPDATE documents
        SET content_hash = doc_record.content_hash,
            current_version = 1,
            version_count = 1
        WHERE id = doc_record.id
          AND content_hash IS NULL;
    END LOOP;
END $$;

-- ============================================
-- EXTENSION FOR TITLE SIMILARITY
-- ============================================

-- pg_trgm is needed for similarity() function
-- Usually already enabled, but ensure it's available
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for title similarity searches
CREATE INDEX IF NOT EXISTS idx_documents_title_trgm ON documents USING gin (title gin_trgm_ops);

-- ============================================
-- GRANTS
-- ============================================

-- Grant execute on functions to authenticated users
-- (Adjust based on your auth setup)
-- GRANT EXECUTE ON FUNCTION create_document_version TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_document_versions TO authenticated;
-- GRANT EXECUTE ON FUNCTION rollback_document_to_version TO authenticated;
-- GRANT EXECUTE ON FUNCTION check_for_version_candidate TO authenticated;

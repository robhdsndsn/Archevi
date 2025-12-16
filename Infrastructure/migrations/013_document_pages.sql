-- Migration 013: Document Pages for PDF Visual Search
-- Stores page-level embeddings and screenshots for visual document search
-- Enables searching scanned documents, charts, diagrams, and handwritten notes

-- ============================================
-- DOCUMENT PAGES TABLE
-- ============================================

CREATE TABLE document_pages (
    id SERIAL PRIMARY KEY,

    -- Document reference
    document_id INTEGER NOT NULL REFERENCES family_documents(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Page info
    page_number INTEGER NOT NULL,

    -- Page image (stored as base64 or URL)
    page_image TEXT,              -- Base64-encoded JPEG thumbnail (512x512)
    page_image_full TEXT,         -- Optional: larger image or storage URL

    -- Visual embedding from Cohere Embed v4
    embedding vector(1024),

    -- OCR text extracted from page (optional, for hybrid search)
    ocr_text TEXT,

    -- Page metadata
    width INTEGER,
    height INTEGER,
    has_text BOOLEAN DEFAULT TRUE,    -- Does page have extractable text?
    has_images BOOLEAN DEFAULT FALSE, -- Does page contain images/charts?

    -- Processing info
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    embedding_model TEXT DEFAULT 'embed-v4.0',
    embedding_tokens INTEGER,         -- Token count for cost tracking

    -- Unique constraint: one embedding per page per document
    CONSTRAINT unique_document_page UNIQUE (document_id, page_number)
);

-- ============================================
-- INDEXES
-- ============================================

-- Vector similarity search (HNSW for fast approximate nearest neighbor)
CREATE INDEX idx_document_pages_embedding ON document_pages
    USING hnsw (embedding vector_cosine_ops)
    WHERE embedding IS NOT NULL;

-- Lookup by document
CREATE INDEX idx_document_pages_document ON document_pages(document_id);

-- Lookup by tenant for filtering
CREATE INDEX idx_document_pages_tenant ON document_pages(tenant_id);

-- Find unprocessed pages
CREATE INDEX idx_document_pages_unprocessed ON document_pages(document_id)
    WHERE embedding IS NULL;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get page count for a document
CREATE OR REPLACE FUNCTION get_document_page_count(doc_id INTEGER)
RETURNS INTEGER AS $$
    SELECT COALESCE(MAX(page_number), 0) FROM document_pages WHERE document_id = doc_id;
$$ LANGUAGE SQL STABLE;

-- Check if document has visual embeddings
CREATE OR REPLACE FUNCTION has_visual_embeddings(doc_id INTEGER)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM document_pages
        WHERE document_id = doc_id AND embedding IS NOT NULL
    );
$$ LANGUAGE SQL STABLE;

-- Search pages by visual similarity
CREATE OR REPLACE FUNCTION search_document_pages_visual(
    query_embedding vector(1024),
    p_tenant_id UUID,
    p_limit INTEGER DEFAULT 10,
    p_min_similarity FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    page_id INTEGER,
    document_id INTEGER,
    page_number INTEGER,
    similarity FLOAT,
    page_image TEXT,
    ocr_text TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dp.id as page_id,
        dp.document_id,
        dp.page_number,
        (1 - (dp.embedding <=> query_embedding))::FLOAT as similarity,
        dp.page_image,
        dp.ocr_text
    FROM document_pages dp
    WHERE dp.tenant_id = p_tenant_id
      AND dp.embedding IS NOT NULL
      AND (1 - (dp.embedding <=> query_embedding)) >= p_min_similarity
    ORDER BY dp.embedding <=> query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- ADD PDF PAGE COUNT TO DOCUMENTS
-- ============================================

-- Add column to track PDF page count on main documents table
ALTER TABLE family_documents
    ADD COLUMN IF NOT EXISTS pdf_page_count INTEGER,
    ADD COLUMN IF NOT EXISTS has_page_embeddings BOOLEAN DEFAULT FALSE;

-- Index for finding documents with page embeddings
CREATE INDEX IF NOT EXISTS idx_family_documents_page_embeddings
    ON family_documents(tenant_id)
    WHERE has_page_embeddings = TRUE;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE document_pages IS 'Page-level visual embeddings for PDF documents - enables visual search of scanned docs, charts, diagrams';
COMMENT ON COLUMN document_pages.page_image IS 'Base64-encoded JPEG thumbnail (512x512) for display in search results';
COMMENT ON COLUMN document_pages.embedding IS 'Cohere Embed v4 visual embedding (1024 dimensions) for similarity search';
COMMENT ON COLUMN document_pages.ocr_text IS 'Optional OCR text for hybrid text+visual search';
COMMENT ON COLUMN document_pages.has_images IS 'Flag indicating page contains charts, diagrams, or photos';

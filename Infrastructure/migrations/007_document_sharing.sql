-- Migration 007: Document Sharing Between Tenant Members
-- Allows sharing specific documents with specific family members
-- with view or edit permissions

-- ============================================
-- DOCUMENT SHARES TABLE
-- ============================================

CREATE TABLE document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The document being shared
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

    -- Who it's shared with
    shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Who shared it
    shared_by_user_id UUID NOT NULL REFERENCES users(id),

    -- Permission level
    permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),

    -- Optional message from sharer
    share_message TEXT,

    -- Tracking
    created_at TIMESTAMP DEFAULT NOW(),

    -- Prevent duplicate shares
    UNIQUE(document_id, shared_with_user_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_document_shares_document ON document_shares(document_id);
CREATE INDEX idx_document_shares_recipient ON document_shares(shared_with_user_id);
CREATE INDEX idx_document_shares_sharer ON document_shares(shared_by_user_id);

-- ============================================
-- SHARE NOTIFICATIONS TABLE (Optional)
-- ============================================

CREATE TABLE share_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The share that triggered this notification
    share_id UUID NOT NULL REFERENCES document_shares(id) ON DELETE CASCADE,

    -- Recipient
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Status
    read_at TIMESTAMP,
    dismissed_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_share_notifications_user ON share_notifications(user_id, read_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user can access a document (combines visibility + sharing)
CREATE OR REPLACE FUNCTION user_can_access_document(
    p_user_id UUID,
    p_document_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_document documents%ROWTYPE;
    v_membership tenant_memberships%ROWTYPE;
    v_is_shared BOOLEAN;
BEGIN
    -- Get the document
    SELECT * INTO v_document FROM documents WHERE id = p_document_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Get user's membership in the document's tenant
    SELECT * INTO v_membership
    FROM tenant_memberships
    WHERE user_id = p_user_id
      AND tenant_id = v_document.tenant_id
      AND status = 'active';

    -- Must be a member of the tenant
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if user is the owner/creator
    IF v_document.created_by = p_user_id THEN
        RETURN TRUE;
    END IF;

    -- Check visibility-based access
    CASE v_document.visibility
        WHEN 'everyone' THEN
            RETURN TRUE;
        WHEN 'adults_only' THEN
            -- For now, all members can access adults_only
            -- In future, could check user.is_adult flag
            RETURN v_membership.role IN ('owner', 'admin', 'member');
        WHEN 'admins_only' THEN
            RETURN v_membership.role IN ('owner', 'admin');
        WHEN 'private' THEN
            -- Only creator OR explicitly shared
            NULL; -- Fall through to sharing check
        ELSE
            RETURN TRUE; -- Default to everyone if no visibility set
    END CASE;

    -- Check if document is explicitly shared with user
    SELECT EXISTS(
        SELECT 1 FROM document_shares
        WHERE document_id = p_document_id
          AND shared_with_user_id = p_user_id
    ) INTO v_is_shared;

    RETURN v_is_shared;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can edit a document
CREATE OR REPLACE FUNCTION user_can_edit_document(
    p_user_id UUID,
    p_document_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_document documents%ROWTYPE;
    v_membership tenant_memberships%ROWTYPE;
    v_share_permission TEXT;
BEGIN
    -- Get the document
    SELECT * INTO v_document FROM documents WHERE id = p_document_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Get user's membership
    SELECT * INTO v_membership
    FROM tenant_memberships
    WHERE user_id = p_user_id
      AND tenant_id = v_document.tenant_id
      AND status = 'active';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Owner/creator can always edit
    IF v_document.created_by = p_user_id THEN
        RETURN TRUE;
    END IF;

    -- Admins can edit any document in their tenant
    IF v_membership.role IN ('owner', 'admin') THEN
        RETURN TRUE;
    END IF;

    -- Check if shared with edit permission
    SELECT permission INTO v_share_permission
    FROM document_shares
    WHERE document_id = p_document_id
      AND shared_with_user_id = p_user_id;

    RETURN v_share_permission = 'edit';
END;
$$ LANGUAGE plpgsql;

-- Function to share a document
CREATE OR REPLACE FUNCTION share_document(
    p_document_id UUID,
    p_shared_by UUID,
    p_shared_with UUID,
    p_permission TEXT DEFAULT 'view',
    p_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_share_id UUID;
    v_document documents%ROWTYPE;
BEGIN
    -- Verify document exists and sharer has access
    SELECT * INTO v_document FROM documents WHERE id = p_document_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document not found';
    END IF;

    -- Verify sharer can share (must be creator or admin)
    IF NOT (v_document.created_by = p_shared_by OR
            EXISTS(SELECT 1 FROM tenant_memberships
                   WHERE user_id = p_shared_by
                     AND tenant_id = v_document.tenant_id
                     AND role IN ('owner', 'admin')
                     AND status = 'active')) THEN
        RAISE EXCEPTION 'User does not have permission to share this document';
    END IF;

    -- Verify recipient is a member of the same tenant
    IF NOT EXISTS(SELECT 1 FROM tenant_memberships
                  WHERE user_id = p_shared_with
                    AND tenant_id = v_document.tenant_id
                    AND status = 'active') THEN
        RAISE EXCEPTION 'Recipient is not a member of this family';
    END IF;

    -- Create or update the share
    INSERT INTO document_shares (document_id, shared_by_user_id, shared_with_user_id, permission, share_message)
    VALUES (p_document_id, p_shared_by, p_shared_with, p_permission, p_message)
    ON CONFLICT (document_id, shared_with_user_id)
    DO UPDATE SET
        permission = EXCLUDED.permission,
        share_message = EXCLUDED.share_message,
        shared_by_user_id = EXCLUDED.shared_by_user_id
    RETURNING id INTO v_share_id;

    -- Create notification
    INSERT INTO share_notifications (share_id, user_id)
    VALUES (v_share_id, p_shared_with)
    ON CONFLICT DO NOTHING;

    RETURN v_share_id;
END;
$$ LANGUAGE plpgsql;

-- Function to unshare a document
CREATE OR REPLACE FUNCTION unshare_document(
    p_document_id UUID,
    p_unshared_by UUID,
    p_shared_with UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_document documents%ROWTYPE;
BEGIN
    -- Verify document exists
    SELECT * INTO v_document FROM documents WHERE id = p_document_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Verify user can unshare (must be creator, admin, or the original sharer)
    IF NOT (v_document.created_by = p_unshared_by OR
            EXISTS(SELECT 1 FROM tenant_memberships
                   WHERE user_id = p_unshared_by
                     AND tenant_id = v_document.tenant_id
                     AND role IN ('owner', 'admin')
                     AND status = 'active') OR
            EXISTS(SELECT 1 FROM document_shares
                   WHERE document_id = p_document_id
                     AND shared_with_user_id = p_shared_with
                     AND shared_by_user_id = p_unshared_by)) THEN
        RETURN FALSE;
    END IF;

    -- Remove the share
    DELETE FROM document_shares
    WHERE document_id = p_document_id
      AND shared_with_user_id = p_shared_with;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

-- View: Documents shared with a user
CREATE OR REPLACE VIEW shared_with_me_view AS
SELECT
    ds.id as share_id,
    ds.document_id,
    d.title as document_title,
    d.category as document_category,
    d.created_at as document_created_at,
    ds.shared_with_user_id as recipient_id,
    ds.shared_by_user_id as sharer_id,
    sharer.name as sharer_name,
    sharer.email as sharer_email,
    ds.permission,
    ds.share_message,
    ds.created_at as shared_at,
    sn.read_at as notification_read_at
FROM document_shares ds
JOIN documents d ON ds.document_id = d.id
JOIN users sharer ON ds.shared_by_user_id = sharer.id
LEFT JOIN share_notifications sn ON ds.id = sn.share_id AND ds.shared_with_user_id = sn.user_id;

-- View: Documents I've shared
CREATE OR REPLACE VIEW shared_by_me_view AS
SELECT
    ds.id as share_id,
    ds.document_id,
    d.title as document_title,
    d.category as document_category,
    ds.shared_by_user_id as sharer_id,
    ds.shared_with_user_id as recipient_id,
    recipient.name as recipient_name,
    recipient.email as recipient_email,
    ds.permission,
    ds.share_message,
    ds.created_at as shared_at
FROM document_shares ds
JOIN documents d ON ds.document_id = d.id
JOIN users recipient ON ds.shared_with_user_id = recipient.id;

-- ============================================
-- COMMENT
-- ============================================
COMMENT ON TABLE document_shares IS 'Tracks document sharing between family members within a tenant';
COMMENT ON FUNCTION user_can_access_document IS 'Checks if user can access document via visibility or explicit share';
COMMENT ON FUNCTION share_document IS 'Shares a document with a family member, creates notification';

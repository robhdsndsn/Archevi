-- Migration 014: Two-Factor Authentication (2FA/MFA)
-- Adds TOTP-based 2FA support with backup codes

-- ============================================
-- ADD 2FA COLUMNS TO USERS TABLE
-- ============================================

-- TOTP secret for authenticator apps (encrypted at rest by Supabase)
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret TEXT;

-- Whether 2FA is enabled for this user
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;

-- Backup codes for account recovery (10 single-use codes, hashed)
-- Format: [{"code_hash": "sha256...", "used_at": null}, ...]
ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_codes JSONB DEFAULT '[]';

-- Timestamp when 2FA was enabled (for audit purposes)
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled_at TIMESTAMP;

-- ============================================
-- 2FA SESSION TRACKING
-- ============================================

-- Track 2FA verification during login flow
-- This allows the login to return a temporary token that requires 2FA completion
CREATE TABLE IF NOT EXISTS two_factor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Temporary token issued after password verification
    session_token TEXT UNIQUE NOT NULL,

    -- Expiration (typically 5 minutes)
    expires_at TIMESTAMP NOT NULL,

    -- Whether the 2FA challenge was completed
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,

    -- Request context for security logging
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_2fa_sessions_token ON two_factor_sessions(session_token);

-- Index for cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_2fa_sessions_expires ON two_factor_sessions(expires_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if a backup code is valid and mark it as used
CREATE OR REPLACE FUNCTION use_backup_code(
    p_user_id UUID,
    p_code_hash TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_codes JSONB;
    v_new_codes JSONB := '[]'::JSONB;
    v_code JSONB;
    v_found BOOLEAN := FALSE;
BEGIN
    -- Get current backup codes
    SELECT backup_codes INTO v_codes FROM users WHERE id = p_user_id;

    IF v_codes IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Iterate through codes
    FOR v_code IN SELECT * FROM jsonb_array_elements(v_codes)
    LOOP
        IF v_code->>'code_hash' = p_code_hash AND v_code->>'used_at' IS NULL THEN
            -- Mark this code as used
            v_code := jsonb_set(v_code, '{used_at}', to_jsonb(NOW()::TEXT));
            v_found := TRUE;
        END IF;
        v_new_codes := v_new_codes || v_code;
    END LOOP;

    -- Update the user's backup codes
    IF v_found THEN
        UPDATE users SET backup_codes = v_new_codes WHERE id = p_user_id;
    END IF;

    RETURN v_found;
END;
$$ LANGUAGE plpgsql;

-- Function to count remaining backup codes
CREATE OR REPLACE FUNCTION count_remaining_backup_codes(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_codes JSONB;
    v_code JSONB;
BEGIN
    SELECT backup_codes INTO v_codes FROM users WHERE id = p_user_id;

    IF v_codes IS NULL THEN
        RETURN 0;
    END IF;

    FOR v_code IN SELECT * FROM jsonb_array_elements(v_codes)
    LOOP
        IF v_code->>'used_at' IS NULL THEN
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CLEANUP JOB
-- ============================================

-- Function to clean up expired 2FA sessions (call periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_sessions()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM two_factor_sessions
    WHERE expires_at < NOW() - INTERVAL '1 hour';

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN users.totp_secret IS 'Base32-encoded TOTP secret for authenticator apps (32 chars)';
COMMENT ON COLUMN users.totp_enabled IS 'Whether 2FA is enabled for this user';
COMMENT ON COLUMN users.backup_codes IS 'Array of backup codes with code_hash and used_at fields';
COMMENT ON COLUMN users.totp_enabled_at IS 'Timestamp when 2FA was enabled';

COMMENT ON TABLE two_factor_sessions IS 'Temporary sessions for 2FA verification during login';
COMMENT ON FUNCTION use_backup_code IS 'Validates and marks a backup code as used, returns TRUE if successful';
COMMENT ON FUNCTION count_remaining_backup_codes IS 'Returns the count of unused backup codes for a user';
COMMENT ON FUNCTION cleanup_expired_2fa_sessions IS 'Removes expired 2FA sessions, returns count deleted';

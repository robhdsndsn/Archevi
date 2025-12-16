#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - httpx

"""
Run Multi-Tenant Migration
Applies the multi-tenant schema migration (003).

Windmill Script Configuration:
- Path: f/tenant/run_multi_tenant_migration
- Trigger: One-time migration
"""

import wmill
import psycopg2


def main(dry_run: bool = True) -> dict:
    """
    Run the multi-tenant schema migration.

    Args:
        dry_run: If True, only test connection and show what would be done

    Returns:
        dict with migration status
    """

    # Try new resource first, fall back to old
    try:
        db_resource = wmill.get_resource("u/admin/archevi_postgres")
        conn = psycopg2.connect(db_resource["connection_string"])
    except:
        postgres_db = wmill.get_resource("f/chatbot/postgres_db")
        conn = psycopg2.connect(
            host=postgres_db["host"],
            port=postgres_db["port"],
            dbname=postgres_db["dbname"],
            user=postgres_db["user"],
            password=postgres_db["password"],
            sslmode=postgres_db.get("sslmode", "disable")
        )

    cursor = conn.cursor()

    # Check if migration already applied
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'tenants'
        )
    """)
    tenants_exists = cursor.fetchone()[0]

    if tenants_exists:
        return {
            "success": True,
            "message": "Migration already applied - tenants table exists",
            "skipped": True
        }

    if dry_run:
        return {
            "success": True,
            "message": "Dry run - would create: tenants, users, tenant_memberships, documents, chat_sessions, chat_messages, ai_usage, monthly_usage_summary, provisioning_queue tables",
            "dry_run": True
        }

    # Run the migration
    migration_sql = """
    -- Migration 003: Multi-Tenant Schema with Multi-Family Access

    -- Tenants (Families) - The billing/isolation unit
    CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        stripe_customer_id TEXT UNIQUE,
        stripe_subscription_id TEXT,
        plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'family', 'family_office', 'trial')),
        plan_started_at TIMESTAMP,
        trial_ends_at TIMESTAMP,
        api_mode TEXT DEFAULT 'managed' CHECK (api_mode IN ('managed', 'byok')),
        cohere_api_key_encrypted BYTEA,
        ai_allowance_usd DECIMAL(10,4) DEFAULT 3.00,
        max_members INTEGER DEFAULT 5,
        max_storage_gb INTEGER DEFAULT 10,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'pending')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_by UUID
    );

    CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
    CREATE INDEX IF NOT EXISTS idx_tenants_stripe ON tenants(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

    -- Users - Global user accounts
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT,
        avatar_url TEXT,
        email_verified BOOLEAN DEFAULT false,
        email_verification_token TEXT,
        email_verification_expires TIMESTAMP,
        password_reset_token TEXT,
        password_reset_expires TIMESTAMP,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TIMESTAMP,
        default_tenant_id UUID REFERENCES tenants(id),
        preferences JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

    -- Tenant Memberships
    CREATE TABLE IF NOT EXISTS tenant_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
        invited_by UUID REFERENCES users(id),
        invite_token TEXT UNIQUE,
        invite_expires TIMESTAMP,
        invite_accepted_at TIMESTAMP,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_active TIMESTAMP,
        UNIQUE(tenant_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_memberships_tenant ON tenant_memberships(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_memberships_user ON tenant_memberships(user_id);
    CREATE INDEX IF NOT EXISTS idx_memberships_invite ON tenant_memberships(invite_token) WHERE invite_token IS NOT NULL;

    -- Documents - Tenant-scoped
    CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        source_file TEXT,
        file_size_bytes INTEGER,
        mime_type TEXT,
        embedding vector(1024),
        embedding_model TEXT DEFAULT 'embed-v4.0',
        created_by UUID REFERENCES users(id),
        updated_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(tenant_id, category);
    CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(tenant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING hnsw (embedding vector_cosine_ops);

    -- Chat Sessions
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id),
        title TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_chat_sessions_tenant ON chat_sessions(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(tenant_id, user_id);

    -- Chat Messages
    CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        sources JSONB,
        model_used TEXT,
        tokens_input INTEGER,
        tokens_output INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);

    -- AI Usage
    CREATE TABLE IF NOT EXISTS ai_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        operation TEXT NOT NULL CHECK (operation IN ('embed', 'generate', 'rerank')),
        model TEXT NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER DEFAULT 0,
        cost_usd DECIMAL(10, 6) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant ON ai_usage(tenant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_ai_usage_tenant_month ON ai_usage(tenant_id, DATE_TRUNC('month', created_at));

    -- Monthly Usage Summary
    CREATE TABLE IF NOT EXISTS monthly_usage_summary (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        month DATE NOT NULL,
        embed_tokens BIGINT DEFAULT 0,
        generate_input_tokens BIGINT DEFAULT 0,
        generate_output_tokens BIGINT DEFAULT 0,
        rerank_tokens BIGINT DEFAULT 0,
        total_cost_usd DECIMAL(10, 4) DEFAULT 0,
        included_allowance_usd DECIMAL(10, 4),
        overage_usd DECIMAL(10, 4) DEFAULT 0,
        billed BOOLEAN DEFAULT false,
        billed_at TIMESTAMP,
        stripe_invoice_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id, month)
    );

    CREATE INDEX IF NOT EXISTS idx_monthly_usage_tenant ON monthly_usage_summary(tenant_id, month DESC);

    -- Provisioning Queue
    CREATE TABLE IF NOT EXISTS provisioning_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id),
        step TEXT NOT NULL CHECK (step IN (
            'create_tenant', 'setup_stripe', 'create_schema',
            'configure_subdomain', 'send_welcome_email', 'complete'
        )),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
        attempts INTEGER DEFAULT 0,
        last_error TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_provisioning_status ON provisioning_queue(status, created_at);
    CREATE INDEX IF NOT EXISTS idx_provisioning_tenant ON provisioning_queue(tenant_id);
    """

    try:
        cursor.execute(migration_sql)
        conn.commit()

        # Verify tables created
        cursor.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('tenants', 'users', 'tenant_memberships', 'documents',
                               'chat_sessions', 'chat_messages', 'ai_usage',
                               'monthly_usage_summary', 'provisioning_queue')
        """)
        created_tables = [row[0] for row in cursor.fetchall()]

        return {
            "success": True,
            "message": "Migration completed successfully",
            "tables_created": created_tables
        }

    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        cursor.close()
        conn.close()

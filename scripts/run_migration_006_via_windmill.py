#!/usr/bin/env python3
"""
Run migration 006 via Windmill (uses Windmill's database resource)
"""

import requests
import json
from config import WINDMILL_URL, WINDMILL_WORKSPACE as WORKSPACE, get_windmill_token

WINDMILL_TOKEN = get_windmill_token()

headers = {
    "Authorization": f"Bearer {WINDMILL_TOKEN}",
    "Content-Type": "application/json"
}

# The migration script to deploy and run
MIGRATION_SCRIPT = '''
import wmill
import psycopg2
from psycopg2.extras import RealDictCursor

def main():
    """Run migration 006: Tenant Branding & Theming"""

    pg_resource = wmill.get_resource("u/admin/my_postgres")

    conn = psycopg2.connect(
        host=pg_resource.get("host", "localhost"),
        port=pg_resource.get("port", 5432),
        dbname=pg_resource.get("dbname", "windmill"),
        user=pg_resource.get("user", "postgres"),
        password=pg_resource.get("password", ""),
        sslmode=pg_resource.get("sslmode", "prefer"),
    )

    results = []

    try:
        with conn.cursor() as cur:
            # Check if migration already applied
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'tenant_branding'
                )
            """)
            exists = cur.fetchone()[0]

            if exists:
                return {"status": "skipped", "message": "Migration already applied (tenant_branding table exists)"}

            # Create tenant_branding table
            cur.execute("""
                CREATE TABLE tenant_branding (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    brand_name TEXT,
                    logo_url TEXT,
                    logo_dark_url TEXT,
                    favicon_url TEXT,
                    primary_color TEXT DEFAULT '#3b82f6',
                    primary_foreground TEXT DEFAULT '#ffffff',
                    secondary_color TEXT DEFAULT '#64748b',
                    accent_color TEXT DEFAULT '#8b5cf6',
                    background_light TEXT DEFAULT '#ffffff',
                    background_dark TEXT DEFAULT '#0f172a',
                    success_color TEXT DEFAULT '#22c55e',
                    warning_color TEXT DEFAULT '#f59e0b',
                    error_color TEXT DEFAULT '#ef4444',
                    font_family TEXT,
                    font_heading TEXT,
                    border_radius TEXT DEFAULT '0.5rem',
                    sidebar_style TEXT DEFAULT 'default' CHECK (sidebar_style IN ('default', 'compact', 'minimal')),
                    custom_css TEXT,
                    show_powered_by BOOLEAN DEFAULT true,
                    custom_footer_text TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    updated_by UUID REFERENCES users(id),
                    CONSTRAINT unique_tenant_branding UNIQUE (tenant_id)
                )
            """)
            results.append("Created table: tenant_branding")

            # Create system_branding table
            cur.execute("""
                CREATE TABLE system_branding (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    key TEXT UNIQUE NOT NULL,
                    brand_name TEXT DEFAULT 'Family Second Brain',
                    logo_url TEXT,
                    logo_dark_url TEXT,
                    favicon_url TEXT,
                    primary_color TEXT DEFAULT '#3b82f6',
                    primary_foreground TEXT DEFAULT '#ffffff',
                    secondary_color TEXT DEFAULT '#64748b',
                    accent_color TEXT DEFAULT '#8b5cf6',
                    background_light TEXT DEFAULT '#ffffff',
                    background_dark TEXT DEFAULT '#0f172a',
                    success_color TEXT DEFAULT '#22c55e',
                    warning_color TEXT DEFAULT '#f59e0b',
                    error_color TEXT DEFAULT '#ef4444',
                    font_family TEXT,
                    font_heading TEXT,
                    border_radius TEXT DEFAULT '0.5rem',
                    custom_css TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """)
            results.append("Created table: system_branding")

            # Create theme_presets table
            cur.execute("""
                CREATE TABLE theme_presets (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name TEXT NOT NULL,
                    description TEXT,
                    primary_color TEXT NOT NULL,
                    primary_foreground TEXT NOT NULL,
                    secondary_color TEXT,
                    accent_color TEXT,
                    background_light TEXT,
                    background_dark TEXT,
                    preview_image_url TEXT,
                    sort_order INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)
            results.append("Created table: theme_presets")

            # Create indexes
            cur.execute("CREATE INDEX idx_tenant_branding_tenant ON tenant_branding(tenant_id)")
            results.append("Created index: idx_tenant_branding_tenant")

            # Insert default system branding
            cur.execute("""
                INSERT INTO system_branding (key, brand_name) VALUES
                    ('default', 'Family Second Brain'),
                    ('admin', 'FSB Admin')
            """)
            results.append("Inserted default system branding")

            # Insert theme presets
            cur.execute("""
                INSERT INTO theme_presets (name, description, primary_color, primary_foreground, secondary_color, accent_color, background_light, background_dark, sort_order) VALUES
                    ('Ocean Blue', 'Calm and professional blue theme', '#3b82f6', '#ffffff', '#64748b', '#06b6d4', '#ffffff', '#0f172a', 1),
                    ('Forest Green', 'Natural and earthy green theme', '#22c55e', '#ffffff', '#64748b', '#10b981', '#ffffff', '#14532d', 2),
                    ('Royal Purple', 'Elegant purple accents', '#8b5cf6', '#ffffff', '#64748b', '#a855f7', '#ffffff', '#1e1b4b', 3),
                    ('Sunset Orange', 'Warm and inviting orange theme', '#f97316', '#ffffff', '#64748b', '#fb923c', '#ffffff', '#431407', 4),
                    ('Rose Pink', 'Soft and friendly pink theme', '#ec4899', '#ffffff', '#64748b', '#f472b6', '#ffffff', '#500724', 5),
                    ('Slate Gray', 'Minimal and modern gray theme', '#475569', '#ffffff', '#64748b', '#94a3b8', '#ffffff', '#0f172a', 6)
            """)
            results.append("Inserted 6 theme presets")

            conn.commit()

            return {
                "status": "success",
                "message": "Migration completed successfully",
                "details": results
            }

    except Exception as e:
        conn.rollback()
        return {
            "status": "error",
            "message": str(e),
            "details": results
        }

    finally:
        conn.close()
'''


def run_migration():
    print("Running migration 006 via Windmill...")

    # Create a temporary script
    script_path = "f/chatbot/run_migration_006_branding"

    # Check if script exists and delete it first
    check_url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/get/p/{script_path}"
    response = requests.get(check_url, headers=headers)

    if response.status_code == 200:
        # Delete existing script
        existing = response.json()
        delete_url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/delete/h/{existing['hash']}"
        requests.delete(delete_url, headers=headers)
        print("Deleted existing migration script")

    # Create the migration script
    create_url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/scripts/create"
    payload = {
        "path": script_path,
        "summary": "Run migration 006: Tenant Branding",
        "description": "One-time migration script",
        "content": MIGRATION_SCRIPT,
        "language": "python3",
        "is_template": False,
        "schema": {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "type": "object",
            "properties": {},
            "required": []
        }
    }

    response = requests.post(create_url, headers=headers, json=payload)
    if response.status_code != 201:
        print(f"Failed to create migration script: {response.status_code} - {response.text}")
        return

    print("Created migration script")

    # Run the script
    run_url = f"{WINDMILL_URL}/api/w/{WORKSPACE}/jobs/run_wait_result/p/{script_path}"
    print("Running migration...")

    response = requests.post(run_url, headers=headers, json={})

    if response.status_code == 200:
        result = response.json()
        print(f"\nResult: {json.dumps(result, indent=2)}")
    else:
        print(f"Failed to run migration: {response.status_code} - {response.text}")


if __name__ == "__main__":
    run_migration()

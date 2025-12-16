"""
Apply a theme preset to a tenant.

Copies colors from a preset to the tenant's branding configuration.
"""

import os
import json
from typing import Optional
import wmill
import psycopg2
from psycopg2.extras import RealDictCursor


def main(tenant_id: str, preset_id: str, user_id: Optional[str] = None):
    """
    Apply a theme preset to a tenant's branding.

    Args:
        tenant_id: Tenant UUID
        preset_id: Theme preset UUID
        user_id: User making the change (for audit)

    Returns:
        dict: Updated branding configuration
    """
    if not tenant_id:
        return {"error": "tenant_id is required"}
    if not preset_id:
        return {"error": "preset_id is required"}

    pg_resource = wmill.get_resource("f/chatbot/postgres_db")

    conn = psycopg2.connect(
        host=pg_resource.get("host", "localhost"),
        port=pg_resource.get("port", 5432),
        dbname=pg_resource.get("dbname", "windmill"),
        user=pg_resource.get("user", "postgres"),
        password=pg_resource.get("password", ""),
        sslmode=pg_resource.get("sslmode", "prefer"),
    )

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verify tenant exists
            cur.execute("SELECT id, name FROM tenants WHERE id = %s", (tenant_id,))
            tenant = cur.fetchone()
            if not tenant:
                return {"error": f"Tenant not found: {tenant_id}"}

            # Get preset
            cur.execute("""
                SELECT * FROM theme_presets
                WHERE id = %s AND is_active = true
            """, (preset_id,))
            preset = cur.fetchone()
            if not preset:
                return {"error": f"Theme preset not found or inactive: {preset_id}"}

            # Apply preset to tenant branding
            cur.execute("""
                INSERT INTO tenant_branding (
                    tenant_id,
                    primary_color,
                    primary_foreground,
                    secondary_color,
                    accent_color,
                    background_light,
                    background_dark,
                    updated_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (tenant_id) DO UPDATE SET
                    primary_color = EXCLUDED.primary_color,
                    primary_foreground = EXCLUDED.primary_foreground,
                    secondary_color = EXCLUDED.secondary_color,
                    accent_color = EXCLUDED.accent_color,
                    background_light = EXCLUDED.background_light,
                    background_dark = EXCLUDED.background_dark,
                    updated_by = EXCLUDED.updated_by,
                    updated_at = NOW()
                RETURNING *
            """, (
                tenant_id,
                preset["primary_color"],
                preset["primary_foreground"],
                preset.get("secondary_color"),
                preset.get("accent_color"),
                preset.get("background_light"),
                preset.get("background_dark"),
                user_id,
            ))

            result = cur.fetchone()
            conn.commit()

            return {
                "success": True,
                "branding": dict(result),
                "preset_name": preset["name"],
                "message": f"Applied '{preset['name']}' theme to {tenant['name']}",
            }

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}

    finally:
        conn.close()


if __name__ == "__main__":
    print("Testing apply_theme_preset...")

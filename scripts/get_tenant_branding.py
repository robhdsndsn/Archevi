"""
Get tenant branding configuration.

Returns branding settings for a specific tenant, falling back to system defaults.
If no tenant_id provided, returns system default branding.
"""

import os
import json
from typing import Optional
import wmill
import psycopg2
from psycopg2.extras import RealDictCursor

# Default branding values
DEFAULT_BRANDING = {
    "brand_name": "Family Second Brain",
    "logo_url": None,
    "logo_dark_url": None,
    "favicon_url": None,
    "primary_color": "#3b82f6",
    "primary_foreground": "#ffffff",
    "secondary_color": "#64748b",
    "accent_color": "#8b5cf6",
    "background_light": "#ffffff",
    "background_dark": "#0f172a",
    "success_color": "#22c55e",
    "warning_color": "#f59e0b",
    "error_color": "#ef4444",
    "font_family": None,
    "font_heading": None,
    "border_radius": "0.5rem",
    "sidebar_style": "default",
    "custom_css": None,
    "show_powered_by": True,
    "custom_footer_text": None,
}


def main(tenant_id: Optional[str] = None):
    """
    Get branding configuration for a tenant.

    Args:
        tenant_id: Optional tenant UUID. If None, returns system default.

    Returns:
        dict: Branding configuration with all fields
    """
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
            # If no tenant_id, return system default
            if not tenant_id:
                cur.execute("""
                    SELECT * FROM system_branding WHERE key = 'default'
                """)
                row = cur.fetchone()
                if row:
                    return {**DEFAULT_BRANDING, **{k: v for k, v in dict(row).items() if v is not None and k != 'id' and k != 'key' and k != 'created_at' and k != 'updated_at'}}
                return DEFAULT_BRANDING

            # Get tenant info for fallback brand name
            cur.execute("""
                SELECT name FROM tenants WHERE id = %s
            """, (tenant_id,))
            tenant = cur.fetchone()

            if not tenant:
                return {"error": f"Tenant not found: {tenant_id}"}

            # Get tenant branding
            cur.execute("""
                SELECT * FROM tenant_branding WHERE tenant_id = %s
            """, (tenant_id,))
            branding = cur.fetchone()

            # Build result with defaults
            result = DEFAULT_BRANDING.copy()
            result["brand_name"] = tenant["name"]  # Use tenant name as default

            if branding:
                # Override with tenant-specific values
                for key, value in dict(branding).items():
                    if value is not None and key not in ('id', 'tenant_id', 'created_at', 'updated_at', 'updated_by'):
                        result[key] = value

            return result

    finally:
        conn.close()


if __name__ == "__main__":
    # Test with no tenant (system default)
    print("System default:", json.dumps(main(), indent=2))

"""
Update tenant branding configuration.

Allows admins and tenant owners to customize branding for their tenant.
"""

import os
import json
from typing import Optional
import wmill
import psycopg2
from psycopg2.extras import RealDictCursor


def main(
    tenant_id: str,
    brand_name: Optional[str] = None,
    logo_url: Optional[str] = None,
    logo_dark_url: Optional[str] = None,
    favicon_url: Optional[str] = None,
    primary_color: Optional[str] = None,
    primary_foreground: Optional[str] = None,
    secondary_color: Optional[str] = None,
    accent_color: Optional[str] = None,
    background_light: Optional[str] = None,
    background_dark: Optional[str] = None,
    success_color: Optional[str] = None,
    warning_color: Optional[str] = None,
    error_color: Optional[str] = None,
    font_family: Optional[str] = None,
    font_heading: Optional[str] = None,
    border_radius: Optional[str] = None,
    sidebar_style: Optional[str] = None,
    custom_css: Optional[str] = None,
    show_powered_by: Optional[bool] = None,
    custom_footer_text: Optional[str] = None,
    user_id: Optional[str] = None,
):
    """
    Update branding configuration for a tenant.

    Args:
        tenant_id: Tenant UUID (required)
        brand_name: Display name override
        logo_url: URL to logo image
        logo_dark_url: URL to dark mode logo
        favicon_url: URL to favicon
        primary_color: Primary brand color (hex)
        primary_foreground: Text color on primary (hex)
        secondary_color: Secondary color (hex)
        accent_color: Accent color (hex)
        background_light: Light mode background (hex)
        background_dark: Dark mode background (hex)
        success_color: Success state color (hex)
        warning_color: Warning state color (hex)
        error_color: Error state color (hex)
        font_family: Custom font family CSS value
        font_heading: Heading font family CSS value
        border_radius: Border radius CSS value
        sidebar_style: 'default', 'compact', or 'minimal'
        custom_css: Additional CSS overrides
        show_powered_by: Show "Powered by" footer
        custom_footer_text: Custom footer message
        user_id: User making the update (for audit)

    Returns:
        dict: Updated branding configuration
    """
    if not tenant_id:
        return {"error": "tenant_id is required"}

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

            # Build update fields
            fields = {}
            if brand_name is not None:
                fields["brand_name"] = brand_name
            if logo_url is not None:
                fields["logo_url"] = logo_url
            if logo_dark_url is not None:
                fields["logo_dark_url"] = logo_dark_url
            if favicon_url is not None:
                fields["favicon_url"] = favicon_url
            if primary_color is not None:
                fields["primary_color"] = primary_color
            if primary_foreground is not None:
                fields["primary_foreground"] = primary_foreground
            if secondary_color is not None:
                fields["secondary_color"] = secondary_color
            if accent_color is not None:
                fields["accent_color"] = accent_color
            if background_light is not None:
                fields["background_light"] = background_light
            if background_dark is not None:
                fields["background_dark"] = background_dark
            if success_color is not None:
                fields["success_color"] = success_color
            if warning_color is not None:
                fields["warning_color"] = warning_color
            if error_color is not None:
                fields["error_color"] = error_color
            if font_family is not None:
                fields["font_family"] = font_family
            if font_heading is not None:
                fields["font_heading"] = font_heading
            if border_radius is not None:
                fields["border_radius"] = border_radius
            if sidebar_style is not None:
                if sidebar_style not in ("default", "compact", "minimal"):
                    return {"error": f"Invalid sidebar_style: {sidebar_style}"}
                fields["sidebar_style"] = sidebar_style
            if custom_css is not None:
                fields["custom_css"] = custom_css
            if show_powered_by is not None:
                fields["show_powered_by"] = show_powered_by
            if custom_footer_text is not None:
                fields["custom_footer_text"] = custom_footer_text

            if not fields:
                return {"error": "No fields to update"}

            # Add user_id for audit
            if user_id:
                fields["updated_by"] = user_id

            # Upsert branding
            columns = list(fields.keys())
            values = list(fields.values())
            placeholders = ["%s"] * len(values)

            # Build ON CONFLICT update clause
            update_clause = ", ".join([f"{col} = EXCLUDED.{col}" for col in columns])

            cur.execute(f"""
                INSERT INTO tenant_branding (tenant_id, {', '.join(columns)})
                VALUES (%s, {', '.join(placeholders)})
                ON CONFLICT (tenant_id) DO UPDATE SET
                    {update_clause},
                    updated_at = NOW()
                RETURNING *
            """, [tenant_id] + values)

            result = cur.fetchone()
            conn.commit()

            return {
                "success": True,
                "branding": dict(result),
                "message": f"Branding updated for tenant: {tenant['name']}",
            }

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}

    finally:
        conn.close()


if __name__ == "__main__":
    # Test
    print("Testing update_tenant_branding...")

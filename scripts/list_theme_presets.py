"""
List available theme presets.

Returns all active theme presets that users can choose from.
"""

import os
import json
import wmill
import psycopg2
from psycopg2.extras import RealDictCursor


def main():
    """
    List all active theme presets.

    Returns:
        list: List of theme presets sorted by sort_order
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
            cur.execute("""
                SELECT
                    id,
                    name,
                    description,
                    primary_color,
                    primary_foreground,
                    secondary_color,
                    accent_color,
                    background_light,
                    background_dark,
                    preview_image_url,
                    sort_order
                FROM theme_presets
                WHERE is_active = true
                ORDER BY sort_order ASC, name ASC
            """)

            presets = [dict(row) for row in cur.fetchall()]
            return {"presets": presets, "count": len(presets)}

    finally:
        conn.close()


if __name__ == "__main__":
    print("Theme presets:", json.dumps(main(), indent=2))

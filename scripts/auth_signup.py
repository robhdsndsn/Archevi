#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - bcrypt

"""
User Signup Script
Creates a new user and provisions a tenant in one transaction.

Windmill Script Configuration:
- Path: f/chatbot/auth_signup
- Trigger: Called by marketing site signup form
"""

import wmill
from typing import Optional
import re
import secrets
import bcrypt


def generate_slug(name: str) -> str:
    """Generate URL-safe slug from family name."""
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    if len(slug) > 30:
        slug = slug[:30].rstrip('-')
    return slug


def main(
    email: str,
    password: str,
    family_name: str,
    owner_name: Optional[str] = None,
    plan: str = "trial",
) -> dict:
    """
    Create a new user and provision a tenant for them.

    Args:
        email: User's email address
        password: User's chosen password
        family_name: Display name for the family (e.g., "The Hudson Family")
        owner_name: Optional name for the user (defaults to email prefix)
        plan: Subscription plan (trial, starter, family, family_office)

    Returns:
        dict with success status, user_id, tenant_id, and login tokens
    """
    import psycopg2

    # Validate inputs
    if not email or not email.strip():
        return {"success": False, "error": "Email is required"}

    email = email.strip().lower()

    # Basic email validation
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        return {"success": False, "error": "Invalid email format"}

    if not password or len(password) < 8:
        return {"success": False, "error": "Password must be at least 8 characters"}

    if not family_name or not family_name.strip():
        return {"success": False, "error": "Family name is required"}

    family_name = family_name.strip()

    # Default owner name from email
    if not owner_name:
        owner_name = email.split('@')[0].replace('.', ' ').replace('_', ' ').title()

    # Get database connection
    try:
        db_resource = wmill.get_resource("u/admin/archevi_postgres")
        conn = psycopg2.connect(db_resource["connection_string"])
    except Exception:
        postgres_db = wmill.get_resource("f/chatbot/postgres_db")
        conn = psycopg2.connect(
            host=postgres_db["host"],
            port=postgres_db["port"],
            dbname=postgres_db["dbname"],
            user=postgres_db["user"],
            password=postgres_db["password"],
            sslmode=postgres_db.get("sslmode", "disable")
        )

    try:
        with conn.cursor() as cur:
            # Check if email already exists
            cur.execute("SELECT id FROM users WHERE email = %s", [email])
            if cur.fetchone():
                return {"success": False, "error": "An account with this email already exists"}

            # Hash password
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            # Create user
            cur.execute("""
                INSERT INTO users (email, name, password_hash, status)
                VALUES (%s, %s, %s, 'active')
                RETURNING id
            """, [email, owner_name, password_hash])
            user_id = cur.fetchone()[0]

            # Generate unique tenant slug
            slug = generate_slug(family_name)
            original_slug = slug
            counter = 1

            while True:
                cur.execute("SELECT id FROM tenants WHERE slug = %s", [slug])
                if not cur.fetchone():
                    break
                counter += 1
                slug = f"{original_slug}-{counter}"

            # Plan-specific limits
            plan_config = {
                "trial": {"ai_allowance": 3.00, "max_members": 5, "max_storage_gb": 10},
                "starter": {"ai_allowance": 3.00, "max_members": 5, "max_storage_gb": 10},
                "family": {"ai_allowance": 8.00, "max_members": 999, "max_storage_gb": 50},
                "family_office": {"ai_allowance": 999999.00, "max_members": 999, "max_storage_gb": 500},
            }
            config = plan_config.get(plan, plan_config["trial"])

            # Calculate trial end date
            trial_days = 14

            # Create tenant
            cur.execute("""
                INSERT INTO tenants (
                    name, slug, plan, trial_ends_at,
                    ai_allowance_usd, max_members, max_storage_gb,
                    created_by, status
                )
                VALUES (%s, %s, %s, NOW() + INTERVAL '14 days', %s, %s, %s, %s, 'active')
                RETURNING id
            """, [
                family_name, slug, plan,
                config["ai_allowance"], config["max_members"], config["max_storage_gb"],
                user_id
            ])
            tenant_id = cur.fetchone()[0]

            # Create owner membership
            cur.execute("""
                INSERT INTO tenant_memberships (
                    tenant_id, user_id, role, status, invite_accepted_at
                )
                VALUES (%s, %s, 'owner', 'active', NOW())
            """, [tenant_id, user_id])

            # Set as user's default tenant
            cur.execute("""
                UPDATE users
                SET default_tenant_id = %s
                WHERE id = %s
            """, [tenant_id, user_id])

            conn.commit()

            return {
                "success": True,
                "user_id": str(user_id),
                "tenant_id": str(tenant_id),
                "email": email,
                "name": owner_name,
                "family_name": family_name,
                "slug": slug,
                "plan": plan,
                "trial_days": trial_days if plan == "trial" else None,
                "message": f"Account created successfully. Welcome to Archevi!"
            }

    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}
    finally:
        conn.close()

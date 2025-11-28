"""
Tenant Provisioning Script
Handles the complete flow from signup to ready-to-use tenant.

Windmill Script Configuration:
- Path: f/tenant/provision_tenant
- Trigger: Called by signup flow or admin
"""

import wmill
from typing import Optional
import re
import secrets
import json


def generate_slug(name: str) -> str:
    """Generate URL-safe slug from family name."""
    # Remove special chars, lowercase, replace spaces with hyphens
    slug = re.sub(r'[^a-zA-Z0-9\s-]', '', name.lower())
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')

    # Truncate to reasonable length
    if len(slug) > 30:
        slug = slug[:30].rstrip('-')

    return slug


def ensure_unique_slug(db, slug: str) -> str:
    """Ensure slug is unique, append number if needed."""
    original_slug = slug
    counter = 1

    while True:
        result = db.query(
            "SELECT id FROM tenants WHERE slug = %s",
            [slug]
        )
        if not result:
            return slug

        counter += 1
        slug = f"{original_slug}-{counter}"


def main(
    user_id: str,
    family_name: str,
    plan: str = "trial",
    stripe_token: Optional[str] = None
) -> dict:
    """
    Provision a new tenant for a user.

    Args:
        user_id: UUID of the user creating the tenant
        family_name: Display name for the family (e.g., "The Hudson Family")
        plan: Subscription plan (trial, starter, family, family_office)
        stripe_token: Optional Stripe payment token for paid plans

    Returns:
        dict with tenant_id, slug, and provisioning status
    """

    # Get database connection
    db_resource = wmill.get_resource("u/admin/archevi_postgres")
    import psycopg2
    conn = psycopg2.connect(db_resource["connection_string"])

    try:
        with conn.cursor() as cur:
            # Verify user exists
            cur.execute("SELECT id, email FROM users WHERE id = %s", [user_id])
            user = cur.fetchone()
            if not user:
                raise ValueError(f"User {user_id} not found")

            user_email = user[1]

            # Generate unique slug
            slug = generate_slug(family_name)
            slug = ensure_unique_slug(cur, slug)

            # Set plan-specific limits
            plan_config = {
                "trial": {"ai_allowance": 3.00, "max_members": 5, "max_storage_gb": 10},
                "starter": {"ai_allowance": 3.00, "max_members": 5, "max_storage_gb": 10},
                "family": {"ai_allowance": 8.00, "max_members": 999, "max_storage_gb": 50},
                "family_office": {"ai_allowance": 999999.00, "max_members": 999, "max_storage_gb": 500},
            }
            config = plan_config.get(plan, plan_config["trial"])

            # Calculate trial end date
            trial_days = 14
            trial_end = f"NOW() + INTERVAL '{trial_days} days'" if plan == "trial" else "NULL"

            # Create tenant
            cur.execute(f"""
                INSERT INTO tenants (
                    name, slug, plan, trial_ends_at,
                    ai_allowance_usd, max_members, max_storage_gb,
                    created_by, status
                )
                VALUES (%s, %s, %s, {trial_end}, %s, %s, %s, %s, 'active')
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

            # Set as user's default tenant if they don't have one
            cur.execute("""
                UPDATE users
                SET default_tenant_id = %s
                WHERE id = %s AND default_tenant_id IS NULL
            """, [tenant_id, user_id])

            # Queue provisioning tasks
            provisioning_tasks = [
                ("configure_subdomain", {"slug": slug}),
                ("send_welcome_email", {"user_id": user_id, "email": user_email, "family_name": family_name}),
            ]

            # Add Stripe setup for paid plans
            if plan != "trial" and stripe_token:
                provisioning_tasks.insert(0, ("setup_stripe", {
                    "plan": plan,
                    "stripe_token": stripe_token,
                    "email": user_email
                }))

            for step, metadata in provisioning_tasks:
                cur.execute("""
                    INSERT INTO provisioning_queue (tenant_id, step, metadata)
                    VALUES (%s, %s, %s)
                """, [tenant_id, step, json.dumps(metadata)])

            conn.commit()

            return {
                "success": True,
                "tenant_id": str(tenant_id),
                "slug": slug,
                "subdomain": f"{slug}.archevi.ca",
                "plan": plan,
                "trial_days": trial_days if plan == "trial" else None,
                "message": f"Tenant '{family_name}' created successfully"
            }

    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

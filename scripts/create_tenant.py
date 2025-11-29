# create_tenant.py
# Windmill Python script for creating a new tenant (admin only)
# Path: f/admin/create_tenant
#
# requirements:
#   - psycopg2-binary
#   - wmill
#   - bcrypt

"""
Create a new tenant with an owner account.

This admin-only endpoint creates a new tenant (family/organization)
and sets up the initial owner user.

Args:
    name: Tenant name (e.g., "The Hudson Family")
    slug: URL slug (e.g., "hudson")
    plan: Plan type (starter, family, family_office, trial)
    owner_email: Email for the owner account
    owner_name: Name of the owner
    ai_allowance_usd: Optional AI budget override
    max_members: Optional max members override
    max_storage_gb: Optional storage limit override

Returns:
    dict: Success status and tenant ID
"""

import psycopg2
import uuid
from datetime import datetime
from typing import TypedDict
import wmill


class CreateTenantResult(TypedDict):
    success: bool
    tenant_id: str | None
    slug: str | None
    message: str | None
    error: str | None


# Plan defaults
PLAN_DEFAULTS = {
    'starter': {'ai_allowance_usd': 3.00, 'max_members': 5, 'max_storage_gb': 10},
    'family': {'ai_allowance_usd': 8.00, 'max_members': 10, 'max_storage_gb': 50},
    'family_office': {'ai_allowance_usd': 50.00, 'max_members': 100, 'max_storage_gb': 500},
    'trial': {'ai_allowance_usd': 3.00, 'max_members': 5, 'max_storage_gb': 10},
}


def main(
    name: str,
    slug: str,
    plan: str,
    owner_email: str,
    owner_name: str,
    ai_allowance_usd: float | None = None,
    max_members: int | None = None,
    max_storage_gb: int | None = None,
) -> CreateTenantResult:
    """Create a new tenant with an owner account."""

    # Validate required fields
    if not name or not slug or not owner_email or not owner_name:
        return {
            "success": False,
            "tenant_id": None,
            "slug": None,
            "message": None,
            "error": "Missing required fields: name, slug, owner_email, owner_name"
        }

    # Validate plan
    if plan not in PLAN_DEFAULTS:
        return {
            "success": False,
            "tenant_id": None,
            "slug": None,
            "message": None,
            "error": f"Invalid plan: {plan}. Must be one of: starter, family, family_office, trial"
        }

    # Normalize slug
    slug = slug.lower().strip().replace(' ', '-')

    # Get plan defaults
    defaults = PLAN_DEFAULTS[plan]
    final_ai_allowance = ai_allowance_usd if ai_allowance_usd is not None else defaults['ai_allowance_usd']
    final_max_members = max_members if max_members is not None else defaults['max_members']
    final_max_storage = max_storage_gb if max_storage_gb is not None else defaults['max_storage_gb']

    postgres_db = wmill.get_resource("f/chatbot/postgres_db")

    conn = psycopg2.connect(
        host=postgres_db['host'],
        port=postgres_db['port'],
        dbname=postgres_db['dbname'],
        user=postgres_db['user'],
        password=postgres_db['password'],
        sslmode=postgres_db.get('sslmode', 'disable')
    )
    cursor = conn.cursor()

    try:
        # Check if slug already exists
        cursor.execute("SELECT id FROM tenants WHERE slug = %s", (slug,))
        if cursor.fetchone():
            conn.close()
            return {
                "success": False,
                "tenant_id": None,
                "slug": None,
                "message": None,
                "error": f"A tenant with slug '{slug}' already exists"
            }

        # Check if owner email already exists
        cursor.execute("SELECT id FROM users WHERE email = %s", (owner_email.lower(),))
        existing_user = cursor.fetchone()

        # Generate tenant ID
        tenant_id = str(uuid.uuid4())
        now = datetime.utcnow()

        # Create tenant
        cursor.execute("""
            INSERT INTO tenants (
                id, name, slug, plan, status,
                ai_allowance_usd, max_members, max_storage_gb,
                api_mode, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, 'active',
                %s, %s, %s,
                'managed', %s, %s
            )
        """, (
            tenant_id, name, slug, plan,
            final_ai_allowance, final_max_members, final_max_storage,
            now, now
        ))

        # Create or link owner user
        if existing_user:
            user_id = existing_user[0]
        else:
            user_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO users (
                    id, email, name, is_active, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, true, %s, %s
                )
            """, (user_id, owner_email.lower(), owner_name, now, now))

        # Create tenant membership with owner role
        cursor.execute("""
            INSERT INTO tenant_memberships (
                tenant_id, user_id, role, status, joined_at
            ) VALUES (
                %s, %s, 'owner', 'active', %s
            )
        """, (tenant_id, user_id, now))

        conn.commit()
        cursor.close()
        conn.close()

        return {
            "success": True,
            "tenant_id": tenant_id,
            "slug": slug,
            "message": f"Tenant '{name}' created successfully with owner {owner_email}",
            "error": None
        }

    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return {
            "success": False,
            "tenant_id": None,
            "slug": None,
            "message": None,
            "error": str(e)
        }

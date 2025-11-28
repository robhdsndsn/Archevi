"""
Invite User to Tenant
Creates an invitation for a user to join a family.

Windmill Script Configuration:
- Path: f/tenant/invite_to_tenant
- Trigger: Called from Family Members UI
"""

import wmill
import secrets
from datetime import datetime, timedelta


def main(
    inviter_user_id: str,
    tenant_id: str,
    invitee_email: str,
    role: str = "member"
) -> dict:
    """
    Invite a user to join a tenant (family).

    Args:
        inviter_user_id: UUID of the user sending the invite
        tenant_id: UUID of the tenant to invite to
        invitee_email: Email address of the person being invited
        role: Role to assign (member, admin, viewer)

    Returns:
        dict with invite token and status
    """

    if role not in ["member", "admin", "viewer"]:
        return {"success": False, "error": "Invalid role"}

    db_resource = wmill.get_resource("u/admin/archevi_postgres")
    import psycopg2
    import psycopg2.extras

    conn = psycopg2.connect(db_resource["connection_string"])

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            # Verify inviter has permission (must be owner or admin)
            cur.execute("""
                SELECT tm.role, t.name as tenant_name, t.slug, u.name as inviter_name
                FROM tenant_memberships tm
                JOIN tenants t ON tm.tenant_id = t.id
                JOIN users u ON tm.user_id = u.id
                WHERE tm.user_id = %s
                  AND tm.tenant_id = %s
                  AND tm.status = 'active'
                  AND tm.role IN ('owner', 'admin')
            """, [inviter_user_id, tenant_id])

            inviter = cur.fetchone()
            if not inviter:
                return {
                    "success": False,
                    "error": "You don't have permission to invite members"
                }

            # Check if user already has access
            cur.execute("""
                SELECT u.id, tm.status
                FROM users u
                LEFT JOIN tenant_memberships tm ON u.id = tm.user_id AND tm.tenant_id = %s
                WHERE u.email = %s
            """, [tenant_id, invitee_email])

            existing = cur.fetchone()

            if existing and existing["status"] == "active":
                return {
                    "success": False,
                    "error": "This user is already a member"
                }

            # Generate invite token
            invite_token = secrets.token_urlsafe(32)
            invite_expires = datetime.utcnow() + timedelta(days=7)

            if existing:
                # User exists, create/update membership
                cur.execute("""
                    INSERT INTO tenant_memberships (
                        tenant_id, user_id, role, status,
                        invited_by, invite_token, invite_expires
                    )
                    VALUES (%s, %s, %s, 'pending', %s, %s, %s)
                    ON CONFLICT (tenant_id, user_id) DO UPDATE
                    SET role = EXCLUDED.role,
                        status = 'pending',
                        invited_by = EXCLUDED.invited_by,
                        invite_token = EXCLUDED.invite_token,
                        invite_expires = EXCLUDED.invite_expires,
                        updated_at = NOW()
                    RETURNING id
                """, [tenant_id, existing["id"], role, inviter_user_id, invite_token, invite_expires])
            else:
                # User doesn't exist, create pending membership (user_id will be linked on signup)
                # For now, we'll need to handle this case differently - store email in metadata
                cur.execute("""
                    INSERT INTO tenant_memberships (
                        tenant_id, user_id, role, status,
                        invited_by, invite_token, invite_expires
                    )
                    SELECT %s, NULL, %s, 'pending', %s, %s, %s
                    WHERE NOT EXISTS (
                        SELECT 1 FROM tenant_memberships
                        WHERE tenant_id = %s AND invite_token = %s
                    )
                    RETURNING id
                """, [tenant_id, role, inviter_user_id, invite_token, invite_expires, tenant_id, invite_token])

            conn.commit()

            # Send invite email
            try:
                import resend
                resend.api_key = wmill.get_variable("u/admin/resend_api_key")

                invite_url = f"https://archevi.ca/invite?token={invite_token}"

                resend.Emails.send({
                    "from": "Archevi <hello@archevi.ca>",
                    "to": invitee_email,
                    "subject": f"You're invited to join {inviter['tenant_name']} on Archevi",
                    "html": f"""
                    <h1>You've been invited!</h1>

                    <p><strong>{inviter['inviter_name']}</strong> has invited you to join
                    <strong>{inviter['tenant_name']}</strong> on Archevi.</p>

                    <p>Archevi is a private, AI-powered family knowledge base where families
                    organize and search their important documents.</p>

                    <p><a href="{invite_url}" style="background:#000;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">
                        Accept Invitation
                    </a></p>

                    <p>This invitation expires in 7 days.</p>

                    <p>Questions? Just reply to this email.</p>
                    """
                })
                email_sent = True
            except Exception as e:
                email_sent = False

            return {
                "success": True,
                "inviteToken": invite_token,
                "inviteUrl": f"https://archevi.ca/invite?token={invite_token}",
                "expiresAt": invite_expires.isoformat(),
                "emailSent": email_sent,
                "message": f"Invitation sent to {invitee_email}"
            }

    except Exception as e:
        conn.rollback()
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        conn.close()

#
# requirements:
#   - resend
#   - wmill

"""
Centralized Email Service for Archevi
=====================================

This module provides a unified email service for all transactional emails.
It centralizes Resend configuration, email templates, and sending logic.

Usage:
    from email_service import EmailService

    email = EmailService()
    email.send_welcome(to="user@example.com", family_name="The Hudsons")
    email.send_tenant_invite(to="new@example.com", inviter_name="Rob", tenant_name="The Hudsons", invite_url="...")
    email.send_password_reset(to="user@example.com", reset_url="...")
    email.send_expiry_notification(to="user@example.com", recipient_name="Rob", urgent_docs=[...], soon_docs=[...])

Windmill Script Configuration:
- Path: f/chatbot/email_service
- This is a library module, not a standalone script
"""

from typing import Optional, TypedDict
import os
import wmill


class EmailResult(TypedDict):
    success: bool
    email_id: Optional[str]
    error: Optional[str]


# Brand configuration - now uses environment variables with sensible defaults
BRAND_CONFIG = {
    "from_email": os.getenv("BRAND_FROM_EMAIL", "Archevi <hello@archevi.ca>"),
    "reply_to": os.getenv("BRAND_REPLY_TO", "support@archevi.ca"),
    "logo_url": os.getenv("BRAND_LOGO_URL", "https://archevi.ca/logo.png"),
    "app_url": os.getenv("APP_URL", "https://app.archevi.ca"),
    "marketing_url": os.getenv("MARKETING_URL", "https://archevi.ca"),
    "docs_url": os.getenv("DOCS_URL", "https://docs.archevi.ca"),
    "primary_color": "#3b82f6",  # Blue-500
    "text_color": "#111827",     # Gray-900
    "muted_color": "#6b7280",    # Gray-500
}


class EmailService:
    """Centralized email service using Resend."""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the email service.

        Args:
            api_key: Resend API key. If not provided, fetches from Windmill.
        """
        import resend

        if api_key:
            resend.api_key = api_key
        else:
            resend.api_key = wmill.get_variable("u/admin/resend_api_key")

        self.resend = resend

    def _base_template(self, content: str, footer_text: str = "") -> str:
        """Wrap content in the base email template."""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Archevi</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                     line-height: 1.6; color: {BRAND_CONFIG['text_color']}; background-color: #f9fafb;
                     margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: {BRAND_CONFIG['primary_color']}; font-size: 28px; font-weight: 700; margin: 0;">
                        Archevi
                    </h1>
                    <p style="color: {BRAND_CONFIG['muted_color']}; font-size: 14px; margin: 8px 0 0 0;">
                        Your family's AI-powered knowledge vault
                    </p>
                </div>

                <!-- Content -->
                <div style="background: #ffffff; border-radius: 12px; padding: 32px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    {content}
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 32px;">
                    <p style="color: {BRAND_CONFIG['muted_color']}; font-size: 12px; margin: 0;">
                        {footer_text if footer_text else f"<a href='{BRAND_CONFIG['marketing_url']}' style='color: {BRAND_CONFIG['muted_color']};'>archevi.ca</a> - Canadian-hosted. PIPEDA compliant."}
                    </p>
                    <p style="color: {BRAND_CONFIG['muted_color']}; font-size: 11px; margin: 8px 0 0 0;">
                        &copy; 2025 Archevi. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

    def _send(
        self,
        to: str,
        subject: str,
        html: str,
        reply_to: Optional[str] = None
    ) -> EmailResult:
        """
        Send an email via Resend.

        Args:
            to: Recipient email address
            subject: Email subject
            html: HTML content
            reply_to: Reply-to address (defaults to support@archevi.ca)

        Returns:
            EmailResult with success status and email_id or error
        """
        try:
            response = self.resend.Emails.send({
                "from": BRAND_CONFIG["from_email"],
                "to": to,
                "subject": subject,
                "html": html,
                "reply_to": reply_to or BRAND_CONFIG["reply_to"],
            })

            return {
                "success": True,
                "email_id": response.get("id"),
                "error": None
            }
        except Exception as e:
            return {
                "success": False,
                "email_id": None,
                "error": str(e)
            }

    # =========================================================================
    # Welcome Email
    # =========================================================================

    def send_welcome(
        self,
        to: str,
        family_name: str,
        owner_name: Optional[str] = None
    ) -> EmailResult:
        """
        Send welcome email to new tenant owner.

        Args:
            to: Recipient email address
            family_name: Name of the family/tenant
            owner_name: Name of the owner (optional, for personalization)
        """
        greeting = f"Hi {owner_name}," if owner_name else "Hi there,"

        content = f"""
        <h2 style="color: {BRAND_CONFIG['text_color']}; margin: 0 0 16px 0;">
            Welcome to Archevi!
        </h2>

        <p>{greeting}</p>

        <p>Your family knowledge base <strong>{family_name}</strong> is now ready to use.</p>

        <h3 style="color: {BRAND_CONFIG['text_color']}; font-size: 16px; margin: 24px 0 12px 0;">
            Getting Started
        </h3>

        <ol style="padding-left: 20px; margin: 0;">
            <li style="margin-bottom: 8px;"><strong>Add your first document</strong> - Upload a PDF, paste text, or record a voice note</li>
            <li style="margin-bottom: 8px;"><strong>Ask a question</strong> - Try "What documents do I have?" to see AI-powered search in action</li>
            <li style="margin-bottom: 8px;"><strong>Invite family members</strong> - Share access with your family from Settings</li>
        </ol>

        <p style="margin-top: 24px;">
            <a href="{BRAND_CONFIG['docs_url']}/guide/"
               style="color: {BRAND_CONFIG['primary_color']}; text-decoration: none;">
                Read our Getting Started guide &rarr;
            </a>
        </p>

        <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; font-size: 14px;">
                <strong>Your Plan</strong><br>
                You're on a <strong>14-day free trial</strong> with full access to all features.
            </p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
            <a href="{BRAND_CONFIG['app_url']}"
               style="background: {BRAND_CONFIG['primary_color']}; color: #ffffff;
                      padding: 12px 32px; text-decoration: none; border-radius: 8px;
                      display: inline-block; font-weight: 600;">
                Open Archevi
            </a>
        </div>

        <p style="color: {BRAND_CONFIG['muted_color']}; font-size: 14px; margin-top: 24px;">
            Questions? Just reply to this email - we're here to help.
        </p>
        """

        return self._send(
            to=to,
            subject=f"Welcome to Archevi - {family_name} is ready!",
            html=self._base_template(content)
        )

    # =========================================================================
    # Tenant Invitation Email
    # =========================================================================

    def send_tenant_invite(
        self,
        to: str,
        inviter_name: str,
        tenant_name: str,
        invite_url: str,
        role: str = "member"
    ) -> EmailResult:
        """
        Send invitation to join a tenant/family.

        Args:
            to: Recipient email address
            inviter_name: Name of the person sending the invite
            tenant_name: Name of the tenant/family
            invite_url: URL to accept the invitation
            role: Role being offered (member, admin, viewer)
        """
        role_description = {
            "owner": "full control over",
            "admin": "manage",
            "member": "contribute to",
            "viewer": "view documents in"
        }.get(role, "access")

        content = f"""
        <h2 style="color: {BRAND_CONFIG['text_color']}; margin: 0 0 16px 0;">
            You're Invited!
        </h2>

        <p><strong>{inviter_name}</strong> has invited you to {role_description} <strong>{tenant_name}</strong> on Archevi.</p>

        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px 0;"><strong>What is Archevi?</strong></p>
            <p style="margin: 0; color: {BRAND_CONFIG['muted_color']}; font-size: 14px;">
                Archevi is your family's private, AI-powered knowledge base. Store important documents,
                search with natural language, and never lose track of renewals or expiry dates.
            </p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
            <a href="{invite_url}"
               style="background: {BRAND_CONFIG['primary_color']}; color: #ffffff;
                      padding: 14px 40px; text-decoration: none; border-radius: 8px;
                      display: inline-block; font-weight: 600; font-size: 16px;">
                Accept Invitation
            </a>
        </div>

        <p style="color: {BRAND_CONFIG['muted_color']}; font-size: 13px; text-align: center;">
            This invitation expires in 7 days.
        </p>
        """

        footer = f"If you didn't expect this invitation, you can safely ignore this email."

        return self._send(
            to=to,
            subject=f"You're invited to join {tenant_name} on Archevi",
            html=self._base_template(content, footer)
        )

    # =========================================================================
    # Family Member Invitation Email
    # =========================================================================

    def send_family_invite(
        self,
        to: str,
        member_name: str,
        invite_url: str
    ) -> EmailResult:
        """
        Send invitation to a family member to set up their account.

        Args:
            to: Recipient email address
            member_name: Name of the person being invited
            invite_url: URL to accept the invitation and set password
        """
        content = f"""
        <h2 style="color: {BRAND_CONFIG['text_color']}; margin: 0 0 16px 0;">
            You're Invited!
        </h2>

        <p>Hi {member_name},</p>

        <p>You've been invited to join <strong>Archevi</strong> - your family's private, AI-powered knowledge base.</p>

        <p>Click the button below to set your password and get started:</p>

        <div style="text-align: center; margin: 32px 0;">
            <a href="{invite_url}"
               style="background: {BRAND_CONFIG['primary_color']}; color: #ffffff;
                      padding: 14px 40px; text-decoration: none; border-radius: 8px;
                      display: inline-block; font-weight: 600; font-size: 16px;">
                Accept Invitation
            </a>
        </div>

        <p style="color: {BRAND_CONFIG['muted_color']}; font-size: 13px; text-align: center;">
            This invitation expires in 7 days.
        </p>
        """

        footer = f"If you didn't expect this invitation, you can safely ignore this email."

        return self._send(
            to=to,
            subject="You're invited to join Archevi",
            html=self._base_template(content, footer)
        )

    # =========================================================================
    # Password Reset Email
    # =========================================================================

    def send_password_reset(
        self,
        to: str,
        reset_url: str,
        user_name: Optional[str] = None
    ) -> EmailResult:
        """
        Send password reset email.

        Args:
            to: Recipient email address
            reset_url: URL to reset password
            user_name: Name of the user (optional)
        """
        greeting = f"Hi {user_name}," if user_name else "Hi,"

        content = f"""
        <h2 style="color: {BRAND_CONFIG['text_color']}; margin: 0 0 16px 0;">
            Reset Your Password
        </h2>

        <p>{greeting}</p>

        <p>We received a request to reset your Archevi password. Click the button below to choose a new password:</p>

        <div style="text-align: center; margin: 32px 0;">
            <a href="{reset_url}"
               style="background: {BRAND_CONFIG['primary_color']}; color: #ffffff;
                      padding: 14px 40px; text-decoration: none; border-radius: 8px;
                      display: inline-block; font-weight: 600; font-size: 16px;">
                Reset Password
            </a>
        </div>

        <p style="color: {BRAND_CONFIG['muted_color']}; font-size: 13px; text-align: center;">
            This link expires in 1 hour.
        </p>

        <div style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 24px;">
            <p style="color: {BRAND_CONFIG['muted_color']}; font-size: 13px; margin: 0;">
                If you didn't request a password reset, you can safely ignore this email.
                Your password will remain unchanged.
            </p>
        </div>
        """

        return self._send(
            to=to,
            subject="Reset your Archevi password",
            html=self._base_template(content)
        )

    # =========================================================================
    # Email Verification
    # =========================================================================

    def send_email_verification(
        self,
        to: str,
        verification_url: str,
        user_name: Optional[str] = None
    ) -> EmailResult:
        """
        Send email verification email.

        Args:
            to: Recipient email address
            verification_url: URL to verify email
            user_name: Name of the user (optional)
        """
        greeting = f"Hi {user_name}," if user_name else "Hi,"

        content = f"""
        <h2 style="color: {BRAND_CONFIG['text_color']}; margin: 0 0 16px 0;">
            Verify Your Email
        </h2>

        <p>{greeting}</p>

        <p>Please verify your email address to complete your Archevi account setup:</p>

        <div style="text-align: center; margin: 32px 0;">
            <a href="{verification_url}"
               style="background: {BRAND_CONFIG['primary_color']}; color: #ffffff;
                      padding: 14px 40px; text-decoration: none; border-radius: 8px;
                      display: inline-block; font-weight: 600; font-size: 16px;">
                Verify Email
            </a>
        </div>

        <p style="color: {BRAND_CONFIG['muted_color']}; font-size: 13px; text-align: center;">
            This link expires in 24 hours.
        </p>
        """

        footer = "If you didn't create an Archevi account, you can safely ignore this email."

        return self._send(
            to=to,
            subject="Verify your Archevi email",
            html=self._base_template(content, footer)
        )

    # =========================================================================
    # Document Expiry Notification
    # =========================================================================

    def send_expiry_notification(
        self,
        to: str,
        recipient_name: str,
        urgent_docs: list,
        soon_docs: list
    ) -> EmailResult:
        """
        Send document expiry notification.

        Args:
            to: Recipient email address
            recipient_name: Name of the recipient
            urgent_docs: List of docs expiring within 7 days
                         Each: {"title": str, "expiry_date": str, "expiry_type": str, "days_until": int}
            soon_docs: List of docs expiring within 30 days (same format)
        """
        urgent_html = ""
        if urgent_docs:
            urgent_items = ""
            for doc in urgent_docs:
                days = doc.get("days_until", 0)
                days_text = "today" if days == 0 else f"in {days} day{'s' if days != 1 else ''}"
                expiry_type = self._format_expiry_type(doc.get("expiry_type", ""))

                urgent_items += f"""
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #fecaca;">
                        <strong>{doc['title']}</strong>
                        <div style="font-size: 13px; color: #991b1b; margin-top: 4px;">
                            {expiry_type} expires {days_text}
                        </div>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #fecaca; text-align: right;
                               color: #dc2626; font-weight: 600; white-space: nowrap;">
                        {doc['expiry_date']}
                    </td>
                </tr>
                """

            urgent_html = f"""
            <div style="margin-bottom: 24px;">
                <h3 style="color: #dc2626; font-size: 16px; margin: 0 0 12px 0;">
                    Urgent - Expiring Within 7 Days
                </h3>
                <table style="width: 100%; border-collapse: collapse; background: #fef2f2;
                              border-radius: 8px; overflow: hidden;">
                    <tbody>
                        {urgent_items}
                    </tbody>
                </table>
            </div>
            """

        soon_html = ""
        if soon_docs:
            soon_items = ""
            for doc in soon_docs:
                days = doc.get("days_until", 0)
                expiry_type = self._format_expiry_type(doc.get("expiry_type", ""))

                soon_items += f"""
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #fde68a;">
                        <strong>{doc['title']}</strong>
                        <div style="font-size: 13px; color: #92400e; margin-top: 4px;">
                            {expiry_type} expires in {days} days
                        </div>
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #fde68a; text-align: right;
                               color: #d97706; font-weight: 600; white-space: nowrap;">
                        {doc['expiry_date']}
                    </td>
                </tr>
                """

            soon_html = f"""
            <div style="margin-bottom: 24px;">
                <h3 style="color: #d97706; font-size: 16px; margin: 0 0 12px 0;">
                    Expiring This Month
                </h3>
                <table style="width: 100%; border-collapse: collapse; background: #fffbeb;
                              border-radius: 8px; overflow: hidden;">
                    <tbody>
                        {soon_items}
                    </tbody>
                </table>
            </div>
            """

        content = f"""
        <h2 style="color: {BRAND_CONFIG['text_color']}; margin: 0 0 16px 0;">
            Document Expiry Reminder
        </h2>

        <p>Hi {recipient_name},</p>

        <p>This is a reminder about documents in your family vault that are expiring soon:</p>

        {urgent_html}
        {soon_html}

        <div style="text-align: center; margin-top: 24px;">
            <a href="{BRAND_CONFIG['app_url']}"
               style="background: {BRAND_CONFIG['primary_color']}; color: #ffffff;
                      padding: 12px 32px; text-decoration: none; border-radius: 8px;
                      display: inline-block; font-weight: 600;">
                View in Archevi
            </a>
        </div>
        """

        footer = f"You're receiving this because you're an admin of your family vault. <a href='{BRAND_CONFIG['app_url']}/settings' style='color: {BRAND_CONFIG['muted_color']};'>Manage notification preferences</a>"

        # Build subject
        urgent_count = len(urgent_docs)
        soon_count = len(soon_docs)
        if urgent_count > 0 and soon_count > 0:
            subject = f"[Archevi] {urgent_count} document{'s' if urgent_count != 1 else ''} expiring soon + weekly digest"
        elif urgent_count > 0:
            subject = f"[Archevi] {urgent_count} document{'s' if urgent_count != 1 else ''} expiring within 7 days"
        elif soon_count > 0:
            subject = f"[Archevi] Weekly digest: {soon_count} document{'s' if soon_count != 1 else ''} expiring this month"
        else:
            subject = "[Archevi] Document expiry notification"

        return self._send(
            to=to,
            subject=subject,
            html=self._base_template(content, footer)
        )

    def _format_expiry_type(self, expiry_type: str) -> str:
        """Format expiry type for display."""
        type_map = {
            "expiry_date": "Document",
            "renewal_date": "Renewal",
            "due_date": "Due date",
            "policy_expiry": "Policy",
            "license_expiry": "License",
            "subscription_renewal": "Subscription",
            "warranty_expiry": "Warranty",
            "contract_end": "Contract"
        }
        return type_map.get(expiry_type, expiry_type.replace("_", " ").title())

    # =========================================================================
    # Two-Factor Authentication Code
    # =========================================================================

    def send_2fa_backup_codes(
        self,
        to: str,
        backup_codes: list,
        user_name: Optional[str] = None
    ) -> EmailResult:
        """
        Send 2FA backup codes to user.

        Args:
            to: Recipient email address
            backup_codes: List of backup codes
            user_name: Name of the user (optional)
        """
        greeting = f"Hi {user_name}," if user_name else "Hi,"

        codes_html = "".join([
            f'<code style="display: inline-block; background: #f3f4f6; padding: 4px 8px; margin: 4px; border-radius: 4px; font-family: monospace;">{code}</code>'
            for code in backup_codes
        ])

        content = f"""
        <h2 style="color: {BRAND_CONFIG['text_color']}; margin: 0 0 16px 0;">
            Your 2FA Backup Codes
        </h2>

        <p>{greeting}</p>

        <p>You've enabled two-factor authentication on your Archevi account. Here are your backup codes:</p>

        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
            {codes_html}
        </div>

        <div style="background: #fef2f2; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
                <strong>Important:</strong> Store these codes in a safe place. Each code can only be used once.
                If you lose access to your authenticator app, you'll need these codes to log in.
            </p>
        </div>

        <p style="color: {BRAND_CONFIG['muted_color']}; font-size: 13px;">
            If you didn't enable 2FA, please contact support immediately.
        </p>
        """

        return self._send(
            to=to,
            subject="Your Archevi 2FA Backup Codes",
            html=self._base_template(content)
        )


# =========================================================================
# Standalone function for Windmill direct calls
# =========================================================================

def main(
    email_type: str,
    to: str,
    **kwargs
) -> dict:
    """
    Send an email of the specified type.

    Windmill Entry Point - allows calling email service directly from Windmill.

    Args:
        email_type: Type of email to send:
            - "welcome"
            - "tenant_invite"
            - "family_invite"
            - "password_reset"
            - "email_verification"
            - "expiry_notification"
            - "2fa_backup_codes"
        to: Recipient email address
        **kwargs: Additional arguments specific to email type

    Returns:
        dict with success status and email_id or error
    """
    service = EmailService()

    handlers = {
        "welcome": lambda: service.send_welcome(
            to=to,
            family_name=kwargs.get("family_name", "Your Family"),
            owner_name=kwargs.get("owner_name")
        ),
        "tenant_invite": lambda: service.send_tenant_invite(
            to=to,
            inviter_name=kwargs.get("inviter_name", "Someone"),
            tenant_name=kwargs.get("tenant_name", "a family"),
            invite_url=kwargs.get("invite_url", ""),
            role=kwargs.get("role", "member")
        ),
        "family_invite": lambda: service.send_family_invite(
            to=to,
            member_name=kwargs.get("member_name", "there"),
            invite_url=kwargs.get("invite_url", "")
        ),
        "password_reset": lambda: service.send_password_reset(
            to=to,
            reset_url=kwargs.get("reset_url", ""),
            user_name=kwargs.get("user_name")
        ),
        "email_verification": lambda: service.send_email_verification(
            to=to,
            verification_url=kwargs.get("verification_url", ""),
            user_name=kwargs.get("user_name")
        ),
        "expiry_notification": lambda: service.send_expiry_notification(
            to=to,
            recipient_name=kwargs.get("recipient_name", "there"),
            urgent_docs=kwargs.get("urgent_docs", []),
            soon_docs=kwargs.get("soon_docs", [])
        ),
        "2fa_backup_codes": lambda: service.send_2fa_backup_codes(
            to=to,
            backup_codes=kwargs.get("backup_codes", []),
            user_name=kwargs.get("user_name")
        ),
    }

    handler = handlers.get(email_type)
    if not handler:
        return {
            "success": False,
            "error": f"Unknown email type: {email_type}. Valid types: {', '.join(handlers.keys())}"
        }

    return handler()

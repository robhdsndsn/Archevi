"""
Provisioning Worker
Processes the provisioning queue to complete tenant setup tasks.

Windmill Script Configuration:
- Path: f/tenant/provisioning_worker
- Trigger: Scheduled every 1 minute OR webhook after provision_tenant
"""

import wmill
from typing import Optional
import os


def setup_stripe(tenant_id: str, metadata: dict, db_conn) -> dict:
    """
    Create Stripe customer and subscription for tenant.
    """
    import stripe

    stripe.api_key = wmill.get_variable("u/admin/stripe_secret_key")

    plan = metadata.get("plan", "starter")
    email = metadata.get("email")
    stripe_token = metadata.get("stripe_token")

    # Price IDs from Stripe dashboard
    price_ids = {
        "starter": os.getenv("STRIPE_PRICE_STARTER", "price_starter_monthly"),
        "family": os.getenv("STRIPE_PRICE_FAMILY", "price_family_monthly"),
        "family_office": os.getenv("STRIPE_PRICE_FAMILY_OFFICE", "price_family_office_monthly"),
    }

    try:
        # Create customer
        customer = stripe.Customer.create(
            email=email,
            metadata={"tenant_id": tenant_id}
        )

        # Create subscription
        subscription_params = {
            "customer": customer.id,
            "items": [{"price": price_ids.get(plan)}],
            "metadata": {"tenant_id": tenant_id},
        }

        # Add payment method if provided
        if stripe_token:
            payment_method = stripe.PaymentMethod.attach(
                stripe_token,
                customer=customer.id
            )
            stripe.Customer.modify(
                customer.id,
                invoice_settings={"default_payment_method": payment_method.id}
            )

        subscription = stripe.Subscription.create(**subscription_params)

        # Update tenant with Stripe IDs
        with db_conn.cursor() as cur:
            cur.execute("""
                UPDATE tenants
                SET stripe_customer_id = %s,
                    stripe_subscription_id = %s,
                    plan_started_at = NOW()
                WHERE id = %s
            """, [customer.id, subscription.id, tenant_id])

        return {
            "success": True,
            "customer_id": customer.id,
            "subscription_id": subscription.id
        }

    except stripe.error.StripeError as e:
        return {
            "success": False,
            "error": str(e)
        }


def configure_subdomain(tenant_id: str, metadata: dict, db_conn) -> dict:
    """
    Configure subdomain routing for tenant.

    For MVP, we store the slug->tenant_id mapping and handle routing
    at the application level. For production, this could integrate
    with Cloudflare, Route53, or a reverse proxy.
    """
    slug = metadata.get("slug")

    # For now, just verify the mapping exists (created in provision_tenant)
    with db_conn.cursor() as cur:
        cur.execute("SELECT slug FROM tenants WHERE id = %s", [tenant_id])
        result = cur.fetchone()

        if result and result[0] == slug:
            return {
                "success": True,
                "subdomain": f"{slug}.archevi.ca",
                "note": "Subdomain routing configured at app level"
            }

    return {
        "success": False,
        "error": "Tenant slug mismatch"
    }


def send_welcome_email(tenant_id: str, metadata: dict, db_conn) -> dict:
    """
    Send welcome email to new tenant owner.
    """
    import resend

    resend.api_key = wmill.get_variable("u/admin/resend_api_key")

    email = metadata.get("email")
    family_name = metadata.get("family_name")

    try:
        response = resend.Emails.send({
            "from": "Archevi <hello@archevi.ca>",
            "to": email,
            "subject": f"Welcome to Archevi - {family_name} is ready!",
            "html": f"""
            <h1>Welcome to Archevi!</h1>

            <p>Your family knowledge base <strong>{family_name}</strong> is now ready.</p>

            <h2>Getting Started</h2>

            <ol>
                <li><strong>Add your first document</strong> - Upload a PDF, paste text, or type directly</li>
                <li><strong>Ask a question</strong> - Try "What's in my documents?"</li>
                <li><strong>Invite family members</strong> - Share access with your family</li>
            </ol>

            <p><a href="https://archevi.ca/guide/">Read our Getting Started guide</a></p>

            <h2>Your Plan</h2>

            <p>You're on a <strong>14-day free trial</strong> with full access to all features.</p>

            <p>Questions? Just reply to this email.</p>

            <p>Welcome to the family,<br>
            The Archevi Team</p>
            """
        })

        return {
            "success": True,
            "email_id": response.get("id")
        }

    except Exception as e:
        # Don't fail provisioning if email fails
        return {
            "success": True,
            "warning": f"Email failed but continuing: {str(e)}"
        }


# Task handlers
TASK_HANDLERS = {
    "setup_stripe": setup_stripe,
    "configure_subdomain": configure_subdomain,
    "send_welcome_email": send_welcome_email,
}


def main(
    max_tasks: int = 10,
    specific_tenant_id: Optional[str] = None
) -> dict:
    """
    Process pending provisioning tasks.

    Args:
        max_tasks: Maximum number of tasks to process in this run
        specific_tenant_id: Only process tasks for this tenant (optional)

    Returns:
        dict with processing results
    """

    db_resource = wmill.get_resource("u/admin/archevi_postgres")
    import psycopg2
    conn = psycopg2.connect(db_resource["connection_string"])

    results = {
        "processed": 0,
        "succeeded": 0,
        "failed": 0,
        "tasks": []
    }

    try:
        with conn.cursor() as cur:
            # Get pending tasks
            query = """
                SELECT id, tenant_id, step, metadata, attempts
                FROM provisioning_queue
                WHERE status = 'pending'
                AND (attempts < 3 OR attempts IS NULL)
            """
            params = []

            if specific_tenant_id:
                query += " AND tenant_id = %s"
                params.append(specific_tenant_id)

            query += " ORDER BY created_at LIMIT %s"
            params.append(max_tasks)

            cur.execute(query, params)
            tasks = cur.fetchall()

            for task in tasks:
                task_id, tenant_id, step, metadata, attempts = task
                results["processed"] += 1

                # Mark as processing
                cur.execute("""
                    UPDATE provisioning_queue
                    SET status = 'processing', updated_at = NOW()
                    WHERE id = %s
                """, [task_id])
                conn.commit()

                # Get handler
                handler = TASK_HANDLERS.get(step)
                if not handler:
                    cur.execute("""
                        UPDATE provisioning_queue
                        SET status = 'failed',
                            last_error = 'Unknown step',
                            updated_at = NOW()
                        WHERE id = %s
                    """, [task_id])
                    conn.commit()
                    results["failed"] += 1
                    continue

                # Execute handler
                try:
                    result = handler(str(tenant_id), metadata or {}, conn)

                    if result.get("success"):
                        cur.execute("""
                            UPDATE provisioning_queue
                            SET status = 'completed',
                                completed_at = NOW(),
                                updated_at = NOW()
                            WHERE id = %s
                        """, [task_id])
                        results["succeeded"] += 1
                    else:
                        cur.execute("""
                            UPDATE provisioning_queue
                            SET status = 'pending',
                                attempts = COALESCE(attempts, 0) + 1,
                                last_error = %s,
                                updated_at = NOW()
                            WHERE id = %s
                        """, [result.get("error", "Unknown error"), task_id])
                        results["failed"] += 1

                    results["tasks"].append({
                        "task_id": str(task_id),
                        "tenant_id": str(tenant_id),
                        "step": step,
                        "result": result
                    })

                except Exception as e:
                    cur.execute("""
                        UPDATE provisioning_queue
                        SET status = 'pending',
                            attempts = COALESCE(attempts, 0) + 1,
                            last_error = %s,
                            updated_at = NOW()
                        WHERE id = %s
                    """, [str(e), task_id])
                    results["failed"] += 1
                    results["tasks"].append({
                        "task_id": str(task_id),
                        "tenant_id": str(tenant_id),
                        "step": step,
                        "error": str(e)
                    })

                conn.commit()

        return results

    finally:
        conn.close()

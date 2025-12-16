"""
Get comprehensive usage statistics for admin dashboard.

Returns token usage, storage usage, quota status, and usage trends by tenant.
"""

import wmill
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Optional
from datetime import datetime, timedelta
from decimal import Decimal


def main(tenant_id: Optional[str] = None):
    """
    Get usage statistics across all tenants or for a specific tenant.

    Args:
        tenant_id: Optional tenant to filter by

    Returns:
        dict: Comprehensive usage statistics
    """
    pg_resource = wmill.get_resource("f/chatbot/postgres_db")

    stats = {
        "summary": {
            "total_tenants": 0,
            "total_documents": 0,
            "total_queries": 0,
            "total_tokens_used": 0,
            "total_cost_usd": 0.0,
            "period": "month",
        },
        "by_tenant": [],
        "quota_status": [],
        "usage_trends": [],
        "storage_usage": [],
        "top_users": [],
    }

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
            # Build tenant filter
            tenant_filter = f"WHERE t.id = '{tenant_id}'" if tenant_id else ""
            tenant_filter_and = f"AND t.id = '{tenant_id}'" if tenant_id else ""

            # Summary stats
            cur.execute(f"""
                SELECT
                    COUNT(DISTINCT t.id) as total_tenants,
                    COALESCE(SUM(doc_counts.doc_count), 0) as total_documents,
                    COALESCE(SUM(msg_counts.msg_count), 0) as total_queries
                FROM tenants t
                LEFT JOIN (
                    SELECT tenant_id, COUNT(*) as doc_count
                    FROM family_documents
                    GROUP BY tenant_id
                ) doc_counts ON doc_counts.tenant_id = t.id
                LEFT JOIN (
                    SELECT cs.tenant_id, COUNT(*) as msg_count
                    FROM chat_messages cm
                    JOIN chat_sessions cs ON cs.id = cm.session_id
                    WHERE cm.role = 'user'
                    GROUP BY cs.tenant_id
                ) msg_counts ON msg_counts.tenant_id = t.id
                {tenant_filter}
            """)
            summary = cur.fetchone()
            stats["summary"]["total_tenants"] = summary["total_tenants"]
            stats["summary"]["total_documents"] = summary["total_documents"]
            stats["summary"]["total_queries"] = summary["total_queries"]

            # Token usage from ai_usage (current month)
            month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            cur.execute(f"""
                SELECT
                    COALESCE(SUM(input_tokens + output_tokens), 0) as total_tokens,
                    COALESCE(SUM(cost_usd), 0) as total_cost
                FROM ai_usage au
                JOIN tenants t ON t.id = au.tenant_id
                WHERE au.created_at >= %s {tenant_filter_and}
            """, (month_start,))
            token_stats = cur.fetchone()
            stats["summary"]["total_tokens_used"] = token_stats["total_tokens"]
            stats["summary"]["total_cost_usd"] = float(token_stats["total_cost"] or 0)

            # Per-tenant usage with quotas
            cur.execute(f"""
                SELECT
                    t.id as tenant_id,
                    t.name as tenant_name,
                    t.plan,
                    t.ai_allowance_usd,
                    t.max_members,
                    t.max_storage_gb,
                    t.status,
                    COALESCE(doc_counts.doc_count, 0) as document_count,
                    COALESCE(member_counts.member_count, 0) as member_count,
                    COALESCE(usage.tokens_used, 0) as tokens_used,
                    COALESCE(usage.cost_usd, 0) as cost_used,
                    COALESCE(msg_counts.query_count, 0) as query_count
                FROM tenants t
                LEFT JOIN (
                    SELECT tenant_id, COUNT(*) as doc_count
                    FROM family_documents
                    GROUP BY tenant_id
                ) doc_counts ON doc_counts.tenant_id = t.id
                LEFT JOIN (
                    SELECT tenant_id, COUNT(*) as member_count
                    FROM tenant_memberships
                    GROUP BY tenant_id
                ) member_counts ON member_counts.tenant_id = t.id
                LEFT JOIN (
                    SELECT
                        tenant_id,
                        SUM(input_tokens + output_tokens) as tokens_used,
                        SUM(cost_usd) as cost_usd
                    FROM ai_usage
                    WHERE created_at >= %s
                    GROUP BY tenant_id
                ) usage ON usage.tenant_id = t.id
                LEFT JOIN (
                    SELECT cs.tenant_id, COUNT(*) as query_count
                    FROM chat_messages cm
                    JOIN chat_sessions cs ON cs.id = cm.session_id
                    WHERE cm.role = 'user' AND cm.created_at >= %s
                    GROUP BY cs.tenant_id
                ) msg_counts ON msg_counts.tenant_id = t.id
                {tenant_filter}
                ORDER BY COALESCE(usage.cost_usd, 0) DESC
            """, (month_start, month_start))

            tenants_usage = []
            for row in cur.fetchall():
                tenant_data = dict(row)
                # Calculate quota percentages
                ai_allowance = float(tenant_data["ai_allowance_usd"] or 0)
                cost_used = float(tenant_data["cost_used"] or 0)
                tenant_data["ai_quota_pct"] = round((cost_used / ai_allowance * 100), 1) if ai_allowance > 0 else 0
                tenant_data["member_quota_pct"] = round(
                    (tenant_data["member_count"] / tenant_data["max_members"] * 100), 1
                ) if tenant_data["max_members"] > 0 else 0
                # Convert Decimal to float for JSON
                tenant_data["ai_allowance_usd"] = float(tenant_data["ai_allowance_usd"] or 0)
                tenant_data["cost_used"] = cost_used
                tenants_usage.append(tenant_data)

            stats["by_tenant"] = tenants_usage

            # Quota status summary (tenants approaching or over limits)
            quota_alerts = []
            for t in tenants_usage:
                alerts = []
                if t["ai_quota_pct"] >= 90:
                    alerts.append({"type": "ai_budget", "pct": t["ai_quota_pct"], "severity": "critical" if t["ai_quota_pct"] >= 100 else "warning"})
                if t["member_quota_pct"] >= 80:
                    alerts.append({"type": "members", "pct": t["member_quota_pct"], "severity": "critical" if t["member_quota_pct"] >= 100 else "warning"})
                if alerts:
                    quota_alerts.append({
                        "tenant_id": t["tenant_id"],
                        "tenant_name": t["tenant_name"],
                        "alerts": alerts
                    })
            stats["quota_status"] = quota_alerts

            # Usage trends (last 7 days)
            week_ago = datetime.utcnow() - timedelta(days=7)
            cur.execute(f"""
                SELECT
                    DATE(au.created_at) as date,
                    SUM(au.input_tokens + au.output_tokens) as tokens,
                    SUM(au.cost_usd) as cost,
                    COUNT(*) as operations
                FROM ai_usage au
                JOIN tenants t ON t.id = au.tenant_id
                WHERE au.created_at >= %s {tenant_filter_and}
                GROUP BY DATE(au.created_at)
                ORDER BY date
            """, (week_ago,))
            stats["usage_trends"] = [
                {
                    "date": str(row["date"]),
                    "tokens": row["tokens"],
                    "cost": float(row["cost"] or 0),
                    "operations": row["operations"]
                }
                for row in cur.fetchall()
            ]

            # Storage usage by tenant (estimate based on document count)
            # Assuming ~50KB average per document
            cur.execute(f"""
                SELECT
                    t.id as tenant_id,
                    t.name as tenant_name,
                    t.max_storage_gb,
                    COUNT(d.id) as document_count,
                    COALESCE(SUM(LENGTH(d.content)), 0) / 1024.0 / 1024.0 as content_mb
                FROM tenants t
                LEFT JOIN family_documents d ON d.tenant_id = t.id
                {tenant_filter}
                GROUP BY t.id, t.name, t.max_storage_gb
                ORDER BY content_mb DESC
            """)
            stats["storage_usage"] = [
                {
                    "tenant_id": row["tenant_id"],
                    "tenant_name": row["tenant_name"],
                    "max_storage_gb": row["max_storage_gb"],
                    "document_count": row["document_count"],
                    "used_mb": round(float(row["content_mb"] or 0), 2),
                    "used_pct": round(float(row["content_mb"] or 0) / (row["max_storage_gb"] * 1024) * 100, 1) if row["max_storage_gb"] > 0 else 0
                }
                for row in cur.fetchall()
            ]

            # Top users by token usage (current month)
            cur.execute(f"""
                SELECT
                    u.id as user_id,
                    u.email,
                    u.name,
                    t.name as tenant_name,
                    SUM(au.input_tokens + au.output_tokens) as tokens_used,
                    SUM(au.cost_usd) as cost_usd,
                    COUNT(*) as operations
                FROM ai_usage au
                JOIN users u ON u.id = au.user_id
                JOIN tenants t ON t.id = au.tenant_id
                WHERE au.created_at >= %s {tenant_filter_and}
                GROUP BY u.id, u.email, u.name, t.name
                ORDER BY tokens_used DESC
                LIMIT 10
            """, (month_start,))
            stats["top_users"] = [
                {
                    "user_id": str(row["user_id"]),
                    "email": row["email"],
                    "name": row["name"],
                    "tenant_name": row["tenant_name"],
                    "tokens_used": row["tokens_used"],
                    "cost_usd": float(row["cost_usd"] or 0),
                    "operations": row["operations"]
                }
                for row in cur.fetchall()
            ]

    finally:
        conn.close()

    return stats


if __name__ == "__main__":
    import json
    print(json.dumps(main(), indent=2, default=str))

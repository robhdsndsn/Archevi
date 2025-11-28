# Bring Your Own Key (BYOK) Setup

This guide walks you through setting up your own Cohere API key for maximum privacy.

::: tip BYOK is Optional
Archevi works out of the box with included AI. BYOK is only needed if you want your queries to go directly to Cohere without passing through our servers.
:::

## Why Use BYOK?

With your own Cohere API key:

- **Maximum Privacy**: Your AI queries go directly to Cohere, not through us
- **Full Transparency**: You see exactly what you're paying for AI
- **No Tracking**: We never see your questions or search patterns
- **Direct Billing**: Pay Cohere directly at their published rates

## When to Use BYOK

BYOK is recommended if you:

- Handle sensitive medical or legal documents
- Want complete query privacy
- Prefer direct billing with Cohere
- Are a power user who wants granular cost control

## Step 1: Create a Cohere Account

1. Go to [cohere.com](https://cohere.com)
2. Click **"Get Started Free"** or **"Sign Up"**
3. Create an account with your email or Google/GitHub

## Step 2: Navigate to API Keys

1. Log into your [Cohere Dashboard](https://dashboard.cohere.com)
2. Click **"API Keys"** in the left sidebar
3. You'll see your default Trial key

## Step 3: Create a Production Key

For reliable service, create a production API key:

1. Click **"Create Production Key"**
2. Name it something memorable (e.g., "Archevi Family KB")
3. Click **"Create"**
4. **Copy the key immediately** - it won't be shown again!

::: warning Keep Your Key Safe
- Never share your API key publicly
- Don't commit it to version control
- Store it securely (password manager recommended)
:::

## Step 4: Enable BYOK in Archevi

1. Log into your Archevi dashboard
2. Go to **Settings** > **AI Configuration**
3. Toggle on **"Use my own Cohere API key"**
4. Paste your Cohere API key in the field
5. Click **"Save & Verify"**

Archevi will test the connection and confirm everything is working.

## Understanding Cohere Costs

When using BYOK, you pay Cohere directly. Here's what typical usage costs:

### Pricing Breakdown

| Operation | Model | Cost |
|-----------|-------|------|
| Embedding documents | embed-v4.0 | $0.10 per million tokens |
| Reranking results | rerank-v3.5 | $2.00 per million searches |
| Generating answers | command-a | $2.50/$10.00 per million tokens |
| Simple lookups | command-r | $0.15/$0.60 per million tokens |

### Monthly Estimates

| Usage Level | Monthly Queries | Est. Cost |
|-------------|-----------------|-----------|
| Light | 50-100 | $1-2 CAD |
| Normal | 100-300 | $2-5 CAD |
| Heavy | 300-500 | $5-10 CAD |
| Power User | 500+ | $10-15 CAD |

A typical family question costs less than **$0.001** (a tenth of a cent).

## Monitoring Your Usage

### In Cohere Dashboard

1. Go to [dashboard.cohere.com](https://dashboard.cohere.com)
2. Click **"Usage"** in the sidebar
3. View daily/monthly usage and costs

### In Archevi

When using BYOK, Archevi doesn't track your usage - check Cohere directly.

## Setting a Spending Limit

Cohere allows you to set spending limits:

1. In Cohere Dashboard, go to **Settings** > **Billing**
2. Set a **monthly spending cap**
3. You'll be notified when approaching the limit

::: tip Recommended Limit
Start with a $10-15/month limit. You can always increase it later.
:::

## Switching Back to Managed

If you change your mind:

1. Go to **Settings** > **AI Configuration**
2. Toggle off **"Use my own Cohere API key"**
3. Your queries will use Archevi's managed key again

Your saved API key will be deleted from our servers.

## Troubleshooting

### "Invalid API Key" Error

- Double-check you copied the full key (no trailing spaces)
- Ensure you're using a Production key, not Trial
- Verify the key hasn't been deleted in Cohere dashboard

### "Rate Limit Exceeded"

- Wait a few minutes and try again
- Consider upgrading your Cohere plan for higher limits
- Check if you've hit your spending cap

### "Connection Failed"

- Verify your internet connection
- Check [Cohere Status](https://status.cohere.com) for outages
- Try regenerating your API key

## FAQ

### Is BYOK required?

No. Archevi includes AI usage in your subscription. BYOK is optional for users who want maximum privacy.

### Can I use the free Trial key?

Yes, for testing! But Trial keys have lower rate limits. For regular use, upgrade to a Production key with billing enabled.

### Is my API key secure in Archevi?

Yes. Your API key is encrypted at rest (AES-256) and only used to make direct calls to Cohere. We never log your queries.

### What if I forget my API key?

You can always generate a new one in your Cohere dashboard. Then update it in Archevi settings.

### Can I switch between managed and BYOK?

Yes, anytime. Go to Settings > AI Configuration to toggle between modes.

---

**Need help?** [Contact support](mailto:support@archevi.ca)

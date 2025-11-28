# Setting Up Your Cohere API Key

This guide walks you through getting your own Cohere API key - a required step for using Archevi.

## Why You Need Your Own API Key

Archevi uses a **BYOK (Bring Your Own Key)** model. This means:

- **Privacy**: Your AI queries go directly to Cohere, not through us
- **Transparency**: You see exactly what you're paying for AI
- **Control**: No usage limits from us - query as much as you want
- **Security**: We never see your questions or search patterns

## Step 1: Create a Cohere Account

1. Go to [cohere.com](https://cohere.com)
2. Click **"Get Started Free"** or **"Sign Up"**
3. Create an account with your email or Google/GitHub

::: tip Free Tier Available
Cohere offers a generous free tier that's perfect for testing Archevi before committing.
:::

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

## Step 4: Add Key to Archevi

1. Log into your Archevi dashboard
2. Go to **Settings** > **API Configuration**
3. Paste your Cohere API key in the field
4. Click **"Save & Verify"**

Archevi will test the connection and confirm everything is working.

## Understanding Cohere Costs

Cohere charges based on tokens processed. Here's what typical Archevi usage costs:

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

Your Archevi dashboard shows:
- Monthly query count
- Estimated AI costs
- Usage trends

## Setting a Spending Limit

Cohere allows you to set spending limits:

1. In Cohere Dashboard, go to **Settings** > **Billing**
2. Set a **monthly spending cap**
3. You'll be notified when approaching the limit

::: tip Recommended Limit
Start with a $10-15/month limit. You can always increase it later.
:::

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

## Upgrading Your Cohere Plan

The free tier works for testing, but for production use:

1. Go to Cohere Dashboard > **Settings** > **Billing**
2. Choose a **Pay-as-you-go** plan
3. Add a payment method
4. No monthly minimums - just pay for what you use

## FAQ

### Can I use the free Trial key?

Yes, for testing! But Trial keys have lower rate limits. For regular family use, upgrade to a Production key with billing enabled.

### What if I forget my API key?

You can always generate a new one in your Cohere dashboard. Then update it in Archevi settings.

### Is my API key secure in Archevi?

Yes. Your API key is encrypted at rest and only used to make direct calls to Cohere. We never log or store your queries.

### Can I use a different AI provider?

Currently, Archevi is optimized for Cohere. Support for additional providers is on the roadmap.

---

**Need help?** [Contact support](mailto:support@archevi.ca)

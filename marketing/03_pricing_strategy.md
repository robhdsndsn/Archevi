# Pricing Strategy

*Updated: December 2025 - Based on actual cost analysis*

## All-Inclusive Model (Simplified)

Archevi uses an **all-inclusive pricing model** - one simple price covers everything:

| What's Included | Details |
|-----------------|---------|
| Platform access | Full app functionality |
| AI features | Embeddings, search, chat |
| Storage | Based on tier |
| Support | Based on tier |

**No hidden fees. No BYOK complexity. One price.**

---

## Pricing Tiers

| Tier | Price | Documents | Members | Storage | AI Questions |
|------|-------|-----------|---------|---------|--------------|
| **Free** | $0/mo | 50 | 2 | 1 GB | 50/mo |
| **Family** | $9/mo | 500 | 6 | 25 GB | Unlimited |
| **Family Plus** | $19/mo | 2,000 | 15 | 100 GB | Unlimited |
| **Family Office** | $49/mo | Unlimited | 50 | 500 GB | Unlimited |

### Free Plan - $0/month

**Included**:
- 50 documents
- 2 family members
- 1 GB storage
- 50 AI questions per month
- Basic search
- Email support

**Best for**: Trying Archevi, solo users, minimal needs

**Limitations**: No voice notes, no email alerts, no data export

### Family Plan - $9/month (Most Popular)

**Included**:
- 500 documents
- 6 family members
- 25 GB storage
- Unlimited AI questions
- Voice notes
- Email expiry alerts
- Data export
- Email support

**Best for**: Most families getting organized

**Our Cost**: ~$1.50-2.00/month | **Margin**: ~78-83%

### Family Plus Plan - $19/month

**Included**:
- 2,000 documents
- 15 family members
- 100 GB storage
- Unlimited everything
- Priority support
- API access
- Advanced analytics

**Best for**: Large families, multi-generational homes, power users

**Our Cost**: ~$3.50-4.50/month | **Margin**: ~76-82%

### Family Office Plan - $49/month

**Included**:
- Unlimited documents
- 50 family members
- 500 GB storage
- Dedicated support
- Custom integrations
- White-glove onboarding
- SLA guarantee

**Best for**: High net worth families, family offices, complex estates

**Our Cost**: ~$10-12/month | **Margin**: ~76-80%

---

## Cost Analysis (Internal)

### Per-Action Costs (Cohere + Infrastructure)

| Action | Cost | Notes |
|--------|------|-------|
| Upload 1 document | ~$0.003 | Embed + categorize |
| Ask 1 AI question | ~$0.008 | Embed + rerank + chat |
| Voice note (1 min) | ~$0.00 | Groq free tier |
| Email notification | ~$0.00 | Resend free tier |
| Storage (per GB/mo) | ~$0.00 | Supabase free tier |

### Monthly Cost by User Type

| User Type | Docs/mo | Questions/mo | Our Cost |
|-----------|---------|--------------|----------|
| Light | 10 | 20 | $0.19 |
| Medium | 30 | 50 | $0.49 |
| Heavy | 100 | 200 | $1.90 |
| Power | 300 | 500 | $4.90 |

### Service Stack Costs

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Windmill | Self-hosted | $0 |
| Supabase Storage | Free (1GB) | $0 |
| Cohere API | Pay-as-you-go | Variable |
| Groq API | Free tier | $0 |
| Resend Email | Free (3K/mo) | $0 |
| PostgreSQL | Self-hosted | $0 |

**Scale Triggers**:
- Storage > 1GB: Supabase Pro ($25/mo)
- Emails > 3K/mo: Resend Pro ($20/mo)

---

## Add-On Services

| Service | Price | Description |
|---------|-------|-------------|
| White-Glove Migration | $199 one-time | Full document migration |
| Premium Support | $9.99/month | Priority response, video chat |
| Custom Integration | $500-2000 | Connect to other systems |
| Additional Storage | $5/50GB | Beyond plan limits |

---

## Founding Member Program

**First 100 families get 25% off forever:**

| Plan | Regular | Founding Member | You Save/Year |
|------|---------|-----------------|---------------|
| Family | $9/mo | **$6.75/mo** | $27 |
| Family Plus | $19/mo | **$14.25/mo** | $57 |
| Family Office | $49/mo | **$36.75/mo** | $147 |

**Benefits**:
- Early revenue lock-in
- Creates urgency
- Builds loyal base
- Generates word-of-mouth

**Counter Display**: "X of 100 founding spots remaining"

---

## Pricing Psychology

### Why $9 instead of $9.99?
- Clean, honest pricing builds trust
- Easier to remember and share
- Under the $10 psychological barrier
- Matches utility subscription mental model

### Why these specific tiers?

| Price | Psychology | Comparisons |
|-------|------------|-------------|
| $0 | Remove all friction to try | Freemium hook |
| $9 | "Cup of coffee" impulse buy | Spotify, Netflix basic |
| $19 | "Worth it" for serious users | Streaming bundles |
| $49 | Premium but not enterprise | Gym memberships |

### Annual Billing Option

| Plan | Monthly | Annual | You Save |
|------|---------|--------|----------|
| Family | $9/mo | $86/yr | $22 (20%) |
| Family Plus | $19/mo | $182/yr | $46 (20%) |
| Family Office | $49/mo | $470/yr | $118 (20%) |

---

## Competitive Pricing Comparison

### Family of 5 - Annual Cost

| Solution | Calculation | Annual Cost | vs Archevi |
|----------|-------------|-------------|------------|
| Notion + AI | 5 x $20/mo | $1,200 | **11x more** |
| Notion (no AI) | 5 x $10/mo | $600 | 5.5x more |
| Personal AI | $40/mo | $480 | 4.4x more |
| Google One 2TB | $13/mo | $156 | 1.4x (no AI) |
| 1Password Family | $5/mo | $60 | Password only |
| **Archevi Family** | $9/mo | **$108** | Baseline |

### Key Talking Points

1. **"One price for everyone"** - No per-seat fees
2. **"11x cheaper than Notion AI"** - Direct comparison
3. **"Free tier to try"** - No risk
4. **"AI included in the price"** - No surprise bills

---

## Free Trial Strategy

**14-day free trial on paid plans, Free tier always available**

### Trial Experience Goals:
- Day 1: Upload first documents
- Day 3: First successful AI search
- Day 7: "Aha moment" finding something
- Day 14: Clear understanding of value

### Conversion Tactics:
- Email drip during trial
- In-app usage tips
- Day 13: "Trial ends tomorrow + founding discount"
- Day 15: Auto-downgrade to Free (keep data)

### Expected Metrics:
- Free tier signup: 15-25% of visitors
- Trial start (paid plans): 10-15% of free users
- Trial-to-paid: 25-35%
- With founding discount: 35-45%

---

## Pricing Page Copy

### Headline
> Simple pricing. Everything included. Start free.

### Subheadline
> One price covers AI, storage, and support. No hidden fees. No per-seat pricing.

### FAQ Section

**Why is it so affordable?**
> We built Archevi to be efficient. Self-hosted infrastructure and smart API usage means we can pass savings to you.

**What happens if I hit my document limit?**
> We'll notify you when you're at 80%. You can upgrade anytime, or delete old documents to make room.

**Can I downgrade?**
> Yes. Downgrade anytime and keep your data (up to new tier limits). Excess documents become read-only.

**Is there a contract?**
> No. Month-to-month billing. Cancel anytime from your dashboard.

### CTA Buttons
- Primary: "Start Free"
- Secondary: "See Demo" (video)

---

## Discount Strategy

### Acceptable Discounts
- Founding member: 25% off forever (first 100)
- Annual billing: 20% off
- Referral reward: 1 month free (both parties)

### No Discounts For
- Free tier (already free)
- Family Office (negotiate custom)

### Win-Back Offers
- 30 days after cancel: "Come back for 50% off first month"
- 90 days after cancel: "We miss you - 1 month free"

---

## Revenue Projections (Updated)

| Month | Free Users | Paid Users | MRR | ARR Run Rate |
|-------|------------|------------|-----|--------------|
| 3 | 100 | 20 | $180 | $2,160 |
| 6 | 300 | 50 | $500 | $6,000 |
| 12 | 800 | 150 | $1,500 | $18,000 |
| 24 | 2,000 | 400 | $4,500 | $54,000 |

**Assumptions**:
- 20% free-to-paid conversion over time
- Average revenue per paid user: $11/mo (mix of tiers)
- 5% monthly churn on paid plans

**Year 1 Target**: $15,000 CAD revenue
**Year 2 Target**: $50,000 CAD revenue

---

## Internal Plan Configuration

```python
PLAN_DEFAULTS = {
    'free': {
        'ai_allowance_usd': 0.50,
        'max_members': 2,
        'max_storage_gb': 1,
        'max_documents': 50,
        'max_questions_per_month': 50,
        'price_usd': 0.00,
    },
    'family': {
        'ai_allowance_usd': 3.00,
        'max_members': 6,
        'max_storage_gb': 25,
        'max_documents': 500,
        'max_questions_per_month': -1,  # unlimited
        'price_usd': 9.00,
    },
    'family_plus': {
        'ai_allowance_usd': 7.00,
        'max_members': 15,
        'max_storage_gb': 100,
        'max_documents': 2000,
        'max_questions_per_month': -1,
        'price_usd': 19.00,
    },
    'family_office': {
        'ai_allowance_usd': 20.00,
        'max_members': 50,
        'max_storage_gb': 500,
        'max_documents': -1,  # unlimited
        'max_questions_per_month': -1,
        'price_usd': 49.00,
    },
    'trial': {
        'ai_allowance_usd': 1.00,
        'max_members': 6,
        'max_storage_gb': 5,
        'max_documents': 100,
        'max_questions_per_month': 100,
        'price_usd': 0.00,
        'trial_days': 14,
    },
}
```

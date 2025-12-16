# Archevi Cost Analysis and Scaling Model

*Updated: December 2025*

## Executive Summary

Archevi uses a hybrid infrastructure model: **self-hosted core services** (free) + **managed services** (low fixed cost) + **pay-as-you-go AI APIs** (variable).

**Key Finding**: At scale, our costs are dominated by AI API usage (~85%), making per-tenant economics predictable and margins healthy (60-75%).

---

## Part 1: Fixed Infrastructure Costs

These costs exist regardless of user count.

### 1.1 Self-Hosted Services (FREE)

| Service | Purpose | Hosted On | Monthly Cost |
|---------|---------|-----------|--------------|
| Windmill CE | Backend orchestration | Local/VPS | $0 |
| PostgreSQL + pgvector | Database + vector search | Local/VPS | $0 |
| Caddy | Reverse proxy, SSL | Local/VPS | $0 |

**Total Self-Hosted**: **$0/month** (you own the server)

### 1.2 Managed Services

| Service | Tier | Purpose | Monthly Cost |
|---------|------|---------|--------------|
| Supabase | Free | Auth + Storage (1GB) | $0 |
| Vercel | Free | Marketing site hosting | $0 |
| Railway | Hobby | Strapi CMS | $5-10 |
| Resend | Free | Transactional email (3K/mo) | $0 |
| Domain (archevi.ca) | Annual | DNS | ~$1 ($12/yr) |

**Total Managed (Minimum)**: **$6-11/month**

### 1.3 Production Upgrade Triggers

| Trigger Condition | Service | Upgrade Cost |
|-------------------|---------|--------------|
| Storage > 1GB | Supabase Pro | +$25/mo |
| Emails > 3K/month | Resend Pro | +$20/mo |
| High traffic (>100K visits) | Vercel Pro | +$20/mo |
| Need staging/team | Railway Team | +$20/mo |

**Estimated Production Costs**: **$50-100/month** (100+ active users)

---

## Part 2: Variable Costs (Per-Operation)

These scale with usage. Currently using:
- **Cohere** for embeddings, rerank, and chat
- **Groq** for fast inference and voice transcription (free tier)

### 2.1 AI API Pricing (Cohere - December 2025)

| API | Model | Input Cost | Output Cost |
|-----|-------|------------|-------------|
| Embed | embed-english-v3.0 | $0.10 per 1M tokens | - |
| Chat | command-a-03-2025 | $2.50 per 1M tokens | $10.00 per 1M |
| Rerank | rerank-english-v3.0 | $0.002 per search | - |

### 2.2 Cost Per User Action

| Action | Tokens Used | API Calls | Our Cost |
|--------|-------------|-----------|----------|
| **Upload 1 document** | ~1,000 tokens (embed) | 1 embed | **~$0.0001** |
| **Auto-categorize** | ~500 input + ~200 output | 1 chat | **~$0.0033** |
| **Ask 1 AI question** | ~2,000 input + ~500 output | embed + rerank + chat | **~$0.008** |
| **Voice note (1 min)** | ~150 tokens | Groq (free) | **~$0.00** |
| **Email notification** | - | Resend (free) | **~$0.00** |

### 2.3 Typical User Session Costs

| Session Type | Actions | Our Cost |
|--------------|---------|----------|
| Quick lookup | 1 question | $0.008 |
| Document upload | 1 upload + categorize | $0.003 |
| Research session | 5 questions | $0.04 |
| Bulk upload | 10 documents | $0.03 |
| Power user hour | 10 questions + 3 uploads | $0.09 |

---

## Part 3: Per-Tenant Economics

### 3.1 AI Allowances by Plan

| Plan | Price | AI Allowance | Target Use Case |
|------|-------|--------------|-----------------|
| Free | $0 | $0.50/mo | Trial, minimal use |
| Family | $9 | $3.00/mo | Typical family |
| Family Plus | $19 | $7.00/mo | Large/active family |
| Family Office | $49 | $20.00/mo | High-volume users |

### 3.2 What AI Allowance Covers

| Plan | AI Allowance | Questions (~$0.008 each) | Documents (~$0.003 each) |
|------|--------------|--------------------------|--------------------------|
| Free | $0.50 | ~60/month | ~150/month |
| Family | $3.00 | ~375/month | ~1,000/month |
| Family Plus | $7.00 | ~875/month | ~2,300/month |
| Family Office | $20.00 | ~2,500/month | ~6,600/month |

### 3.3 Cost vs Revenue Analysis

| Plan | Revenue | AI Allowance | Infrastructure Share* | Margin |
|------|---------|--------------|----------------------|--------|
| Free | $0 | $0.50 | $0.10 | -$0.60 (loss leader) |
| Family | $9 | $3.00 | $0.20 | **$5.80 (64%)** |
| Family Plus | $19 | $7.00 | $0.30 | **$11.70 (62%)** |
| Family Office | $49 | $20.00 | $0.50 | **$28.50 (58%)** |

*Infrastructure share = fixed costs allocated per paying tenant

### 3.4 Actual Usage Patterns (Projected)

Most users don't hit their AI allowance:

| User Type | % of Users | Actual AI Usage | vs Allowance |
|-----------|------------|-----------------|--------------|
| Light | 40% | $0.50/mo | 17% of $3 |
| Medium | 35% | $1.50/mo | 50% of $3 |
| Heavy | 20% | $2.50/mo | 83% of $3 |
| Power | 5% | $4.00/mo | 133% (overage) |

**Blended average**: ~$1.50/tenant on $9 plan = **$7.50 gross margin (83%)**

---

## Part 4: Scaling Scenarios

### 4.1 Milestone Projections

| Users | Paid | MRR | AI Costs | Infra Costs | Profit |
|-------|------|-----|----------|-------------|--------|
| 100 | 20 | $200 | $30 | $50 | **$120** |
| 500 | 100 | $1,000 | $150 | $75 | **$775** |
| 1,000 | 200 | $2,200 | $300 | $100 | **$1,800** |
| 5,000 | 1,000 | $11,000 | $1,500 | $200 | **$9,300** |
| 10,000 | 2,000 | $22,000 | $3,000 | $400 | **$18,600** |

**Assumptions**:
- 20% free-to-paid conversion
- Average $11/paid user (tier mix)
- $1.50 avg AI cost per paid user
- Infrastructure scales with tiers

### 4.2 Infrastructure Scaling Triggers

| Milestone | What Happens | New Monthly Cost |
|-----------|--------------|------------------|
| 1 GB storage | Supabase Pro upgrade | +$25 |
| 3K emails/mo | Resend Pro upgrade | +$20 |
| 100+ concurrent | VPS upgrade (4GB→8GB) | +$20 |
| 500+ concurrent | VPS upgrade (8GB→16GB) | +$40 |
| 10K+ users | Managed PostgreSQL | +$50 |

### 4.3 Break-Even Analysis

| Cost Type | Monthly | Users Needed |
|-----------|---------|--------------|
| Fixed minimum | $50 | ~6 paid users |
| Production baseline | $100 | ~12 paid users |
| With team/staging | $150 | ~18 paid users |

---

## Part 5: Cost Optimization Strategies

### 5.1 Already Implemented

| Strategy | Savings | Status |
|----------|---------|--------|
| Self-hosted Windmill | ~$50-200/mo | Done |
| Self-hosted PostgreSQL | ~$30-100/mo | Done |
| Supabase free tier | ~$25/mo | Done |
| Groq for fast inference | ~$20-50/mo | Done |
| AI usage tracking | Visibility | Done |
| Per-tenant AI budgets | Cost control | Done |

### 5.2 Future Optimizations

| Strategy | Potential Savings | When |
|----------|-------------------|------|
| Embedding cache | 30-50% on embeddings | 500+ docs/day |
| Batch processing | 20% on bulk operations | 100+ users |
| Model tiering (small for simple) | 30% on chat | Always |
| Regional edge deployment | Latency, not cost | 1K+ users |
| S3/R2 for large files | 50% on storage | 50GB+ |

### 5.3 Cohere vs Alternatives

| Provider | Embed (1M tokens) | Chat (1M in/out) | Rerank |
|----------|-------------------|------------------|--------|
| **Cohere** | $0.10 | $2.50/$10 | $0.002/search |
| OpenAI | $0.13 (3-small) | $0.50/$1.50 (GPT-4o-mini) | - |
| Voyage AI | $0.02 | - | - |
| Together AI | $0.008 | $0.18/$0.18 | - |

**Current choice**: Cohere for quality + all-in-one + free tier for testing

---

## Part 6: Storage Costs Deep Dive

### 6.1 Supabase Storage Pricing

| Tier | Storage | Bandwidth | Price |
|------|---------|-----------|-------|
| Free | 1 GB | 2 GB/mo | $0 |
| Pro | 100 GB | 250 GB/mo | $25/mo |
| Pro+ | 100 GB | 250 GB/mo | $25 + $0.021/GB |

### 6.2 Per-User Storage Estimates

| Plan | Doc Limit | Avg Doc Size | Total Storage |
|------|-----------|--------------|---------------|
| Free | 50 | 2 MB | ~100 MB |
| Family | 500 | 2 MB | ~1 GB |
| Family Plus | 2,000 | 2 MB | ~4 GB |
| Family Office | Unlimited | 2 MB | ~10+ GB |

### 6.3 Storage Break-Even

| Users | Avg Docs | Total Storage | Cost |
|-------|----------|---------------|------|
| 10 | 100 | 200 MB | Free |
| 50 | 100 | 1 GB | Free (barely) |
| 100 | 200 | 2 GB | $25 (Pro) |
| 500 | 200 | 10 GB | $25 (Pro) |
| 2,000 | 300 | 60 GB | $25 (Pro) |
| 5,000 | 300 | 150 GB | $26 (Pro + overage) |

**Insight**: Storage costs scale slowly. 5,000 users = ~$26/mo storage.

---

## Part 7: Email Costs

### 7.1 Resend Pricing

| Tier | Emails/mo | Price |
|------|-----------|-------|
| Free | 3,000 | $0 |
| Pro | 50,000 | $20 |
| Business | 200,000 | $50 |

### 7.2 Email Usage Estimate

| Event | Frequency | Per User/Mo |
|-------|-----------|-------------|
| Welcome | Once | 0.1 |
| Expiry alerts | 1-2/mo | 1.5 |
| Weekly digest | 4/mo | 4 |
| Password reset | Rare | 0.1 |
| **Total** | | ~6/user/mo |

| Users | Emails/Mo | Tier | Cost |
|-------|-----------|------|------|
| 100 | 600 | Free | $0 |
| 500 | 3,000 | Free (limit) | $0 |
| 1,000 | 6,000 | Pro | $20 |
| 5,000 | 30,000 | Pro | $20 |

---

## Part 8: Complete Cost Model

### Monthly Cost Formula

```
Total Cost = Fixed + (Users × Variable)

Where:
- Fixed = Infrastructure + Managed Services
- Variable = AI Usage × Avg Cost Per Action × Actions Per User
```

### Example: 1,000 Users (200 Paid)

| Category | Calculation | Cost |
|----------|-------------|------|
| **Fixed Infrastructure** | | |
| VPS (8GB) | Stable | $40 |
| Domain | $12/12 | $1 |
| **Managed Services** | | |
| Supabase Pro | Storage | $25 |
| Vercel Pro | Traffic | $20 |
| Railway | CMS | $10 |
| Resend Pro | Email | $20 |
| **Variable (AI)** | | |
| 200 paid × $1.50 avg | AI usage | $300 |
| **TOTAL** | | **$416** |

### Revenue at 1,000 Users

| Source | Calculation | Amount |
|--------|-------------|--------|
| 200 paid × $11 avg | Subscriptions | $2,200 |
| Add-ons (5%) | Migration, support | $110 |
| **Total Revenue** | | **$2,310** |

### Profit: **$1,894/month (82% margin)**

---

## Part 9: Monitoring and Alerts

### Current Tracking (Admin Dashboard)

- [ ] API costs by provider (Cohere, Groq)
- [ ] API costs by tenant
- [ ] Daily cost trends
- [ ] Monthly projections
- [ ] Per-tenant budget usage %

### Recommended Alerts

| Metric | Warning | Critical |
|--------|---------|----------|
| Tenant AI usage | 80% of allowance | 100% |
| Total monthly AI | $500 | $1,000 |
| Storage usage | 80 GB | 95 GB |
| Email volume | 2,500 | 3,000 |

---

## Part 10: Key Takeaways

### Cost Structure

1. **Fixed costs are low**: $50-100/mo baseline
2. **AI dominates variable**: 85% of per-user costs
3. **Storage scales slowly**: Negligible per-user
4. **Email is basically free**: Until 500+ active users

### Margin Analysis

| Scenario | Margin |
|----------|--------|
| Light users (40%) | 90%+ |
| Average users | 75-85% |
| Heavy users | 60-70% |
| Blended average | **~80%** |

### Scaling Confidence

- **100 users**: Profitable at ~$100 fixed
- **1,000 users**: $1,800/mo profit
- **10,000 users**: $18,000/mo profit
- **CAC payback**: < 2 months at current margins

### Risk Factors

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cohere price increase | +20-50% AI costs | Multi-provider, caching |
| Free tier abuse | Loss leader expansion | Rate limits, conversion push |
| Storage spike | Supabase overage | Plan limits, archival |
| Email volume | Pro tier needed | Batch digests |

---

## Appendix: Quick Reference

### Cost Lookup Table

| What | How Much |
|------|----------|
| 1 AI question | $0.008 |
| 1 document upload | $0.003 |
| 1 voice note | ~$0.00 |
| 1 GB storage/mo | ~$0.00 (free tier) |
| 1 email | ~$0.00 (free tier) |

### Margin by Plan

| Plan | Price | Cost | Margin |
|------|-------|------|--------|
| Free | $0 | $0.60 | -$0.60 |
| Family | $9 | $1.70 | $7.30 (81%) |
| Family Plus | $19 | $3.80 | $15.20 (80%) |
| Family Office | $49 | $10.50 | $38.50 (79%) |

*Costs assume average usage, not max allowance*

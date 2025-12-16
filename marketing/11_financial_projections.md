# Financial Projections

*Updated December 2025 - Based on new pricing model*

## Year 1 Revenue Model

### Assumptions

**Customer Acquisition** (Freemium Model):
- Month 1: 50 free signups, 10 paid conversions
- Month 3: 150 free signups, 30 paid customers
- Month 6: 400 free signups, 80 paid customers
- Month 9: 700 free signups, 130 paid customers
- Month 12: 1,000 free signups, 200 paid customers

**Pricing Mix** (of paid customers):
- Family ($9): 70% of paid customers
- Family Plus ($19): 25% of paid customers
- Family Office ($49): 5% of paid customers

**Churn Rate**:
- Free: N/A (no revenue impact)
- Paid Months 1-3: 8% monthly (early adopters testing)
- Paid Months 4-12: 5% monthly (stabilized)

**Free-to-Paid Conversion**:
- Initial: 20% within 30 days
- Ongoing: 15% monthly of engaged free users
- With founding discount: 25-30%

---

### Monthly Recurring Revenue (MRR) Projections

**Month 1**:
- Free Users: 50
- Paid Customers: 10
- Mix: 7 Family, 2 Family Plus, 1 Family Office
- MRR: (7 × $9) + (2 × $19) + (1 × $49) = $150

**Month 3**:
- Free Users: 150
- Paid Customers: 30
- Mix: 21 Family, 8 Family Plus, 1 Family Office
- MRR: (21 × $9) + (8 × $19) + (1 × $49) = $390

**Month 6**:
- Free Users: 400
- Paid Customers: 80
- Mix: 56 Family, 20 Family Plus, 4 Family Office
- MRR: (56 × $9) + (20 × $19) + (4 × $49) = $1,080

**Month 9**:
- Free Users: 700
- Paid Customers: 130
- Mix: 91 Family, 33 Family Plus, 6 Family Office
- MRR: (91 × $9) + (33 × $19) + (6 × $49) = $1,740

**Month 12**:
- Free Users: 1,000
- Paid Customers: 200
- Mix: 140 Family, 50 Family Plus, 10 Family Office
- MRR: (140 × $9) + (50 × $19) + (10 × $49) = $2,700

---

### Annual Recurring Revenue (ARR)

**Year 1 End**: $32,400 ARR (MRR × 12)

---

### One-Time Revenue Streams

**Migration Services**:
- White-Glove ($199): 15 customers
- Revenue: $2,985

**Premium Add-ons**:
- Premium Support ($9.99/mo): 20 customers × 6 avg months
- Revenue: $1,200

**Total One-Time/Add-on Revenue**: $4,185

---

### Total Year 1 Revenue

| Category | Amount |
|----------|--------|
| Subscription Revenue | ~$18,000 |
| One-Time Services | $4,185 |
| **Total** | **~$22,185** |

*Note: This is conservative. Actual may be higher due to:*
- Annual billing (20% discount drives upfront cash)
- Faster growth from partnerships
- Higher Family Plus/Office mix than projected
- Word-of-mouth from free users

---

## Cost Structure (Year 1)

### Variable Costs (Scale with Usage)

**AI API Costs** (per action):

| Action | Cost | Notes |
|--------|------|-------|
| Document upload | ~$0.003 | Cohere embed + categorize |
| AI question (RAG) | ~$0.008 | Embed + rerank + chat |
| Voice note (1 min) | ~$0.00 | Groq free tier |
| Email notification | ~$0.00 | Resend free tier |

**Per Customer Monthly Cost** (average usage):

| User Type | Docs/mo | Questions/mo | AI Cost |
|-----------|---------|--------------|---------|
| Free user (light) | 5 | 20 | $0.18 |
| Family (medium) | 20 | 80 | $0.70 |
| Family Plus (heavy) | 50 | 200 | $1.75 |
| Family Office (power) | 100 | 400 | $3.50 |

**Year 1 AI Costs** (blended average ~$0.70/paid customer/month):
- 200 paid customers × $0.70 × 12 months = **$1,680**
- 1,000 free users × $0.18 × 12 months = **$2,160**
- **Total AI Costs: ~$3,840/year**

**Infrastructure** (self-hosted):

| Item | Cost |
|------|------|
| PostgreSQL (Docker) | $0 |
| Windmill (self-hosted) | $0 |
| Supabase Storage (1GB free) | $0 |
| **Total infrastructure** | **$0/month** |

*Note: Infrastructure costs remain $0 until:*
- Storage > 1GB: Supabase Pro ($25/mo)
- Heavy compute: Windmill Cloud (~$30/mo)
- Scale triggers: ~500+ paid customers

---

### Fixed Costs

**Software & Tools**:
| Item | Annual Cost |
|------|-------------|
| Domain name | $50 |
| Email marketing (ConvertKit) | $300 |
| Analytics (Plausible) | $90 |
| Customer support (Crisp) | $300 |
| Payment processing (Stripe fees) | ~$500 |
| **Total** | **$1,240** |

**Marketing**:
| Item | Annual Cost |
|------|-------------|
| Content creation (freelance) | $1,000 |
| Paid ads testing | $2,400 |
| Conference/events | $500 |
| Podcast sponsorships | $300 |
| **Total** | **$4,200** |

**Development**:
| Item | Annual Cost |
|------|-------------|
| Cohere API (development) | $200 |
| Cloud services (dev/staging) | $600 |
| Design tools (Figma) | $144 |
| **Total** | **$944** |

**Legal & Admin**:
| Item | Annual Cost |
|------|-------------|
| Business registration | $250 |
| Terms of service review | $500 |
| Insurance | $500 |
| Accounting software | $200 |
| **Total** | **$1,450** |

---

### Total Year 1 Costs

| Category | Amount |
|----------|--------|
| AI API Costs | $3,840 |
| Infrastructure | $0 |
| Software & Tools | $1,240 |
| Marketing | $4,200 |
| Development | $944 |
| Legal & Admin | $1,450 |
| **Total** | **$11,674** |

---

### Year 1 Profitability

| Metric | Amount |
|--------|--------|
| Revenue | $22,185 |
| Costs | $11,674 |
| **Profit** | **$10,511** |
| **Gross Margin** | **47%** |

*Note: This assumes founder time is not paid salary. If accounting for founder salary, profitability would be negative in Year 1.*

**Margin by Tier** (excluding fixed costs):

| Tier | Price | AI Cost | Gross Margin |
|------|-------|---------|--------------|
| Family ($9) | $9.00 | $0.70 | 92% |
| Family Plus ($19) | $19.00 | $1.75 | 91% |
| Family Office ($49) | $49.00 | $3.50 | 93% |

**Key insight:** AI costs are negligible per customer. The real cost is acquiring and retaining customers.

---

## 3-Year Projections

### Year 2 Assumptions

**Customer Growth** (Freemium flywheel):
- Free Users: 3,000 (3x Year 1)
- Paid Customers: 500 (2.5x Year 1)
- Churn: 4% monthly (improved from Year 1)

**Pricing Mix** (of paid):
- Family ($9): 60% (users upgrade as needs grow)
- Family Plus ($19): 30% (up from 25%)
- Family Office ($49): 10% (up from 5%)

**New Revenue Streams**:
- Annual billing: 40% choose annual (20% discount)
- Partnerships: 20% of new customers
- Add-ons: Premium support growth

**Year 2 Projections**:
- MRR at Year End: $6,500
- **Year 2 Revenue**: $60,000 CAD
- **Year 2 Costs**: $18,000 CAD
- **Year 2 Profit**: $42,000 CAD
- **Profit Margin**: 70%

---

### Year 3 Assumptions

**Customer Growth**:
- Free Users: 8,000
- Paid Customers: 1,200 (2.4x Year 2)
- Churn: 3% monthly (product-market fit achieved)

**Pricing Mix** (of paid):
- Family ($9): 50%
- Family Plus ($19): 35%
- Family Office ($49): 15%

**Year 3 Projections**:
- MRR at Year End: $16,000
- **Year 3 Revenue**: $150,000 CAD
- **Year 3 Costs**: $40,000 CAD
- **Year 3 Profit**: $110,000 CAD
- **Profit Margin**: 73%

---

### 3-Year Summary

| Year | Free Users | Paid Customers | Revenue | Costs | Profit | Margin |
|------|------------|----------------|---------|-------|--------|--------|
| 1 | 1,000 | 200 | $22,185 | $11,674 | $10,511 | 47% |
| 2 | 3,000 | 500 | $60,000 | $18,000 | $42,000 | 70% |
| 3 | 8,000 | 1,200 | $150,000 | $40,000 | $110,000 | 73% |

---

## Break-Even Analysis

### Monthly Break-Even Point

Fixed costs per month: $650 (tools + marketing + admin)
AI cost per paid customer: $0.70
Average revenue per paid customer: $13.50 (blended)

**Break-even paid customers**: $650 ÷ ($13.50 - $0.70) = **51 customers**

**Timeline to Break-Even**: Month 4-5 (projected 50-80 paid customers)

---

## Cash Flow Considerations

### Positive Factors
- Low upfront costs (bootstrapped)
- No inventory or physical goods
- Monthly recurring revenue (predictable)
- Annual billing (upfront cash)
- Services revenue (immediate cash)

### Negative Factors
- Payment processing delays (7-14 days)
- Seasonal fluctuations (Q1 tax season boost)
- Churn (monthly revenue loss)

### Cash Flow Strategy

1. **Encourage Annual Billing**: 15% discount drives upfront cash
2. **Services Revenue**: Migration services provide immediate revenue
3. **Low Fixed Costs**: Keep overhead minimal in Year 1
4. **Reserve Fund**: Maintain 3-month runway at all times

---

## Scenario Analysis

### Conservative Scenario

| Metric | Value |
|--------|-------|
| Year 1 Customers | 50 |
| Churn | 8% monthly |
| Trial Conversion | 20% |
| Year 1 Revenue | $10,000 |
| Break-even | Month 8 |

### Base Scenario (Projections Above)

| Metric | Value |
|--------|-------|
| Year 1 Customers | 100 |
| Churn | 5% monthly |
| Trial Conversion | 30% |
| Year 1 Revenue | $20,485 |
| Break-even | Month 4 |

### Optimistic Scenario

| Metric | Value |
|--------|-------|
| Year 1 Customers | 200 |
| Churn | 3% monthly |
| Trial Conversion | 40% |
| Year 1 Revenue | $45,000 |
| Break-even | Month 2 |

---

## Key Financial Metrics

### Unit Economics

| Metric | Target | Notes |
|--------|--------|-------|
| Customer Acquisition Cost (CAC) | <$30 | Free tier reduces paid acquisition cost |
| Customer Lifetime Value (LTV) | $270-400 | 24mo avg × $13.50 blended ARPU |
| LTV:CAC Ratio | 9:1+ | Target >3:1 is healthy |
| Payback Period | <3 months | First payment covers CAC |
| Gross Margin (per customer) | 93%+ | AI costs are minimal |

### Growth Metrics

| Metric | Target |
|--------|--------|
| Free-to-Paid Conversion | 20%+ |
| Month-over-Month Paid Growth | 15-20% |
| Net Revenue Retention | 105%+ |
| Average Revenue Per User (ARPU) | $13.50 |
| Expansion Revenue | 15% of MRR |

---

## Investment & Funding

### Current Status: Bootstrapped

**Runway**: Self-funded, no external investment needed
**Initial Investment**: ~$5,000 (development, tools, legal)
**Monthly Burn**: <$1,000 (until profitable)

### Future Funding Considerations

**When to Consider Funding**:
- Validated product-market fit (100+ paying customers)
- Clear path to $1M ARR
- Need to accelerate growth faster than organic allows
- Opportunity cost of slow growth exceeds dilution

**Potential Use of Funds**:
- Hiring (developer, marketer)
- Paid acquisition at scale
- International expansion
- Enterprise features

**Not Seeking Funding If**:
- Profitable and growing organically
- Bootstrap lifestyle preferred
- No desire for VC-style growth expectations

---

## Financial Milestones

| Milestone | Target Date | Metric |
|-----------|-------------|--------|
| First Paying Customer | Launch Week | $9 MRR |
| 100 Free Users | Month 1 | Validation |
| 10 Paid Customers | Month 1 | $135 MRR |
| 50 Paid Customers | Month 4 | Break-even |
| $500 MRR | Month 4 | 40 customers |
| $1,000 MRR | Month 6 | 80 customers |
| $2,500 MRR | Month 12 | 200 customers |
| $5,000 MRR | Month 18 | 400 customers |
| $10,000 MRR | Month 24 | 800 customers |
| $25K ARR | Month 12 | 200 paid customers |
| $75K ARR | Month 18 | 500 paid customers |
| $150K ARR | Month 24 | 1,000 paid customers |

---

## Risk Mitigation

### Revenue Risks

| Risk | Mitigation |
|------|------------|
| Low trial conversion | Optimize onboarding, A/B test |
| High churn | Improve product, better support |
| Price sensitivity | Value demonstration, ROI calculator |
| Seasonal fluctuation | Annual billing, diverse segments |

### Cost Risks

| Risk | Mitigation |
|------|------------|
| Infrastructure costs spike | Neon serverless scales down |
| Cohere pricing changes | Multi-model support, negotiate |
| Marketing inefficiency | Track CAC, cut underperformers |

### Business Risks

| Risk | Mitigation |
|------|------------|
| Competitor enters market | Build community, differentiate |
| Cohere partnership ends | Support multiple AI providers |
| Founder burnout | Sustainable pace, prioritize |

# Executive Summary

## What is Archevi?

Archevi is a **managed, AI-powered family knowledge base with true data isolation**. Each customer gets their own isolated database while sharing compute infrastructure, maximizing privacy and minimizing costs.

## Business Model: Platform Fee + BYOK

**BYOK (Bring Your Own Key)** means customers provide their own Cohere API key:

| Component | Who Pays | Amount |
|-----------|----------|--------|
| Platform Fee | Customer pays Archevi | $14.99-$99+/month |
| AI Costs | Customer pays Cohere directly | ~$2-10/month |

**Why BYOK?**
1. **Privacy**: AI queries go directly to Cohere, not through us
2. **Transparency**: Customer sees exact AI costs
3. **Control**: No usage limits from us
4. **Trust**: We never see their search queries

---

## Key Metrics

| Metric | Target |
|--------|--------|
| Launch Date | 6-8 weeks from start |
| Year 1 Revenue | $50,000 CAD |
| Month 12 Customers | 100 paying families |
| Initial Market | Canada (English + French Quebec) |

---

## Architecture Decision (November 2025)

### Why Managed Service Only?

We moved away from the dual-track (self-hosted + managed) approach:

- Self-hosted creates support burden without revenue
- Privacy differentiation comes from architecture, not deployment model
- BYOK model provides same privacy benefits with better UX
- Scalable from day one with controlled costs

### Technical Architecture

**Shared Compute + Isolated Storage**:
- **Windmill**: Shared workflow engine (handles all customers)
- **PostgreSQL**: Isolated database per customer (Neon Serverless initially)
- **Cohere API**: Customer's own API key (BYOK)

### Cost Per Customer

| Stage | Customers | Database Cost | Total Overhead |
|-------|-----------|---------------|----------------|
| 0-50 | Initial | ~$3-5/customer (Neon) | Low |
| 50+ | Growth | ~$0.60/customer (Hetzner) | Very Low |

---

## Competitive Advantage

**Market Gap**: No existing solution combines:
- Family-specific use cases (not individual notes)
- True data isolation per customer
- AI-powered semantic search (RAG)
- Affordable pricing (~$17-25/month total)
- Canadian data sovereignty (PIPEDA compliant)
- BYOK for complete privacy

**Defensible Advantages**:
1. **Privacy Architecture**: Isolated databases can't be replicated by SaaS competitors
2. **Cost Structure**: 90% savings due to efficient AI usage (Cohere vs. OpenAI)
3. **Family Focus**: Purpose-built for shared family knowledge, not generic notes
4. **BYOK Trust**: We never see customer queries - unique in the market

---

## Pricing Summary

| Tier | Platform Fee | + Cohere Est. | Target |
|------|--------------|---------------|--------|
| **Starter** | $14.99/mo | ~$2-5/mo | Tech-savvy families |
| **Family** | $24.99/mo | ~$5-10/mo | Multi-generational families |
| **Family Office** | Custom ($99+) | Varies | High net worth families |

**Founding Member Discount** (First 100 families):
- Starter: $9.99/month forever (33% off)
- Family: $16.99/month forever (33% off)

---

## Target Market Priority

### Phase 1 (Months 1-3): Tech-Savvy Families
- Early adopters comfortable with tech
- Privacy-conscious Canadians
- Cost-sensitive families
- Acquisition: Reddit, ProductHunt, HackerNews

### Phase 2 (Months 4-9): Elder Care Families
- Managing aging parents' care
- Medical records coordination
- Multiple caregivers
- Acquisition: Facebook groups, elder care agencies

### Phase 3 (Months 6-12): Blended Families
- Co-parenting coordination
- Multiple households
- Legal document management
- Acquisition: Family law firms, co-parenting apps

---

## Launch Strategy

### Pre-Launch (Weeks -6 to 0)
- Product polish and mobile responsiveness
- 10-15 beta testers recruited
- 5+ blog posts published
- Launch materials prepared

### Launch Week (Week 0)
- **Tuesday**: ProductHunt launch
- **Wednesday**: Reddit blitz
- **Thursday**: HackerNews
- **Friday**: Email + content distribution
- **Weekend**: Community building

### Post-Launch (Weeks 1-12)
- Weekly content publishing
- Community engagement
- Partnership development
- Conversion optimization

---

## Success Metrics

### Week 1 Goals
- 500+ website visits
- 50+ email signups
- 20+ trial starts
- 5+ paying customers

### Month 3 Goals
- 25 paying customers
- $500 MRR
- 2 active partnerships
- 25% trial conversion

### Month 12 Goals
- 100 paying customers
- $2,000 MRR
- 5+ active partnerships
- Clear path to $50K ARR

---

## Next Steps

1. **This Week**: Finalize product for beta
2. **Week 2**: Recruit 10-15 beta testers
3. **Week 3-4**: Create launch content
4. **Week 5**: Soft launch to beta
5. **Week 6**: Public launch

See individual documents in this folder for detailed execution plans.

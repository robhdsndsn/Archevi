# Archevi - Accuracy Report for Market Research

This report documents verified facts about Archevi for Perplexity market research input.

## Product Summary

**Archevi** is a family-focused AI document management SaaS that provides private, isolated knowledge bases for families to store, search, and understand their important documents.

**Tagline:** "Your Family's AI-Powered Memory"

**Key Differentiators:**
- True data isolation (each family gets dedicated database)
- AI included in all plans (no BYOK complexity)
- Canadian-based, PIPEDA compliant
- Family-specific features (member management, visibility controls)

---

## Verified Tech Stack

| Layer | Technology | Status |
|-------|------------|--------|
| **Dashboard** | React 19 + TypeScript + Vite | Implemented |
| **Marketing Site** | Next.js 15 + React 19 | Implemented |
| **CMS** | Strapi 5 | Implemented |
| **UI** | shadcn/ui + Tailwind CSS 4 | Implemented |
| **Backend** | Windmill (workflow orchestration) | Implemented |
| **Database** | PostgreSQL + pgvector | Implemented |
| **AI Models** | Cohere (embed/rerank), Groq Llama 3.3/4 (chat) | Implemented |
| **Voice** | Groq Whisper (80+ languages) | Implemented |

---

## Verified Pricing (CAD)

| Plan | Monthly | Best For |
|------|---------|----------|
| **Free** | $0 | Try with 50 documents |
| **Family** | $9 | Most families (500 docs, 6 members) |
| **Family Plus** | $19 | Larger families (2,000 docs, 15 members) |
| **Family Office** | $49 | Unlimited (high-net-worth families) |

**All plans include:**
- AI search (cost included)
- Voice transcription
- 14-day free trial
- No credit card required for free tier

---

## Verified Features (v0.5.0)

### Core Document Features
- PDF upload with text extraction
- OCR for scanned documents
- PDF visual search (find by charts/diagrams)
- Duplicate detection
- Document versioning with rollback
- Expiry tracking with alerts
- Secure links (password-protected sharing)
- Bulk ZIP upload

### AI Features
- Natural language queries with source citations
- Semantic search (meaning, not just keywords)
- AI-powered auto-tagging and categorization
- Related documents recommendations
- Multi-model selection (6 models)
- Workflow visualization (see AI thinking)

### Family Features
- Multi-tenant isolation (dedicated DB per family)
- Member types: Admin, Adult, Teen, Child
- Visibility controls: Everyone, Adults Only, Admins Only, Private
- Person assignment (assign docs to family members)
- Family Timeline (chronological view of events)
- Biography Generator (AI-powered narratives)

### Voice & Audio
- Browser recording
- Fast transcription (Groq Whisper)
- 80+ language support
- Text-to-Speech (browser TTS, free)

### Modern UX
- Mobile-first PWA
- Camera scanning
- Dark mode
- Command palette (Cmd/Ctrl+K)
- Real-time workflow visualization

### Admin & Analytics
- Usage tracking and analytics
- Expiry dashboard
- API cost tracking
- Admin audit logging
- Automated database backups
- Rate limiting (plan-based)

### Authentication & Security
- JWT with refresh rotation
- Two-factor authentication (TOTP + backup codes)
- Calendar integration (iCal subscription)
- CORS and rate limiting
- Input validation, XSS prevention

---

## Marketing Site Implementation

**URL:** archevi.ca

**Implemented Pages:**
- Landing page (hero, features, testimonials)
- Pricing page
- Blog (with Strapi CMS)
- FAQ (searchable, categorized)
- Changelog
- Signup (self-service with tenant provisioning)

**CMS Content Types:**
- Blog posts
- FAQ entries
- Announcements
- Changelog entries
- Features
- Testimonials
- Legal pages

**SEO:**
- Server-side rendering
- JSON-LD structured data
- Open Graph meta tags
- Sitemap, robots.txt

---

## Coming in v0.6.0

- Browser extension for web clipping
- Email notifications for expiring documents
- Stripe payment processing integration

---

## Target Market

**Primary:**
- Family households managing important documents
- Sandwich generation (caring for kids + aging parents)
- High-net-worth families with complex estates

**Secondary:**
- Family offices and advisors
- Small businesses (as family substitute)

---

## Competitive Positioning

| Competitor Category | Archevi Advantage |
|---------------------|-------------------|
| Generic cloud storage (Dropbox, Google Drive) | AI search, auto-tagging, family-specific features |
| Note apps (Notion, Evernote) | Document-focused, OCR, expiry tracking |
| Password managers | Document storage, not just credentials |
| General AI assistants | Grounded in YOUR documents, source citations |

---

## Known Limitations (Honest Assessment)

1. **No Stripe integration yet** - Billing UI exists but payment processing coming in v0.6.0
2. **No browser extension yet** - Web clipping planned for v0.6.0
3. **No email notifications yet** - Expiry alerts visible in dashboard only

---

## Files Fixed During This Audit

1. `README.md` - Updated pricing from old ($14.99/$24.99) to strategy ($0/$9/$19/$49)
2. `docs/index.md` - Fixed corrupted pricing table
3. `website/src/app/pricing/page.tsx` - Updated pricing and tiers
4. `docs/pricing/index.md` - Aligned with strategy pricing
5. `docs/guide/features.md` - Moved v0.5.0 from "Coming Soon" to "Released"
6. `marketing/README.md` - Removed BYOK references, updated to all-inclusive model

---

## Verification Summary

| Category | Status | Notes |
|----------|--------|-------|
| Project structure | Verified | All documented folders exist |
| Frontend features | Verified | 50+ components, all claimed features have implementations |
| Backend endpoints | Verified | 100+ Windmill Python scripts |
| Website/CMS | Verified | Next.js + Strapi fully implemented |
| Pricing consistency | Fixed | All files now show $0/$9/$19/$49 tiers |
| Tech stack claims | Verified | React 19, Next.js 15, Strapi 5, Windmill confirmed |

**Audit completed:** December 14, 2025
**Report generated for:** Perplexity market research phase

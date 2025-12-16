# Archevi Product Brief

**Source of Truth for Perplexity Spaces and Marketing**

Last Updated: December 14, 2025
Version: v0.5.0 (current) | v0.6.0 (in development)

---

## Executive Summary

**Archevi** is a hosted SaaS platform that gives families an AI-powered knowledge base for their important documents. Unlike generic document storage (Google Drive, Dropbox) or developer-focused RAG tools (RAGFlow, LlamaIndex), Archevi is purpose-built for families with features like privacy controls, member types, and person assignment.

**Key Differentiator:** Family-focused UX with built-in privacy controls that no competitor offers.

---

## Product Status

| Item | Details |
|------|---------|
| **Current Version** | v0.5.0 (Marketing Website & Self-Service Signup) |
| **Next Version** | v0.6.0 (Browser extension, email notifications, Stripe integration) |
| **Target Launch** | Q1 2026 |
| **Business Model** | **SaaS Only** (hosted service, not open-source) |
| **Target Market** | Canadian families, elder care segment |

---

## Business Model Clarification

**Primary Model: Hosted SaaS** - The standard offering for families.

**Enterprise License Available:** Full source code purchase for organizations wanting on-premise deployment. Pricing TBD - contact for details.

| Offering | Target | Deployment | Pricing |
|----------|--------|------------|---------|
| **SaaS (Primary)** | Families | Fully managed | $0-$49 CAD/month |
| **Enterprise License** | Organizations | On-premise, full code | Custom (TBD) |

### Why SaaS-First?

| Aspect | Archevi SaaS | Open-Source RAG Tools |
|--------|--------------|----------------------|
| Target User | Families (non-technical) | Developers, enterprises |
| Deployment | Fully managed | Self-hosted |
| Setup | 60 seconds | Hours to days |
| AI Costs | Included in subscription | User manages API keys |
| Competitive Focus | UX, privacy, family features | Flexibility, control |

**Why SaaS for families:**
- Families don't want to manage infrastructure
- AI costs included = no surprise bills
- Privacy through isolation, not self-hosting
- Faster iteration without backward compatibility burden

**Why Enterprise License option:**
- Organizations with strict data residency requirements
- White-label opportunities for professional services firms
- Full control over infrastructure and customization

---

## Pricing

*Updated December 2025 - Based on actual cost analysis*

| Plan | Price (CAD) | Documents | Storage | Members | AI Questions |
|------|-------------|-----------|---------|---------|--------------|
| **Free** | $0/month | 50 | 1 GB | 2 | 50/month |
| **Family** | $9/month | 500 | 25 GB | 6 | Unlimited |
| **Family Plus** | $19/month | 2,000 | 100 GB | 15 | Unlimited |
| **Family Office** | $49/month | Unlimited | 500 GB | 50 | Unlimited |

**All paid plans include:**
- AI-powered search (no API keys needed)
- Automatic expiry tracking
- Voice note transcription (80+ languages)
- Mobile-friendly interface
- 14-day free trial
- Email expiry alerts
- Data export

**Family Plus adds:**
- API access
- Priority support
- Advanced analytics

**Family Office adds:**
- Dedicated support
- Custom integrations
- White-glove onboarding
- SLA guarantee

### Competitive Advantage

| Solution | Family of 5 Annual Cost | vs Archevi |
|----------|-------------------------|------------|
| Notion + AI | $1,200 | 11x more |
| Personal AI | $480 | 4.4x more |
| Archevi Family | **$108** | Baseline |

**Key message:** "11x cheaper than Notion AI, with family privacy controls built in."

---

## Complete Feature List (v0.5.0)

### AI-Powered Document Intelligence
- Natural language search with semantic understanding
- Source citations with similarity scores (vector cosine similarity)
- AI workflow visualization (watch the AI work in real-time)
- **Tool call visibility** (shows "Searched: query" in UI when AI searches)
- Auto-categorization on upload
- Smart tag extraction (3-5 tags per document)
- Expiry date detection (policies, IDs, contracts)
- Duplicate detection on upload
- Smart category defaults (remembers last used)
- **Intelligent fallback** (seamless switch to backup LLM when rate limited)
- **Multi-model AI selection** (6 models: Groq Llama 3.3/4 Scout/4 Maverick, Cohere Command A/R+/R)
- **Related documents** (AI-powered recommendations based on content similarity)
- **Query templates** (pre-built queries by category: Insurance, Medical, Financial, Legal, etc.)
- **Search suggestions** (autocomplete with documents, people, tags, recent queries)

**Note on Search Scores:** The percentage shown is *semantic similarity* (how closely the document's meaning matches the query), not relevance ranking. Cohere Rerank v3.5 is now used to improve result ordering.

### Document Management
- PDF upload with automatic text extraction
- **PDF visual search** (page-level with Cohere Embed v4, thumbnail previews, similarity scores)
- OCR for scanned documents and photos
- Voice note recording with transcription (Groq Whisper, 80+ languages)
- Audio file upload (WAV, MP3, M4A, WebM)
- Text entry (paste or type directly)
- Camera capture (PWA on mobile)
- **Bulk ZIP upload** (upload multiple documents at once)
- Bulk operations (multi-select, select all, bulk delete)
- Document preview on hover (Quick Preview)
- Grid view and Table view options
- Edit inline (title, content, category, visibility)
- Context menus (right-click for quick actions)
- **Document version history** (timeline view, rollback to any version)
- **Document sharing** (share between family accounts)
- **Secure links** (password-protected sharing with view limits and expiration)
- **Calendar integration** (iCal subscription for expiry dates - Google, Apple, Outlook)

### Privacy & Visibility Controls (UNIQUE)
| Visibility Level | Who Can See |
|------------------|-------------|
| **Everyone** | All family members |
| **Adults Only** | Adults and Admins only |
| **Admins Only** | Family administrators only |
| **Private** | Only assigned person and admins |

### Member Types (UNIQUE)
| Type | Can See |
|------|---------|
| **Admin** | All documents |
| **Adult** | Everyone + Adults Only |
| **Teen** | Everyone only |
| **Child** | Everyone only |

### Person Assignment (UNIQUE)
- Assign documents to specific family members
- Filter by person ("Show me all of Sarah's documents")
- Person shows in document metadata and filters

### Family Collaboration
- Multi-tenant architecture (complete data isolation per family)
- Member invitation via email
- Role-based permissions (Owner, Admin, Member, Viewer)
- Member management dashboard

### Chat Experience
- Conversation history (automatically saved)
- Session titles based on content
- Export conversations to PDF
- Suggestion chips for new users
- Real-time AI workflow display
- **SSE streaming** (real-time token streaming for chat responses)

### Expiry Tracking
- Dashboard with Urgent (7 days), Soon (8-30 days), Upcoming (31-90 days)
- Automatic detection from document content
- Tag cloud for browsing by topic

### Modern Interface
- Mobile-first responsive design
- PWA support (install as app)
- Dark mode
- Command palette (Cmd/Ctrl+K)
- **Keyboard shortcuts** (Cmd+N new chat, Cmd+U upload, Cmd+/ search, Cmd+, settings, Cmd+Shift+? help)
- **Onboarding tour** for new users (6-step walkthrough with keyboard navigation)
- Drawer navigation (mobile)
- Context menus

### Security & Privacy
- Dedicated isolated database per family
- Encrypted storage at rest
- JWT authentication with refresh tokens
- PIPEDA compliant
- Documents never used for AI training
- Data portability (export anytime)
- **Automated database backups** (daily, weekly, monthly with 365-day retention)
- **Admin audit logging** (all admin actions tracked with old/new state)
- **Two-Factor Authentication (2FA)** - TOTP-based with authenticator apps (Google, Authy, 1Password)
- **Backup codes** - 10 codes with SHA-256 hashing for account recovery
- **Rate limiting** - Per-tenant limits (15-120 req/min based on plan)

### Admin Dashboard (Internal)
- System Health monitoring with service status cards
- Tenant Management (create, edit, suspend tenants)
- API Cost tracking by provider and tenant
- Activity Logs with Admin Actions and System Jobs tabs
- Windmill integration (jobs, scripts, schedules)
- Per-tenant branding/theming with 6 presets
- Rate limiting status and controls
- Usage alerts with threshold notifications

### Marketing & Onboarding (NEW in v0.5.0)
- **Marketing Website** (archevi.ca)
  - SEO-optimized Next.js 15 with server-side rendering
  - Landing page with feature highlights and pricing preview
  - Pricing page with plan comparison
  - Blog with Strapi CMS integration
  - FAQ with search and category filtering
  - Changelog for product updates
- **Self-Service Signup**
  - Create account without sales contact
  - Automatic tenant provisioning (60 seconds)
  - Cross-domain authentication to dashboard
- **Strapi CMS**
  - Content types: Blog posts, FAQs, Announcements, Changelog, Features, Testimonials, Legal pages
  - Admin panel for content team

### Family Stories (NEW in v0.4.9)
- **Family Timeline** - Visual chronological view of family events and milestones
  - AI-powered event extraction from documents (Groq Llama 3.3 70B)
  - Color-coded event types (birth, death, wedding, medical, legal, etc.)
  - Filter by year and event type
  - Manual event creation with date picker
- **Biography Generator** - AI-powered narratives for family members
  - 4 writing styles: Narrative, Chronological, Achievements, Personal
  - Word count slider (500-3000 words)
  - Source citations from documents
  - Copy to clipboard and download
- **Text-to-Speech** - Listen to documents
  - Free browser TTS using Web Speech API
  - Voice selection from system voices
  - Speed and pitch controls

### Billing & Subscription (NEW in v0.4.9)
- **PricingTable** - Plan comparison with monthly/yearly toggle
- **UsageMetrics** - Progress bars for storage, AI spend, documents, queries, members
- **BillingSubscription** - Subscription management with cancel/resume/payment update

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite |
| Marketing Site | Next.js 15 + React 19 (archevi.ca) |
| CMS | Strapi 5 (blog, FAQ, changelog, announcements) |
| Admin Dashboard | React + TypeScript + Vite (separate app) |
| UI Components | shadcn/ui + Tailwind CSS 4 |
| Backend | Windmill (workflow orchestration) |
| Database | PostgreSQL + pgvector (0.8.1) |
| AI - Embeddings | Cohere Embed v4.0 (Production API) |
| AI - Generation (Primary) | Groq Llama 3.3 70B (FREE tier, tool calling) |
| AI - Generation (Fallback) | Cohere command-r-08-2024 |
| AI - Reranking | Cohere Rerank v3.5 |
| AI - Vision (Evaluation) | Groq Llama 4 Scout (multimodal) |
| Voice | Groq Whisper |
| Rate Limiting | PostgreSQL (30 req/min per tenant) |
| Backups | psycopg2-based (no pg_dump), scheduled via Windmill |

### AI Architecture (December 2025)

**Hybrid Approach for Cost Efficiency:**
- **Primary LLM**: Groq Llama 3.3 70B (FREE tier, supports tool calling for intelligent search)
- **Fallback LLM**: Cohere command-r-08-2024 (activates when Groq rate limited)
- **Embeddings**: Cohere Embed v4.0 ($0.10/1M tokens)
- **Reranking**: Cohere Rerank v3.5 ($2/1000 searches)

**Rate Limiting**: Per-tenant limits (30 requests/minute) prevent API abuse and ensure fair usage.

**Fallback Behavior**: When Groq is rate limited, the system automatically switches to Cohere and proactively searches documents before generating a response.

---

## Roadmap

### v0.5.0 (Current - December 2025)
- **Marketing Website** (archevi.ca) - SEO-optimized Next.js 15 site
- **Strapi CMS** - Blog, FAQ, announcements, changelog management
- **Self-Service Signup** - Create account and get isolated instance in 60 seconds
- **Cross-Domain Auth** - Seamless login flow between marketing site and dashboard
- Two-factor authentication (2FA/MFA) with TOTP and backup codes
- PDF visual search (page-level with thumbnails)
- Secure links (password-protected sharing)
- Calendar integration (iCal subscription)
- Document version history with rollback
- Family Timeline with AI event extraction
- Biography Generator with 4 writing styles
- Browser Text-to-Speech (free)
- Billing & Subscription UI
- Multi-model AI selection (6 models)
- Query templates and search suggestions
- Related documents recommendations
- Document sharing between tenants
- Usage alerts with threshold notifications

### v0.6.0 (Planned - Q1 2026)
- Browser extension (Chrome Web Clipper)
- Email notifications for expiring documents
- Payment processing integration (Stripe)

### Future
- Deep Search mode (multi-step research)
- ElevenLabs premium audio voices
- Gmail deep integration
- White-label options for enterprises

---

## Target Audience

### Primary: Canadian Families
- Parents managing household documents
- Families with children (need visibility controls)
- Multi-generational households
- Estate planning scenarios

### Secondary: Elder Care
- Adult children managing aging parents' documents
- Caregivers needing access to medical history
- Estate planners helping families organize

### User Personas

**Persona 1: Busy Parent (Sarah, 42)**
- Has kids, aging parents, lots of documents
- Needs: Find things fast, share appropriately with family
- Pain: Documents scattered across folders, email, paper

**Persona 2: Caregiver Adult Child (Michael, 38)**
- Managing elderly parent's affairs
- Needs: Quick access to medical records, insurance policies
- Pain: Parent has disorganized files, can't remember where things are

**Persona 3: Estate Planner/Professional (Jennifer, 55)**
- Helps families organize for estate planning
- Needs: Collaborative access, visibility controls
- Pain: Clients have no central document system

---

## Competitive Positioning

### vs Consumer Tools (Notion, Google Drive, Dropbox)

| Feature | Archevi | Consumer Tools |
|---------|---------|----------------|
| AI Search | Semantic, real-time viz | Basic keyword or add-on |
| Privacy Controls | Visibility levels, member types | Basic sharing |
| Family Focus | Person assignment, expiry tracking | Generic |
| AI Cost | Included | Extra or limited |
| Data Isolation | Per-family database | Shared infrastructure |

**Differentiator:** Purpose-built for families, not adapted from productivity tools.

### vs RAG Tools (RAGFlow, AnythingLLM, Danswer)

| Feature | Archevi | RAG Tools |
|---------|---------|-----------|
| Target User | Families (non-technical) | Developers, enterprises |
| Setup | 60 seconds | Self-hosted, complex |
| AI Management | Included | User manages keys/costs |
| Family Features | Visibility, member types, person assignment | None |
| UX Polish | Consumer-grade | Developer-focused |

**Differentiator:** Archevi is NOT competing to be the best RAG framework. It's competing to be the best family document system that USES RAG.

### Unique Features No Competitor Has

1. **Visibility Controls** - No other family tool has Everyone/Adults Only/Admins Only/Private
2. **Member Types** - Admin/Adult/Teen/Child with visibility filtering
3. **Person Assignment** - Assign documents to specific family members
4. **AI Cost Included** - No API keys, no surprise bills
5. **Canadian Focus** - PIPEDA compliant, CAD pricing, Canadian support

---

## Key Messages by Audience

### For Families (Landing Page)
> "Your family's AI-powered memory. Ask questions, get answers from your documents. Privacy controls built in."

### For Elder Care (Partnership Pitch)
> "Help families organize important documents before they're needed. Visibility controls ensure sensitive information stays private."

### For Technical Audience (Reddit/HN)
> "Consumer-grade UX on top of production RAG. Cohere embeddings, pgvector, Windmill orchestration. But your mom can actually use it."

### For Canadian Market
> "Built in Canada, for Canadian families. PIPEDA compliant. CAD pricing. Your data stays in Canada."

---

## What Archevi is NOT

- **Not open-source** - SaaS primary, enterprise license available (not community open-source)
- **Not a RAG framework** - Not competing with LangChain/LlamaIndex
- **Not primarily for enterprises** - Family-focused first (enterprise license is secondary offering)
- **Not a general productivity tool** - Document management, not notes/tasks
- **Not a backup service** - Knowledge base, not file sync

---

## Document Versioning

This Product Brief supersedes any previous context given to Perplexity or other AI tools.

**If Perplexity Custom Instructions mention:**
- "open-source option" - CLARIFY: SaaS primary, enterprise license available (not community open-source)
- "open-core model" - INCORRECT, update to "SaaS + enterprise license"
- Features not in this list - Verify before using

**When updating Perplexity Spaces:**
1. Reference this document as the source of truth
2. Update custom instructions with current feature list
3. Emphasize family-focused differentiators, not RAG technical features

---

## Contact

- Website: archevi.ca
- Email: hello@archevi.ca
- Support: support@archevi.ca
- Docs: docs.archevi.ca

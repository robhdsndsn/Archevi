# Archevi - Project Overview

## Quick Links

| Resource | URL |
|----------|-----|
| **GitHub Repository** | https://github.com/robhdsndsn/Archevi |
| **Documentation Site** | https://robhdsndsn.github.io/Archevi/ |
| **Local Frontend** | http://localhost:5173 |
| **Admin Dashboard** | http://localhost:5174 |
| **Windmill Admin** | http://localhost |

---

## Project Summary

**Archevi** is an open-source, self-hosted family knowledge base powered by RAG (Retrieval-Augmented Generation). It enables family members to ask natural language questions about their documents and get instant, accurate answers with source citations.

**Created:** 2025-11-26
**Current Version:** 0.4.9
**Status:** Beta - Core features complete, expanding functionality

---

## What's Been Accomplished

### Infrastructure (Complete)
- [x] PostgreSQL 16 with pgvector extension for vector search
- [x] Docker Compose setup for easy deployment
- [x] Windmill workflow platform integration
- [x] Database schema with 4 tables (documents, chunks, conversations, messages)

### Backend Scripts (Complete)
- [x] `rag_query.py` - Main RAG endpoint with Cohere Command
- [x] `embed_document.py` - Document embedding with Cohere Embed v4
- [x] `embed_document_enhanced.py` - Enhanced embedding with auto-categorization, smart tags, expiry detection
- [x] `extract_text_from_storage.py` - Extract text from Supabase Storage files (PDF, images, text)
- [x] `search_documents.py` - Semantic search with relevance scoring
- [x] `get_conversation_history.py` - Chat history retrieval
- [x] `bulk_upload_documents.py` - Batch document import
- [x] `auth_*.py` - Authentication endpoints (login, verify, refresh, logout)
- [x] `manage_family_members.py` - Family member CRUD
- [x] `get_analytics.py` - Usage analytics

### Frontend Application (Complete)
- [x] React 19 + Vite + TypeScript setup
- [x] shadcn/ui component library (25+ components)
- [x] Zustand state management with persistence
- [x] Command palette (Cmd+K / Ctrl+K)
- [x] Dark mode with system preference detection
- [x] Collapsible sidebar navigation
- [x] Multi-session chat with history
- [x] Document upload with category selection
- [x] Bulk upload with Supabase Storage integration
- [x] Drag-and-drop file upload
- [x] Semantic document search with relevance scores
- [x] Admin/User view toggle
- [x] Windmill API client with TypeScript types

### Documentation (Complete)
- [x] VitePress documentation site
- [x] GitHub Pages deployment with CI/CD
- [x] Installation guide
- [x] API reference
- [x] Use case documentation
- [x] Comparison pages (vs Notion, Obsidian, Google Drive)

### DevOps (Complete)
- [x] GitHub repository (public)
- [x] GitHub Actions for docs deployment
- [x] Comprehensive .gitignore (protects secrets)
- [x] Environment variable templates

### Admin Dashboard (Complete - Dec 2025)
- [x] Separate React app at http://localhost:5174
- [x] System health monitoring (Windmill, PostgreSQL, Cohere services)
- [x] Tenant management with CRUD operations
  - Create/edit/suspend tenants
  - View tenant details with members, usage, activity
  - Plan and AI budget management
- [x] RAG system monitoring
  - Document listing across all tenants
  - Embedding statistics with pgvector health
  - Query analytics with daily trends
- [x] Database monitoring
  - PostgreSQL stats (version, size, connections)
  - Table statistics with row counts
  - pgvector index information
  - Migration history
- [x] Billing and cost tracking
  - API costs by provider and tenant
  - MTD costs with monthly projections
  - Token usage analytics
- [x] Branding and theming
  - Per-tenant branding configuration
  - 6 pre-built theme presets
  - Custom CSS support
- [x] Windmill integration (jobs, scripts, flows, schedules)
- [x] Activity logging and audit trail

### Recent Features (v0.4.7 - v0.4.9 - Dec 2025)
- [x] Two-Factor Authentication (2FA)
  - TOTP-based with authenticator apps (Google, Authy, 1Password)
  - 10 backup codes with SHA-256 hashing
  - QR code setup flow in Settings
- [x] Family Timeline
  - Visual chronological view of family events
  - AI-powered event extraction from documents (Groq Llama 3.3 70B)
  - Color-coded event types (birth, death, wedding, medical, legal, etc.)
  - Manual event creation with date picker
  - Filter by year and event type
- [x] Biography Generator
  - AI-powered narratives for family members
  - 4 writing styles (Narrative, Chronological, Achievements, Personal)
  - Word count slider (500-3000 words)
  - Source citations from documents
  - Copy to clipboard and download
- [x] Browser Text-to-Speech
  - Free TTS using Web Speech API
  - Voice selection from system voices
  - Speed and pitch controls
  - Play/pause/stop functionality
- [x] Billing & Subscription UI
  - PricingTable with 4 plan tiers
  - Monthly/yearly billing toggle
  - UsageMetrics with progress bars and warning states
  - BillingSubscription with cancel/resume/payment management
- [x] PDF Visual Search
  - Page-level visual search within PDFs
  - Cohere Embed v4 multimodal embeddings per page
  - Thumbnail previews with similarity scores
- [x] Secure Links
  - Password-protected document sharing
  - Configurable view limits and expiration
  - Cryptographically random tokens
- [x] Calendar Integration
  - iCal subscription for expiry dates
  - Google, Apple, Outlook calendar support
  - Category filters and reminder settings

---

## What's Next (Roadmap)

### Phase 2: Multi-User Authentication (Priority: High)
| Task | Description | Complexity |
|------|-------------|------------|
| JWT Authentication | Implement proper JWT flow with refresh tokens | Medium |
| Login/Register UI | Frontend forms with validation | Low |
| Family Member Roles | Admin, Member, Guest permissions | Medium |
| Per-User Sessions | Isolate chat history by user | Low |
| Password Reset | Email-based password recovery | Medium |

### Phase 3: Enhanced Document Handling (Priority: High)
| Task | Description | Complexity |
|------|-------------|------------|
| PDF Upload | Extract text from PDF files | Medium |
| Image OCR | Extract text from images (Tesseract/Cloud OCR) | High |
| Bulk Import | Drag-and-drop multiple files | Low |
| Document Preview | View documents inline | Low |
| Document Editing | Edit uploaded documents | Medium |
| Version History | Track document changes | Medium |

### Phase 4: Mobile & Accessibility (Priority: Medium)
| Task | Description | Complexity |
|------|-------------|------------|
| PWA Support | Offline access, install prompt | Medium |
| Mobile Optimization | Touch-friendly UI improvements | Low |
| Voice Input | Speech-to-text for queries | Medium |
| iOS App | React Native or native Swift | High |
| Android App | React Native or native Kotlin | High |

### Phase 5: Advanced Features (Priority: Low)
| Task | Description | Complexity |
|------|-------------|------------|
| Auto-Categorization | AI-powered document classification | Medium |
| Smart Reminders | Expiring documents, renewals | Medium |
| Calendar Integration | Google/Apple calendar sync | Medium |
| Multi-Language | French, Spanish support | High |
| Ollama Support | Local LLM alternative to Cohere | Medium |
| Family Sharing | Share documents between families | High |

### Phase 6: Monetization (Future)
| Task | Description | Complexity |
|------|-------------|------------|
| Managed Hosting | $14.99/month hosted option | High |
| Stripe Integration | Payment processing | Medium |
| User Dashboard | Account management, billing | Medium |
| Usage Limits | Tiered plans with quotas | Low |

---

## Technology Stack

### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Workflow Engine | Windmill | Script execution, API endpoints |
| Embeddings | Cohere Embed v4.0 | Document vectorization |
| Reranking | Cohere Rerank v3.5 | Improve search accuracy |
| Generation (Primary) | Groq Llama 3.3 70B | AI responses with tool calling (FREE tier) |
| Generation (Fallback) | Cohere command-r-08-2024 | Fallback when Groq rate limited |
| Database | PostgreSQL 16 + pgvector | Vector storage & search |
| File Storage | Supabase Storage | Cloud file storage (S3-compatible) |
| Runtime | Python 3.11+ | Backend scripts |
| Containers | Docker | Deployment |
| Rate Limiting | PostgreSQL | Per-tenant rate limits (30 req/min) |

### Frontend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 19 | UI library |
| Build Tool | Vite | Fast dev server, bundling |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS 3.4 | Utility-first CSS |
| Components | shadcn/ui | Accessible UI components |
| State | Zustand | State management |
| Commands | cmdk | Command palette |
| Icons | Lucide React | Icon library |

### Documentation
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | VitePress | Static site generator |
| Hosting | GitHub Pages | Free static hosting |
| CI/CD | GitHub Actions | Automated deployment |

---

## Project Structure

```
Archevi/
├── frontend/                 # React application (user-facing)
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   ├── ui/          # shadcn components
│   │   │   ├── chat/        # Chat interface
│   │   │   ├── documents/   # Document management
│   │   │   │   ├── BulkUpload.tsx    # Supabase bulk upload
│   │   │   │   └── ...
│   │   │   ├── auth/        # Authentication
│   │   │   ├── analytics/   # Analytics views
│   │   │   ├── family/      # Family management
│   │   │   └── settings/    # Settings views
│   │   ├── api/             # API client
│   │   ├── store/           # Zustand stores
│   │   └── lib/
│   │       ├── supabase.ts  # Supabase client & upload helpers
│   │       └── utils.ts     # Utilities
│   └── package.json
├── admin/                    # Admin dashboard (internal)
│   ├── src/
│   │   ├── api/             # Windmill API client
│   │   │   └── windmill.ts  # Typed API with 14+ endpoints
│   │   ├── components/
│   │   │   ├── ui/          # shadcn components
│   │   │   ├── dashboard/   # Overview, SystemHealth
│   │   │   ├── tenants/     # TenantList, dialogs
│   │   │   ├── rag/         # Documents, Embeddings, QueryStats
│   │   │   ├── database/    # DatabaseStats
│   │   │   ├── billing/     # APICosts
│   │   │   ├── logs/        # ActivityLog
│   │   │   ├── windmill/    # JobsList
│   │   │   └── settings/    # SystemSettings, Branding
│   │   └── App.tsx          # Hash-based routing
│   └── package.json
├── scripts/                  # Windmill Python scripts
│   ├── embed_document_enhanced.py
│   ├── extract_text_from_storage.py  # Supabase file extraction
│   ├── get_embedding_stats.py        # Admin: pgvector stats
│   ├── get_query_stats.py            # Admin: RAG analytics
│   ├── get_database_stats.py         # Admin: PostgreSQL info
│   └── ...
├── Infrastructure/           # Docker & database
├── windmill-setup/           # Windmill Docker config
├── docs/                     # VitePress documentation
│   ├── .vitepress/          # VitePress config
│   ├── guide/               # User guides
│   ├── api/                 # API documentation
│   ├── use-cases/           # Use case examples
│   └── comparison/          # Competitor comparisons
├── .github/
│   └── workflows/           # GitHub Actions
└── README.md                # Public README
```

---

## Local Development

### Prerequisites
- Docker Desktop
- Node.js 18+
- pnpm
- Cohere API key
- Supabase account (free tier works)

### Quick Start
```bash
# Start backend
cd Infrastructure && docker compose up -d
cd ../windmill-setup && docker compose up -d

# Start frontend
cd ../frontend
pnpm install
pnpm run dev
```

### Access Points
| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | - |
| Admin Dashboard | http://localhost:5174 | Windmill token required |
| Windmill | http://localhost | admin@archevi.com |
| PostgreSQL | localhost:5433 | archevi / archevi |
| Supabase Storage | https://imgwjychhygtfyczsijd.supabase.co | See .env.local |
| Docs (local) | http://localhost:5175 | - |

---

## Cost Analysis

### Self-Hosted (Current)
| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| Groq API | FREE | Primary LLM (Llama 3.3 70B) |
| Cohere Embed | ~$0.10/1M tokens | Document vectorization |
| Cohere Rerank | ~$2/1000 searches | Search relevance |
| Cohere Command-R | ~$0.15-0.60/1M tokens | Fallback only (rare) |
| Supabase Storage | Free (1GB) | Document storage |
| Docker (local) | Free | Infrastructure |
| PostgreSQL | Free | Database + rate limiting |
| **Total** | **~$1-2 CAD/month** | Lower due to Groq FREE tier |

### AI Cost Efficiency (December 2025)
The hybrid Groq + Cohere architecture reduces costs by 80%+:
- **Primary**: Groq Llama 3.3 70B (FREE, 30 req/min)
- **Fallback**: Cohere command-r-08-2024 (~$0.15/$0.60 per 1M in/out)
- **Embeddings**: Cohere Embed v4.0 ($0.10/1M tokens)
- **Reranking**: Cohere Rerank v3.5 ($2/1000 searches)

### Managed Hosting (Planned)
| Tier | Price | Features |
|------|-------|----------|
| Basic | $14.99/month | 5 users, 10GB storage |
| Pro | $29.99/month | Unlimited users, 50GB |
| Enterprise | Custom | Custom deployment |

---

## Opportunities & Ideas

### Market Opportunities
1. **Elder Care Market** - Medical records, caregiver access
2. **Estate Planning** - Wills, important documents, emergency info
3. **Small Business** - Family businesses with shared knowledge
4. **Remote Families** - Geographically distributed families
5. **Immigrants** - Multi-language document organization

### Technical Opportunities
1. **Ollama Integration** - Local LLM for privacy-conscious users
2. **WhatsApp Bot** - Query documents via WhatsApp
3. **Email Ingestion** - Auto-import important emails
4. **Browser Extension** - Save web pages to knowledge base
5. **Calendar Sync** - Auto-add renewal reminders

### Partnership Opportunities
1. **Financial Advisors** - Document organization for clients
2. **Healthcare Providers** - Patient record access
3. **Legal Services** - Estate planning document management
4. **Insurance Brokers** - Policy document storage

---

## Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI Provider | Cohere | Best price/performance, Canadian company |
| Frontend | React + Vite | Modern DX, TypeScript support |
| Components | shadcn/ui | Accessible, customizable |
| State | Zustand | Simpler than Redux |
| Database | PostgreSQL + pgvector | Mature, proven |
| Workflow | Windmill | Free self-hosted, MCP support |
| Docs | VitePress | Fast, Vue-based, clean |

---

## Files Reference

| File | Purpose |
|------|---------|
| `README.md` | Public GitHub README |
| `00_PROJECT_OVERVIEW.md` | This file (internal) |
| `CLAUDE.md` | Claude Code instructions |
| `Claude_Session_Log.md` | Current session status |
| `Claude_Session_Archive.md` | Historical sessions |
| `DOCUMENTATION_AUTOMATION_PLAN.md` | Docs automation spec |

---

**Last Updated:** 2025-12-06
**Maintained By:** Development Team

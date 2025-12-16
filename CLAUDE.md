# FamilySecondBrain - Claude Code Project

## Project Overview
RAG-powered family knowledge base chatbot using Windmill, Cohere, and pgvector

## Location
C:/Users/RHudson/Desktop/Claudius/Projects/FamilySecondBrain

## Created
2025-11-26 by RHudson

## Project Structure

```
FamilySecondBrain/
├── 00_PROJECT_OVERVIEW.md    # Project details and technical stack
├── CHANGELOG.md              # Version history
├── CLAUDE.md                 # This file (Claude Code instructions)
├── README.md                 # Project documentation
├── .beads/                   # Issue tracking (Beads)
├── .claude/                  # Claude Code configuration
│   ├── agents/               # Project-specific subagents
│   └── commands/             # Custom slash commands
├── admin/                    # Admin dashboard (React 19 + Vite)
├── cms/                      # Strapi 5 CMS (blog, FAQ, announcements)
├── docs/                     # VitePress documentation site
├── frontend/                 # User dashboard (React 19 + Vite)
├── Infrastructure/           # Deployment configs (Docker, Caddy)
├── marketing/                # Marketing strategy docs
├── scripts/                  # Utility scripts
├── supabase/                 # Database migrations
├── website/                  # Next.js 16 marketing site
├── windmill-setup/           # Windmill Docker config
├── 01_Planning/              # Requirements and planning
├── 02_Development/           # Code notes and development
├── 03_Learning/              # Key insights and learnings
└── 04_Output/                # Deliverables and output
```

## File Boundaries

**Safe to edit:**
- All project files within C:/Users/RHudson/Desktop/Claudius/Projects/FamilySecondBrain
- All markdown documentation
- All source code and scripts

**Never touch:**
- venv/ (if exists)
- __pycache__/ (if exists)
- .git/ (git internals)
- node_modules/ (if exists)

## Obsidian Integration

This project is part of the Claudius Obsidian vault:
- **Active Log:** Claude_Session_Log.md (current status, recent sessions, next actions)
- **Complete Archive:** Claude_Session_Archive.md (full historical record)
- **Project Overview:** 00_PROJECT_OVERVIEW.md (technical details, context)

## Communication Standards

**From Master_Claude_Project_Instructions.md:**

- **NO EMOJIS** - Never use emojis in any communication, documentation, or code
- **Professional Tone** - Technical, clear, professional communication
- **Absolute Paths** - Always use absolute paths for file operations
- **Append-Only Logging** - Add deltas to session logs, never duplicate content
- **Context References** - Begin responses with project context reference

## Logging System

### Two-Tier Architecture

**Active Session Log (Claude_Session_Log.md):**
- Current "working on" status
- Last 2-3 major sessions (outcomes only)
- Immediate next actions
- Current blockers/issues
- Max 100 lines or 50KB

**Complete Session Archive (Claude_Session_Archive.md):**
- Full historical record of all sessions
- Complete technical decisions and debugging
- Architecture changes and rationale
- All learnings and insights
- Unlimited length

### Archival Triggers

**Auto-archive when:**
- Active log exceeds 100 lines
- Active log exceeds 50KB
- Major milestone completed
- Phase transition occurs
- End of month

## Session Workflow

**On every session start:**
1. Read Claude_Session_Log.md for current status
2. Check Claude_Session_Archive.md for historical context
3. Review 00_PROJECT_OVERVIEW.md for project details
4. Reference Master_Claude_Project_Instructions.md for standards

**During session:**
- Work on current tasks
- Track progress and decisions

**On session end:**
- Append summary to Claude_Session_Log.md (delta only)
- Archive to Claude_Session_Archive.md if triggers met
- Update next actions

## Shell and Execution

**Shell Restrictions (Cylance Security):**
- Cylance blocks PowerShell execution completely
- Never use PowerShell or PowerShell syntax
- Avoid && syntax in PowerShell contexts

**Preferred Shells:**
- **Primary:** Git Bash (C:\Program Files\Git\bin\bash.exe)
- **Fallback:** CMD for Windows commands
- **Always specify shell explicitly** when using Desktop Commander MCP

## FILE MANAGEMENT RULES (MANDATORY)

**Reference:** C:\Users\RHudson\Desktop\Claudius\NAMING_CONVENTIONS.md

### Before Creating ANY File:

1. **CHECK**: Does file already exist? → Edit it, don't duplicate
2. **VALIDATE**: Does name follow standards? → No versions, no "new"/"updated"
3. **SEARCH**: Similar files exist? → Reuse or archive old first
4. **ASK**: Unsure? → Ask user before creating

### Validation Command:
```bash
python C:\Users\RHudson\Desktop\Claudius\Scripts\validate_filename.py "filepath"
```

### Forbidden Patterns:
 filename_v2.py # Version suffixes
 config_new.json # "new" marker
 script_updated.py # "updated" marker
 temp_file.txt # "temp" files
 file_backup.md # "backup" marker
 file1.py # Generic numbered names
 data.csv # Non-descriptive names

### Required Patterns:
 process_bank_statements.py # Descriptive, specific
 categorization_engine.py # Clear purpose
 october_2025_transactions.json # Includes date/context
 BankStatementParser.py # PascalCase for classes

### Version Control Strategy:
- **USE GIT** for versioning: `git commit`, `git tag v1.0.0`
- **DON'T USE** filename suffixes: script_v2.py
- **USE BRANCHES** for experiments: `git checkout -b experiment/feature-name`
- **ARCHIVE OLD FILES**: Move to `archive/` folder with git

### File Creation Checklist:
```
Before creating [filename]:

□ Searched project for existing files with similar purpose
□ Confirmed name is descriptive (not generic like "file1", "temp")
□ Confirmed name follows language/framework conventions
□ Confirmed no version suffix (v1, v2, new, updated, etc.)
□ Confirmed not duplicating existing file content
□ If similar file exists, editing that file instead
□ If replacing old file, archiving old file first

If all checked , proceed with creation.
If any , STOP and re-evaluate.
```

### When to Archive:
```bash
# Create archive folder if needed
mkdir -p archive/

# Move old file with git (preserves history)
git mv old_version.py archive/
git commit -m "archive: replaced by new_version.py"
```

### Emergency Fix:
If you realize you created a duplicate file:
1. Consolidate unique content into canonical file
2. Delete duplicate
3. Update any references
4. Commit: `git commit -m "fix: remove duplicate file"`

## Project-Specific Notes

### Local Development URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | User dashboard |
| Admin | http://localhost:5174 | Admin dashboard |
| Website | http://localhost:3000 | Marketing site (Next.js) |
| CMS | http://localhost:1338 | Strapi admin panel |
| Windmill | http://localhost | Workflow orchestration |
| Docs | http://localhost:5175 | VitePress docs (when running) |

### Windmill Access

**Web UI:**
- URL: http://localhost
- Email: admin@familybrain.com (Windmill admin)
- Password: FamilyBrain2025!Admin

**App Login (Frontend at localhost:5173):**
- Email: admin@family.local
- Password: FamilyBrain2025!Admin

**Tokens (from environment variables):**
| Token Type | Environment Variable | Use Case |
|------------|---------------------|----------|
| MCP Token | `WINDMILL_MCP_TOKEN` | Claude Code MCP integration (limited scope) |
| User Token | `WINDMILL_TOKEN` | Script deployment, full admin access |

**Note:** Tokens are stored in `Infrastructure/.env` - never commit actual tokens to git.

**MCP URL:** `http://localhost/api/mcp/w/family-brain/sse?token=$WINDMILL_MCP_TOKEN`

### Scripts Configuration

All Python scripts in `scripts/` use a centralized configuration module:

```python
from config import WINDMILL_URL, WINDMILL_WORKSPACE, get_windmill_token
```

**Configuration file:** `scripts/config.py`

**Required environment variables:**
| Variable | Purpose | Example |
|----------|---------|---------|
| `WINDMILL_TOKEN` | API access for script deployment | Get from Windmill UI > Settings > Tokens |
| `WINDMILL_MCP_TOKEN` | MCP integration (limited scope) | Get from Windmill UI > Settings > Tokens |
| `JWT_SECRET` | Auth token signing | Random 32+ character string |

**Optional variables:**
| Variable | Default | Purpose |
|----------|---------|---------|
| `WINDMILL_URL` | `http://localhost` | Windmill server URL |
| `WINDMILL_WORKSPACE` | `family-brain` | Workspace name |
| `DEFAULT_TENANT_ID` | (none) | Default tenant for testing |

**Setup:**
```bash
# Copy example and fill in values
cp Infrastructure/.env.example Infrastructure/.env

# Or export directly
export WINDMILL_TOKEN=your-token-here
```

**Note:** Docker Desktop must be running for Windmill. Start with: `cd windmill-setup && docker compose up -d`

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Backend** | Windmill (workflows) | Docker |
| **Database** | PostgreSQL + pgvector | 16 |
| **AI - Embeddings** | Cohere Embed v4 | 1024-dim |
| **AI - Generation** | Cohere Command A/R, Groq Llama 3.3/4 | - |
| **AI - Transcription** | Groq Whisper large-v3-turbo | - |
| **Frontend** | React + Vite + shadcn/ui | React 19, Vite 7 |
| **Admin** | React + Vite + shadcn/ui | React 19, Vite 7 |
| **Website** | Next.js + Tailwind + shadcn/ui | Next.js 16 |
| **CMS** | Strapi | 5.32 |
| **Docs** | VitePress | - |
| **CSS** | Tailwind CSS | v3 (frontend), v4 (admin/website) |

### Current Features (v0.5.0 AI-Powered Family Intelligence)

**Document Management:**
- PDF upload with text extraction
- AI Enhanced mode with auto-categorization, smart tags, expiry detection
- OCR for scanned documents (client-side Tesseract.js)
- Document search with semantic similarity

**Voice Notes:**
- Browser-based audio recording
- Groq Whisper transcription (80+ languages)
- Auto-embedding for RAG queries

**Dashboard Widgets:**
- Expiry Alerts - Documents expiring soon (urgent/soon/upcoming)
- Tag Cloud - Browse documents by AI-extracted tags
- Analytics - Usage stats and cost tracking

**Authentication:**
- JWT-based auth with refresh tokens
- Family member management with roles (admin/member)
- Invite system with token-based onboarding

### Architecture: Multi-Tenant SaaS

**Tenants = Families** - Each family is a billing/isolation unit with:
- Unique slug for URL routing (`archevi.ca/f/{slug}`)
- Plan-based limits (AI allowance, max members, storage)
- Stripe integration for billing

**Users can belong to multiple families** with different roles:
- `owner` - Full control, billing access
- `admin` - Manage members, all documents
- `member` - Add/view documents, chat
- `viewer` - Read-only access

### Key Database Tables (Migration 003)
```
tenants - Families with billing, plans, AI config
users - Global user accounts
tenant_memberships - Links users to families with roles
documents - Tenant-scoped documents with embeddings
chat_sessions - Tenant-scoped conversations
ai_usage - Per-tenant AI cost tracking
provisioning_queue - Async tenant setup tasks
```

### Windmill Scripts

**Tenant Management** (`f/tenant/`):
- `provision_tenant` - Create new family
- `provisioning_worker` - Process async setup queue
- `get_user_tenants` - List user's families
- `switch_tenant` - Change active family context
- `invite_to_tenant` - Invite members

**Chatbot** (`f/chatbot/`):
- `rag_query` - Main RAG pipeline with adaptive model selection
- `embed_document` - Generate embeddings with Cohere Embed v4
- `embed_document_enhanced` - AI-enhanced embedding with auto-categorization, smart tags, expiry detection
- `transcribe_voice_note` - Groq Whisper transcription with auto-embedding
- `get_tags` - Get all unique document tags with counts
- `get_expiring_documents` - Get documents with upcoming expiry dates
- `get_analytics` - Dashboard analytics (multi-tenant aware)
- `health_check` - System health monitoring
- `auth_login` - JWT authentication
- `auth_signup` - User + tenant creation (for marketing site signup)
- `auth_set_password` - Set password (invited users)
- `auth_request_password_reset` - Request password reset
- `auth_verify_token` - Verify JWT token validity
- `parse_pdf` - PDF text extraction

### URL Strategy
Path-based routing for MVP: `archevi.ca/f/{tenant_slug}`
- No wildcard DNS needed
- Tenant resolved from URL path
- JWT contains tenant context after login

### Test Data
Run `f/tenant/test_multi_tenant_system` to create:
- 5 test users (test-*@archevi.ca)
- 3 test families (test-hudson, test-chen, test-starter)
- 7 test documents across families
- Multi-family memberships for testing

### Admin Dashboard (Private - Not on GitHub)

**URL:** http://localhost:5174

The admin dashboard is a separate React application for internal system administration. It is NOT part of the public GitHub repository.

**Starting the Admin Dashboard:**
```bash
cd admin
pnpm install
pnpm dev
```

**Features:**
- **System Health**: Real-time service status monitoring (Windmill, PostgreSQL, Cohere)
- **Tenant Management**: Create, edit, suspend tenants with usage stats
- **RAG System**: Document listing, embedding stats, query analytics
- **Database Monitoring**: PostgreSQL stats, table sizes, pgvector indexes
- **Billing**: API costs by provider/tenant, MTD costs, projections
- **Windmill Integration**: Jobs, scripts, flows, schedules
- **Branding**: Per-tenant theming with 6 preset options

**Admin-Specific Windmill Scripts** (`f/admin/` and `f/chatbot/`):
| Script | Purpose |
|--------|---------|
| `f/admin/list_tenants` | List all tenant accounts |
| `f/admin/get_tenant_details` | Full tenant info with members/usage |
| `f/admin/update_tenant` | Modify tenant settings (with audit logging) |
| `f/admin/log_admin_action` | Log admin action to audit trail |
| `f/admin/get_admin_audit_logs` | Fetch audit logs with filtering |
| `f/admin/backup_database` | Create database backup |
| `f/admin/restore_database` | Restore from backup |
| `f/admin/list_backups` | List available backups |
| `f/chatbot/health_check` | Backend service health monitoring |
| `f/chatbot/create_tenant` | Create new tenant |
| `f/chatbot/admin_list_documents` | Document listing with pagination |
| `f/chatbot/get_api_costs` | Usage cost breakdown |
| `f/chatbot/get_embedding_stats` | Vector database metrics (pgvector) |
| `f/chatbot/get_query_stats` | RAG query analytics |
| `f/chatbot/get_database_stats` | PostgreSQL/pgvector info |
| `f/chatbot/get_tenant_branding` | Theme configuration |
| `f/chatbot/update_tenant_branding` | Save theme changes |
| `f/chatbot/list_theme_presets` | Available color schemes |
| `f/chatbot/apply_theme_preset` | Apply preset to tenant |

**Tech Stack:**
- React 19 + TypeScript + Vite 7
- shadcn/ui components (Radix UI primitives)
- Tailwind CSS 4
- Hash-based client-side routing

### Marketing Website (website/)

**URL:** http://localhost:3000

The marketing website is a Next.js 16 application for public-facing content.

**Starting the Website:**
```bash
cd website
pnpm install
pnpm dev
```

**Features:**
- Landing page with features, pricing, testimonials
- Blog (from Strapi CMS)
- FAQ page (from Strapi CMS)
- Signup flow with tenant provisioning
- SEO-optimized with SSR

**Tech Stack:**
- Next.js 16 + TypeScript
- shadcn/ui components
- Tailwind CSS 4
- Strapi API client for CMS content

### Strapi CMS (cms/)

**URL:** http://localhost:1338/admin

The CMS manages marketing content for the website.

**Starting Strapi:**
```bash
cd cms
npm install
npm run develop
```

**Content Types:**
- **Blog Posts** - Articles with rich text, images, categories
- **FAQs** - Questions/answers with categories
- **Announcements** - Site-wide banners
- **Changelog** - Version release notes

**Tech Stack:**
- Strapi 5.32
- SQLite (development) / PostgreSQL (production)
- REST API for content delivery

## Key Resources

- Session Log: [[Claude_Session_Log.md]]
- Session Archive: [[Claude_Session_Archive.md]]
- Project Overview: [[00_PROJECT_OVERVIEW.md]]
- Master Instructions: [[Master_Claude_Project_Instructions.md]]
- User Profile: [[00_USER_PROFILE.md]]

---

## Feature Sync Workflow

### Purpose
Keep Perplexity marketing documentation in sync with the canonical feature list in README.md.

### Source of Truth
**README.md** is the authoritative source for all features. Marketing docs (Product Brief, Custom Instructions) derive from it.

### When to Sync

**Automatic triggers:**
- After closing a feature/bug task in Beads
- Before major releases (to catch drift)
- When README.md is significantly updated

### How to Sync

**Option 1: Slash Command**
```
/sync-features
```

**Option 2: Run Script Directly**
```bash
cd C:/Users/RHudson/Desktop/Claudius/Projects/FamilySecondBrain
python scripts/feature_sync.py
```

### What It Does

1. Extracts features from README.md (current, coming soon, future)
2. Compares against:
   - `03_Learning/Perplexity Learning/Archevi_Product_Brief.md`
   - `03_Learning/Perplexity Learning/Perplexity_Custom_Instructions.md`
3. Reports missing features (does NOT auto-apply changes)
4. User reviews and applies diffs manually

### Files Involved

| File | Role |
|------|------|
| `README.md` | Source of truth |
| `scripts/feature_sync.py` | Comparison script |
| `.claude/agents/feature-sync/agent.md` | Agent definition |
| `.claude/commands/sync-features.md` | Slash command |
| `03_Learning/Perplexity Learning/Archevi_Product_Brief.md` | Marketing doc |
| `03_Learning/Perplexity Learning/Perplexity_Custom_Instructions.md` | Perplexity Spaces context |

### Example Output
```
# Feature Sync Report
==================================================

README: 66 current, 4 coming soon

## Product Brief
OK - all features found

## Custom Instructions
Missing: 5
  - Duplicate detection
  - Smart category defaults
  ...
```

### Workflow: Adding a New Feature

1. Implement feature in code
2. Update README.md with feature description
3. Close the Beads task
4. Run `/sync-features` to check drift
5. Apply suggested changes to Perplexity docs
6. Commit all changes together


---

## Perplexity Spaces & Marketing Documentation

### Business Model (CRITICAL)
**Archevi is SaaS-only, NOT open-source.**
- Primary: Hosted SaaS ($14.99-$24.99 CAD/month)
- Secondary: Enterprise license available (on-premise, full code, custom pricing)
- There is NO free community edition or open-source option

### Source of Truth Hierarchy
1. **README.md** - Canonical feature list
2. **Archevi_Product_Brief.md** - Marketing source of truth
3. **Perplexity_Custom_Instructions.md** - Space-specific context

### Perplexity Learning Folder Structure
```
03_Learning/Perplexity Learning/
├── Archevi_Product_Brief.md          # Product positioning (Dec 4, 2025)
├── Perplexity_Custom_Instructions.md # 8 Space custom instructions
├── Perplexity_Labs_Prompt_Library.md # 8 Labs prompts for deliverables
├── Perplexity_Execution_Tracker.csv  # Progress tracking
├── Execution_Checklist.md            # Step-by-step guide
├── Quick_Reference_Card.md           # Quick start guide
├── README.md                         # Folder overview
├── Competitive Intelligence/         # 3 research files
├── Market Intelligence and Validation/ # 3 research files
├── Launch Platform Research/         # 5 research files
├── Partnership and Distribution/     # 1 research file
├── Content and SEO Opportunities/    # 2 research files
├── Pricing and Monetization/         # 2 research files
├── Technical Landscape/              # 2 research files
└── Emerging Trends and Timing/       # 2 research files
```

### 8 Perplexity Spaces
| Space | Purpose | Files |
|-------|---------|-------|
| 1. Competitive Intelligence | Positioning, market gaps | 3 |
| 2. Market Intelligence | Pain points, user stories | 3 |
| 3. Launch Platform Research | Launch plans, media outreach | 5 |
| 4. Partnership & Distribution | Partner programs, outreach | 1 |
| 5. Content & SEO | Blog topics, editorial calendar | 2 |
| 6. Pricing & Monetization | Pricing validation, unit economics | 2 |
| 7. Technical Differentiation | Privacy messaging, RAG explainers | 2 |
| 8. Emerging Trends & Timing | "Why Now?" narrative, press angles | 2 |

### Key Differentiators (Use in All Marketing)
- **Visibility Controls**: Everyone / Adults Only / Admins Only / Private
- **Member Types**: Admin / Adult / Teen / Child
- **Person Assignment**: Assign documents to specific family members
- **AI Workflow Visualization**: Watch the AI search in real-time
- **Canadian Focus**: PIPEDA compliant, CAD pricing, Canadian data residency

### When Updating Marketing Docs
1. Update README.md first (source of truth)
2. Run `/sync-features` to check drift
3. Update Archevi_Product_Brief.md if needed
4. Update Perplexity_Custom_Instructions.md for affected Spaces
5. Commit all changes together

### Status (Dec 4, 2025)
- Product Brief: COMPLETE and aligned
- Custom Instructions: COMPLETE (8 Spaces)
- Labs Prompt Library: COMPLETE (84 self-host refs removed)
- Research folders: READY for upload
- Perplexity Spaces: NOT YET CREATED (manual setup in Perplexity Pro)


---

## NEXT SESSION TODO (Updated Dec 10, 2025)

### Immediate Priority
- [ ] Set up 8 Perplexity Spaces (manual in Perplexity Pro)
- [ ] Run P0 Labs prompts (Competitive Dashboard, Voice of Customer, Launch Campaign, Content System, Pricing Toolkit)
- [ ] Add project screenshots or demo GIF to README

### Marketing & Launch Prep
- [x] ~~Product Brief created~~ DONE (Dec 4)
- [x] ~~Custom Instructions for 8 Spaces~~ DONE (Dec 4)
- [x] ~~Labs Prompts updated (84 self-host refs removed)~~ DONE (Dec 4)
- [x] ~~Feature Sync Agent created~~ DONE (Dec 4)
- [x] ~~Updated Perplexity Custom Instructions to v0.4.0~~ DONE (Dec 8)
- [ ] Execute Perplexity Labs prompts
- [ ] Create launch timeline from Lab 3 output

### v0.5.0 Features (In Development)
- [x] ~~Marketing website (archevi.ca)~~ DONE (Dec 12) - Next.js 16 + Strapi CMS
- [x] ~~Self-service signup with tenant provisioning~~ DONE (Dec 12) - Cross-domain auth flow
- [ ] Browser extension for web clipping
- [ ] Email notifications for expiring documents
- [ ] Payment processing integration (Stripe)

### v0.4.x Features (COMPLETED)
- [x] ~~PDF visual search~~ DONE (Dec 10) - Page-level visual search with Cohere Embed v4
- [x] ~~Secure links~~ DONE (Dec 10) - Password-protected sharing with view limits
- [x] ~~Calendar integration~~ DONE (Dec 9) - iCal subscription for expiry dates
- [x] ~~Document version history~~ DONE (Dec 8) - Timeline view with rollback
- [x] ~~Multi-model AI selection~~ DONE (Dec 8) - 6 models with frontend selector
- [x] ~~Query templates~~ DONE (Dec 7) - Pre-built queries by category
- [x] ~~Search suggestions~~ DONE (Dec 7) - Autocomplete with keyboard navigation
- [x] ~~Related documents~~ DONE (Dec 7) - Vector similarity recommendations
- [x] ~~Document sharing~~ DONE (Dec 6) - Share between tenants
- [x] ~~Usage alerts~~ DONE (Dec 6) - Threshold notifications
- [x] ~~Admin dashboard~~ DONE (Dec 6) - System health, tenant management, API costs
- [x] ~~Automated database backup~~ DONE (Dec 7) - psycopg2-based backup/restore
- [x] ~~Rate limiting~~ DONE (Dec 6) - Plan-based, PostgreSQL-backed
- [x] ~~Admin audit logging~~ DONE (Dec 8) - Full audit trail
- [x] ~~pgvector optimization~~ DONE (Dec 6) - Iterative index scans
- [x] ~~Image embedding~~ DONE (Dec 5) - Cohere Embed v4 multimodal

### Infrastructure (COMPLETED)
- [x] ~~Production Docker Compose config~~ DONE (Dec 7)
- [x] ~~CI/CD pipeline with GitHub Actions~~ DONE (Dec 7)
- [x] ~~Automated database backup strategy~~ DONE (Dec 7)
- [x] ~~Admin audit logging~~ DONE (Dec 8)
- [x] ~~Claude agents for deployment~~ DONE (Dec 7) - windmill-deployer, python-backend

### Nice-to-Have
- [ ] Deep Search mode (multi-step research)
- [ ] ElevenLabs audio document support
- [ ] Gmail deep integration

---

## Local Network Testing (PWA/Mobile)

### How It Works

The frontend dynamically detects the Windmill API URL at runtime using `window.location.hostname`. This allows testing from any device on the local network without configuration changes.

**Key files:**
- `frontend/src/api/windmill/client.ts` - `getBaseUrl()` method auto-detects host
- `frontend/.env.local` - Does NOT set `VITE_WINDMILL_URL` for local dev (intentional)
- `windmill-setup/Caddyfile` - Reverse proxy config (no CORS headers - Windmill handles them)

### To Test on Phone/Tablet

1. **Start the dev server with network binding:**
   ```bash
   cd frontend
   pnpm run dev --host 0.0.0.0
   ```

2. **Find your PC's IP address:**
   ```bash
   ipconfig | findstr "IPv4"
   # Example: 192.168.40.72
   ```

3. **Access from phone:**
   - Frontend: `http://192.168.40.72:5173`
   - The API calls automatically use the same IP

4. **Login credentials:**
   - Email: `admin@family.local`
   - Password: `FamilyBrain2025!Admin`

### Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Failed to fetch" | Duplicate CORS headers | Ensure Caddyfile has NO CORS headers (Windmill handles them) |
| "Failed to fetch" | Wrong API URL | Check browser console - URL should match your access IP |
| Phone can't connect | Firewall | Add Windows Firewall rule for ports 80 and 5173 |
| Login works on localhost but not IP | CORS duplicate | Restart Caddy after Caddyfile changes |

### Security Notes for Production

**Local development uses permissive settings that MUST be changed for production:**

1. **CORS:** Windmill's default `Access-Control-Allow-Origin: *` is fine for dev but should be restricted in production:
   - Set specific allowed origins in Windmill config
   - Or configure Caddy to add proper CORS headers with specific domains

2. **API URL:** For production, set `VITE_WINDMILL_URL` in `.env.production`:
   ```
   VITE_WINDMILL_URL=https://api.archevi.ca
   ```

3. **Tokens:** The `VITE_WINDMILL_TOKEN` in `.env.local` is for dev only. Production should use proper auth flow.

4. **HTTPS:** Production MUST use HTTPS. Update Caddyfile:
   ```
   archevi.ca {
       reverse_proxy /* http://windmill_server:8000
       # Caddy auto-provisions TLS
   }
   ```

---

## Recent Session Summary (Dec 12, 2025)

### Completed This Session

**December 12, 2025 - Marketing Website & Auth Flow (Phase 4-5)**
- Completed marketing website (website/) with Next.js 16 + Strapi CMS
- Implemented self-service signup flow with cross-domain authentication
- Created AuthCallback component for handling marketing site -> dashboard auth
- Fixed APICosts React hooks order violation in admin dashboard
- Comprehensive documentation update

**Key Files Created/Modified:**
- `website/` - Complete Next.js 16 marketing site
  - Landing page, pricing, blog, FAQ pages
  - Signup form with tenant provisioning
  - Strapi CMS integration for content
- `cms/` - Strapi 5 CMS with content types
  - Blog posts, FAQs, Announcements, Changelog
  - Testimonials, Features, Legal Pages
- `frontend/src/components/auth/AuthCallback.tsx` - NEW - Cross-domain auth handler
- `frontend/src/App.tsx` - Added /auth/callback route handling
- `admin/src/components/billing/api-costs.tsx` - Fixed React hooks order
- `scripts/auth_signup.py` - Windmill script for user+tenant creation

---

## Recent Session Summary (Dec 9-10, 2025)

### Completed These Sessions

**December 10, 2025 - PDF Visual Search**
- Implemented page-level visual search using Cohere Embed v4 multimodal
- Created `search_pdf_pages` tool in RAG agent for visual content queries
- Backend: `get_pdf_page_embeddings.py`, visual search in `rag_query_agent.py`
- Frontend: `PageSource` components with thumbnail previews, similarity scores
- SSE streaming: Added `visual_search` event type with started/complete status
- Finds specific pages containing charts, diagrams, handwritten notes

**December 10, 2025 - Secure Links**
- Implemented password-protected document sharing with external parties
- Database migration `011_secure_links.sql` with secure_links table
- Windmill scripts: `create_secure_link.py`, `access_secure_link.py`, `list_secure_links.py`, `revoke_secure_link.py`
- Frontend: `SecureLinksDialog` component with link management
- Features: Password protection (bcrypt), view limits, expiration options, revocation

**December 9, 2025 - Calendar Integration**
- iCal subscription feed for document expiry dates
- Database migration `011_calendar_feeds.sql`
- Windmill scripts: `get_calendar_settings.py`, `generate_calendar_feed.py`
- Frontend: `CalendarIntegration` component in Settings
- Works with Google Calendar, Apple Calendar, Outlook

**December 8, 2025 - Multi-Model Selection & Audit Logging**
- Implemented custom AI model selection (6 models: Groq Llama 3.3/4 Scout/4 Maverick, Cohere Command A/R+/R)
- Added ModelSelector component with provider grouping and localStorage persistence
- Comprehensive admin audit logging (migration 008)
- Activity Logs UI with tabs for "Admin Actions" vs "System Jobs"

### Key New Files (Dec 9-10)
- `Infrastructure/migrations/011_secure_links.sql` - Secure links table
- `Infrastructure/migrations/011_calendar_feeds.sql` - Calendar feeds table
- `scripts/create_secure_link.py` - Generate secure sharing URLs
- `scripts/access_secure_link.py` - Validate and access secure links
- `scripts/list_secure_links.py` - List tenant's secure links
- `scripts/revoke_secure_link.py` - Revoke secure links
- `scripts/get_calendar_settings.py` - Calendar feed settings
- `scripts/generate_calendar_feed.py` - Generate iCal feed
- `scripts/get_pdf_page_embeddings.py` - Get page-level embeddings
- `frontend/src/components/documents/SecureLinksDialog.tsx` - Secure link management
- `frontend/src/components/settings/CalendarIntegration.tsx` - Calendar settings
- `frontend/src/components/ai-elements/sources.tsx` - PageSource components for visual search

---

## Recent Session Summary (Nov 30, 2025 - Late Night)

### Completed This Session
1. Fixed local network testing for PWA/mobile
2. Made API URL dynamic (auto-detects from browser location)
3. Fixed duplicate CORS headers in Caddyfile
4. Documented local testing setup and production security notes

### Key Changes
- `frontend/src/api/windmill/client.ts` - Dynamic `getBaseUrl()` instead of static URL
- `frontend/.env.local` - Removed hardcoded `VITE_WINDMILL_URL`
- `windmill-setup/Caddyfile` - Removed CORS headers (Windmill handles them)

### Root Cause
Caddy was adding CORS headers AND Windmill was adding them, resulting in duplicate `Access-Control-Allow-Origin: *, *` which browsers reject.

---

## Recent Session Summary (Nov 28, 2025 - Evening)

### Completed This Session
1. VitePress documentation updated for v0.3.0
2. Tenant creation UI with dialog form
3. Tenant editing UI with settings dialog
4. Advanced search filters (date range, tags)
5. New Windmill scripts: create_tenant, update_tenant, search_documents_advanced
6. All changes pushed to GitHub

### Key Files Changed
- `docs/` - Updated API, architecture, FAQ, usage docs
- `frontend/src/components/admin/AdminView.tsx` - Create/edit dialogs
- `frontend/src/components/documents/DocumentBrowser.tsx` - Advanced filters
- `frontend/src/api/windmill/types.ts` - New types for tenant CRUD, advanced search
- `frontend/src/api/windmill/client.ts` - New API methods
- `scripts/create_tenant.py` - New admin script
- `scripts/update_tenant.py` - New admin script
- `scripts/search_documents_advanced.py` - Advanced search with filters

### Previous Session (Earlier Nov 28)
1. Multi-tenant RAG isolation - VERIFIED (4/4 tests pass)
2. Admin dashboard with tenant management
3. TypeScript build errors fixed

### Test Results
| Test | Result |
|------|--------|
| Hudson queries own docs | PASS |
| Chen queries own docs | PASS |
| Cross-tenant blocked | PASS |
| Admin APIs work | PASS |
| Frontend build | PASS |

---

**This file is the authoritative guide for Claude Code when working on this project.**

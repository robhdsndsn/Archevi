# FamilySecondBrain - Claude Code Project

## Project Overview
RAG-powered family knowledge base chatbot using Windmill, Cohere, and pgvector

## Location
C:/Users/RHudson/Desktop/Claudius/Projects/FamilySecondBrain

## Created
2025-11-26 by RHudson

## Project Structure

This project follows Master_Claude_Project_Instructions.md standards:

```
FamilySecondBrain/
├── 00_PROJECT_OVERVIEW.md # Project details and technical stack
├── Claude_Session_Log.md # Active session log (current status)
├── Claude_Session_Archive.md # Complete historical record
├── CLAUDE.md # This file (Claude Code instructions)
├── README.md # Project documentation
├── .claude/ # Claude Code configuration
│ ├── agents/ # Project-specific subagents
│ └── commands/ # Custom slash commands
├── 01_Planning/ # Requirements and planning
├── 02_Development/ # Code notes and development
├── 03_Learning/ # Key insights and learnings
└── 04_Output/ # Deliverables and output
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

### Windmill Access

**Web UI:**
- URL: http://localhost
- Email: admin@familybrain.com
- Password: FamilyBrain2025!Admin

**Tokens:**
| Token Type | Token | Use Case |
|------------|-------|----------|
| MCP Token | `oCtiDUVTlVfzJWqAyQAb5wseem1Qgmd3` | Claude Code MCP integration (limited scope) |
| User Token | `t8u4sIJRGhaHPqLn0VuUPUPbWSa9uTyi` | Script deployment, full admin access |

**MCP URL:** `http://localhost/api/mcp/w/family-brain/sse?token=oCtiDUVTlVfzJWqAyQAb5wseem1Qgmd3`

**Note:** Docker Desktop must be running for Windmill. Start with: `cd windmill-setup && docker compose up -d`

### Tech Stack
- **Backend**: Windmill (workflow orchestration), PostgreSQL + pgvector
- **AI**:
 - Cohere (Embed v4 for 1024-dim vectors, Command A/R for generation, Rerank v3)
 - Groq (Whisper large-v3-turbo for voice transcription)
- **Frontend**: React + Vite + shadcn/ui + Tailwind + Tesseract.js (client-side OCR)
- **Docs**: VitePress at archevi.ca/guide

### Current Features (v0.3.0 Multi-Tenant)

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
- `auth_*` - Authentication endpoints
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

## Key Resources

- Session Log: [[Claude_Session_Log.md]]
- Session Archive: [[Claude_Session_Archive.md]]
- Project Overview: [[00_PROJECT_OVERVIEW.md]]
- Master Instructions: [[Master_Claude_Project_Instructions.md]]
- User Profile: [[00_USER_PROFILE.md]]

---

## NEXT SESSION TODO (Updated Nov 30, 2025)

### Immediate (GitHub Polish)
- [x] ~~Rewrite GitHub README for public visibility~~ DONE
- [ ] Add project screenshots or demo GIF
- [x] ~~Create marketing-focused feature list highlighting multi-tenant~~ DONE (in README)
- [x] ~~Document deployment instructions for self-hosting~~ DONE (in README)

### High Priority Features
- [x] ~~Tenant creation/editing UI in admin dashboard~~ DONE
- [x] ~~Advanced search filters (date range, tags)~~ DONE
- [x] ~~Member invitation system (email-based)~~ DONE (backend + UI complete, email optional via Resend)
- [ ] Document expiry notification emails
- [ ] Mobile-responsive improvements
- [x] ~~Deploy new Windmill scripts (create_tenant, update_tenant, search_documents_advanced)~~ DONE

### Medium Priority
- [ ] Bulk document import (ZIP upload)
- [ ] Document sharing between tenant members
- [ ] Export chat history as PDF
- [ ] Replace browser scrollbars with shadcn ScrollArea
- [ ] Add skeleton loading states for RAG responses

### Infrastructure
- [ ] Production Docker Compose config
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Automated database backup strategy
- [ ] Per-tenant rate limiting

### Nice-to-Have
- [ ] Multi-language OCR selection
- [ ] Document versioning
- [ ] Custom AI model selection per query
- [ ] Usage alerts and notifications
- [ ] Admin audit logging

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

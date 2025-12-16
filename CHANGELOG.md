# Changelog

All notable changes to Archevi are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.1] - 2025-12-15

### Security
- **Removed Hardcoded Tokens** - All API tokens removed from source code
  - Created `scripts/config.py` centralized configuration module
  - Updated 20+ deploy scripts to use environment variables
  - Updated shell scripts (`test_full_flow.sh`, `deploy_script.ps1`) for env vars
  - Added security notice to historical development logs
  - Tokens now loaded from `Infrastructure/.env` or environment variables

### Changed
- Updated `CLAUDE.md` with Scripts Configuration section documenting env vars
- Updated `.claude/agents/windmill-deployer/agent.md` curl examples to use `$WINDMILL_TOKEN`
- Updated `Infrastructure/.env.example` with all required variables

---

## [0.5.0] - 2025-12-12

### Added
- **Marketing Website** - Complete Next.js 16 marketing site at archevi.ca
  - Landing page with hero, features, testimonials, and CTAs
  - Pricing page with plan comparison and billing toggle
  - Blog with Strapi CMS integration (categories, pagination)
  - FAQ page with category tabs, accordion, and search filtering
  - Signup page with form validation and tenant provisioning
  - Responsive design with mobile-first approach
  - SEO-optimized with sitemap.xml and robots.txt

- **Strapi CMS Integration** - Content management for marketing
  - 7 content types: Blog Posts, FAQs, Announcements, Changelog, Testimonials, Features, Legal Pages
  - REST API client with type-safe TypeScript interfaces
  - ISR (Incremental Static Regeneration) for content updates
  - Announcement banner with location-based filtering

- **Self-Service Signup** - Complete tenant provisioning flow
  - SignupForm with email, password (strength indicator), family name
  - Windmill `auth_signup.py` script creates user and tenant
  - Cross-domain authentication using URL fragment tokens
  - AuthCallback component handles redirect from marketing site to dashboard
  - JWT token verification and auth state initialization

### Fixed
- **APICosts React Hooks Error** - Fixed "Rendered more hooks than during the previous render" error
  - Moved `usePagination` hooks before early return statements
  - Hooks must be called in the same order every render

### Infrastructure
- Added website/ folder with Next.js 16 + shadcn/ui + Tailwind CSS 4
- Added cms/ folder with Strapi 5 CMS
- New auth components: AuthCallback.tsx for cross-domain auth flow
- Updated App.tsx with /auth/callback route handling

---

## [0.4.9] - 2025-12-10

### Added
- **Billing & Subscription UI** - Complete subscription management in Settings
  - PricingTable component with monthly/yearly billing toggle
  - 4 plan tiers: Trial (free), Starter ($9/mo), Family ($19/mo), Family Office ($49/mo)
  - Plan comparison with features, limits, and pricing
  - UsageMetrics component with progress bars for storage, AI spend, documents, queries, members
  - Warning states at 80% and exceeded at 100% with visual indicators
  - BillingSubscription component with subscription status management
  - Cancel/resume subscription with confirmation dialogs
  - Payment method display and update flows
  - Invoice and billing history buttons
  - Full integration into SettingsView

- **Biography Generator** - AI-powered family member biographies
  - Generate narratives from document history
  - 4 writing styles: Narrative, Chronological, Achievements, Personal
  - Word count slider (500-3000 words)
  - Historical context toggle
  - Source citations from documents
  - Copy to clipboard and download options
  - Windmill backend: `generate_biography.py`

- **Browser Text-to-Speech** - Free document reading
  - Uses Web Speech API (free, no API costs)
  - Voice selection from system voices
  - Speed and pitch controls
  - Play/pause/stop functionality
  - Progress bar visualization
  - 10,000 character limit (vs 5,000 for paid ElevenLabs)
  - Compact and full modes

- **ElevenLabs TTS Integration** (Available but disabled by default)
  - High-quality AI voices
  - Voice selector with previews
  - Advanced settings (stability, similarity boost, style)
  - AudioPlayer with Web Audio API waveform visualization

### Changed
- TextToSpeech component now uses free browser TTS by default
- ElevenLabs reserved for future premium feature

---

## [0.4.8] - 2025-12-10

### Added
- **Family Timeline** - Visual chronological view of family events and milestones
  - Vertical timeline with color-coded event types (birth, death, wedding, medical, legal, etc.)
  - AI-powered event extraction from documents using Groq Llama 3.3 70B
  - Manual event creation with date picker and event type selector
  - Filter by year and event type with collapsible filter panel
  - Summary badges showing event distribution across categories
  - Events linked to source documents with click-through navigation
  - Family member association for events
  - Confidence scores for AI-extracted events
  - Database migration `015_timeline_events.sql` with helper functions
  - Windmill scripts: `generate_timeline_events.py`, `get_timeline_events.py`, `manage_timeline_event.py`
  - Timeline component in sidebar navigation

---

## [0.4.7] - 2025-12-10

### Added
- **Two-Factor Authentication (2FA)** - TOTP-based security for user accounts
  - Authenticator app support (Google Authenticator, Authy, 1Password, etc.)
  - QR code setup flow in Settings with manual secret entry fallback
  - 6-digit TOTP verification with 30-second time window
  - 10 backup codes for account recovery (SHA-256 hashed storage)
  - Login flow with 2FA challenge step
  - Enable/disable 2FA with password confirmation
  - Database migration `014_two_factor_auth.sql` with two_factor_sessions table
  - Windmill scripts: `auth_setup_2fa.py`, `auth_verify_2fa.py`, `auth_disable_2fa.py`, `auth_generate_backup_codes.py`, `auth_verify_backup_code.py`
  - TwoFactorAuth component in Settings with complete setup wizard
  - Updated LoginPage with 2FA verification and backup code support

### Security
- TOTP secrets stored encrypted in database (pyotp library)
- Backup codes stored as SHA-256 hashes, shown once during generation
- 2FA sessions expire after 5 minutes
- Account lockout protection remains active during 2FA flow

---

## [0.4.6] - 2025-12-10

### Added
- **PDF Visual Search** - Page-level visual search within PDF documents
  - Multimodal embeddings for each PDF page using Cohere Embed v4
  - Visual search tool in RAG agent: `search_pdf_pages`
  - Page thumbnail previews with OCR text overlay
  - SSE streaming events: `visual_search` with started/complete status
  - PageSource components displaying similarity scores and page context
  - Finds specific pages containing visual content (charts, handwritten notes, diagrams)

### Changed
- RAG agent now has two search tools: `search_documents` (text) and `search_pdf_pages` (visual)
- ChatContainer handles `visual_searching` stream status with distinct UI feedback
- ChatMessage displays both document sources and page sources separately

---

## [0.4.5] - 2025-12-10

### Added
- **Secure Links** - Password-protected document sharing with external parties
  - Database migration `011_secure_links.sql` with secure_links table
  - Generate unique shareable URLs with configurable settings:
    - Password protection (optional, hashed with bcrypt)
    - View limits (1, 5, 10, 25, unlimited views)
    - Expiration options (1 hour to 1 year, or never)
  - Windmill scripts: `create_secure_link.py`, `access_secure_link.py`, `list_secure_links.py`, `revoke_secure_link.py`
  - SecureLinksDialog component with link management UI
  - Share button in document list view (list, grid, context menu)
  - View tracking and automatic expiration/revocation

### Security
- Secure links use cryptographically random tokens (secrets.token_urlsafe)
- Passwords stored as bcrypt hashes, never in plaintext
- Access validated server-side before returning document content

---

## [0.4.4] - 2025-12-09

### Security
- **Search Suggestions Tenant Isolation** - Fixed multi-tenant data leak where search suggestions (documents, people, tags, entities, categories) could show results from other tenants. All suggestion queries now properly filter by `tenant_id`.

---

## [0.4.3] - 2025-12-08

### Added
- **Document Version History** - Track changes to documents over time with full rollback support
  - Visual timeline showing all versions with change types (initial, update, correction, major_revision)
  - One-click rollback to any previous version (creates new version, preserving history)
  - Version metadata: timestamps, author, file size, change summary
  - History tab in document detail view (mobile drawer and desktop dialog)
  - Database migration `010_document_versioning.sql` with helper functions
  - Windmill scripts: `get_document_versions.py`, `rollback_document_version.py`, `create_document_version.py`

## [0.4.2] - 2025-12-07

### Added
- **Query Templates** - Pre-built queries organized by category
  - 7 categories: Insurance, Medical, Financial, Legal, Family, Important Dates, General
  - 35 total queries to help users get started quickly
  - Featured templates section on welcome screen with "More suggestions" dialog
- **Search Suggestions** - Autocomplete as you type
  - Document titles, people, tags, categories
  - Recent queries and extracted entities
  - Grouped results with icons and keyboard navigation
- **Bulk Upload Tests** - 14 unit tests for BulkUpload component

### Fixed
- Bulk upload content extraction - documents now properly searchable after upload
- Mobile navigation drawer accessibility

## [0.4.1] - 2025-12-06

### Added
- **Multi-Model AI Selection** - Choose from 6 AI models
  - Groq: Llama 3.3 70B, Llama 4 Scout (vision), Llama 4 Maverick
  - Cohere: Command A, Command R+, Command R
  - Model selector in chat settings with localStorage persistence
- **Usage Alerts** - Threshold-based notifications for quota management
  - Database migration `009_usage_alerts.sql`
  - Configurable alert thresholds in admin dashboard
  - In-app notification banner with expandable UI
- **Related Documents** - AI-powered document recommendations
  - Vector similarity search using existing embeddings
  - Related tab in document detail view (mobile/desktop)
  - Compact and full display modes

### Changed
- pgvector queries now use iterative index scans (`hnsw.iterative_scan = strict_order`)
- Improved filtered search performance for tenant_id/visibility queries

## [0.4.0] - 2025-12-05

### Added
- **Admin Dashboard** - Comprehensive administration interface
  - System Health monitoring with service status cards
  - Tenant Management with edit/view dialogs, storage quotas, usage stats
  - API Costs tracking with provider/tenant breakdown and projections
  - Admin audit logging for compliance (tracks all admin actions)
- **Document Sharing** - Share documents between tenant accounts
  - Database migration `007_document_sharing.sql`
  - Share dialog in document list (list/grid views, context menus)
  - Visibility controls for shared documents
- **Rate Limiting** - PostgreSQL-backed per-tenant limits
  - Plan-based tiers: trial=15, starter=30, family=60, family_office=120 req/min
  - Response includes plan info and remaining quota
- **Automated Database Backups**
  - Scheduled backups: daily (2 AM), weekly (Sundays 3 AM), monthly (1st 4 AM ET)
  - Retention policy: 7/28/365 days
  - Comprehensive backup/restore guide in docs

### Changed
- Upgraded to Cohere Production API (no monthly cap)
- Stress testing validated: 100% success at 3 concurrent requests

### Infrastructure
- Production Docker Compose with dual-network architecture
- Caddyfile with auto HTTPS via Let's Encrypt
- CI workflow (tests, build, lint) and CD workflow (GHCR publish, SSH deploy)
- Claude Code agents: windmill-deployer, python-backend

## [0.3.0] - 2024-11-30

### Added
- **Privacy Controls** - Document visibility levels
  - Everyone, Adults Only, Admins Only, Private
  - Server-side visibility filtering by member type
- **Member Types** - Admin, Adult, Teen, Child access levels
- **Person Assignment** - Assign documents to specific family members
- **AI Workflow Visualization** - See AI thinking process in real-time
- **PDF Export** - Export chat conversations with source citations
- **Duplicate Detection** - Warns before uploading duplicate documents
- **Document Preview on Hover** - Quick preview without opening
- **Bulk Operations** - Multi-select with checkboxes, bulk delete
- **Image Embedding** - Cohere Embed v4 for visual search
- **On-demand AI Data Extraction** - Extract structured data from documents
- **Smart Category Defaults** - Remembers your upload preferences
- **Keyboard Shortcuts** - Cmd+K (command palette), Cmd+U (upload), Cmd+N (new chat)

### Fixed
- Database schema issues (tags column, is_active column)
- Resource path in tenant scripts
- Mobile-responsive improvements

## [0.2.0] - 2024-11-15

### Added
- Multi-tenant architecture with complete data isolation
- Member invitation system (email-based)
- Analytics and usage tracking
- OCR for scanned documents (20 languages)
- Voice note recording and transcription (80+ languages via Groq Whisper)
- Expiry alerts dashboard (urgent/soon/upcoming)
- Mobile PWA with camera scanning
- Tag cloud for browsing by topic
- Advanced filtering (date range, category, person, tags)

### Changed
- Migrated to Cohere Embed v4 (1024-dimension Matryoshka embeddings)
- Implemented Cohere Rerank for better search relevance

## [0.1.0] - 2024-10-01

### Added
- Initial release
- Core RAG pipeline with source citations
- Document upload, search, and management
- AI-enhanced document processing (auto-tags, categories, expiry detection)
- PDF text extraction
- Natural language search
- Family accounts with isolated storage
- Basic authentication (JWT with refresh tokens)

---

## Migration Notes

### Upgrading to 0.4.3
Run the database migration:
```sql
-- Apply migration
\i Infrastructure/migrations/010_document_versioning.sql
```

### Upgrading to 0.4.0
1. Apply migrations 007-009
2. Update environment variables for production deployment
3. Configure backup schedules in Windmill

---

[0.5.0]: https://github.com/archevi/archevi/compare/v0.4.9...v0.5.0
[0.4.9]: https://github.com/archevi/archevi/compare/v0.4.8...v0.4.9
[0.4.8]: https://github.com/archevi/archevi/compare/v0.4.7...v0.4.8
[0.4.7]: https://github.com/archevi/archevi/compare/v0.4.6...v0.4.7
[0.4.6]: https://github.com/archevi/archevi/compare/v0.4.5...v0.4.6
[0.4.5]: https://github.com/archevi/archevi/compare/v0.4.4...v0.4.5
[0.4.4]: https://github.com/archevi/archevi/compare/v0.4.3...v0.4.4
[0.4.3]: https://github.com/archevi/archevi/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/archevi/archevi/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/archevi/archevi/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/archevi/archevi/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/archevi/archevi/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/archevi/archevi/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/archevi/archevi/releases/tag/v0.1.0

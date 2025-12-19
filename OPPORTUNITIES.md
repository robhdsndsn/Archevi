# Project Improvement Opportunities

**Generated:** December 18, 2025
**Project:** Archevi v0.5.0

This document outlines opportunities for cleanup, consistency improvements, and strategic enhancements.

---

## 1. Environment Variables & Configuration

### 1.1 Hardcoded Values That Should Be Env Vars

**Email Configuration (scripts/email_service.py)**
```python
BRAND_CONFIG = {
    "from_email": "Archevi <hello@archevi.ca>",
    "reply_to": "support@archevi.ca",
    "logo_url": "https://archevi.ca/logo.png",
    "app_url": "https://app.archevi.ca",
    "marketing_url": "https://archevi.ca",
    "docs_url": "https://docs.archevi.ca",
}
```

**Recommendation:** Move to environment variables
```python
BRAND_CONFIG = {
    "from_email": os.getenv("BRAND_FROM_EMAIL", "Archevi <hello@archevi.ca>"),
    "reply_to": os.getenv("BRAND_REPLY_TO", "support@archevi.ca"),
    "logo_url": os.getenv("BRAND_LOGO_URL", "https://archevi.ca/logo.png"),
    "app_url": os.getenv("APP_URL", "https://app.archevi.ca"),
    "marketing_url": os.getenv("MARKETING_URL", "https://archevi.ca"),
    "docs_url": os.getenv("DOCS_URL", "https://docs.archevi.ca"),
}
```

**Calendar Feed Base URL (scripts/get_calendar_settings.py)**
```python
FEED_BASE_URL = "https://archevi.ca/api/calendar"
```

**Recommendation:** Use environment variable
```python
FEED_BASE_URL = os.getenv("CALENDAR_FEED_BASE_URL", "https://archevi.ca/api/calendar")
```

### 1.2 Missing Website .env.example

**Issue:** Website has `.env.production.example` but no `.env.example` for local dev

**Recommendation:** Create `website/.env.example`:
```bash
# Development Environment Variables
NEXT_PUBLIC_STRAPI_URL=http://localhost:1338
NEXT_PUBLIC_APP_URL=http://localhost:5173
NEXT_PUBLIC_DOCS_URL=http://localhost:5175
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost
NEXT_PUBLIC_WINDMILL_WORKSPACE=family-brain
```

---

## 2. Code Consistency Issues

### 2.1 TODO Comments to Address

**High Priority:**

1. **Auth System - tenant_id Workaround** (4 occurrences)
   - `frontend/src/components/chat/ChatContainer.tsx:22`
   - `frontend/src/components/documents/DocumentBrowser.tsx:79`
   - `frontend/src/components/documents/DocumentUpload.tsx:60`
   - `frontend/src/components/documents/VoiceNoteRecorder.tsx:21`

   All have: `// TODO: Remove this when auth properly returns tenant_id`

   **Action:** Update auth system to include tenant_id in JWT payload, then remove hardcoded fallback to `'test-hudson'`

2. **2FA Status Check** (`frontend/src/components/settings/TwoFactorAuth.tsx:60`)
   ```typescript
   const [is2FAEnabled, setIs2FAEnabled] = useState(false); // TODO: Get from user profile
   ```

   **Action:** Add 2FA status to user profile endpoint

3. **Missing Delete Tenant Endpoint** (`admin/src/components/tenants/tenant-list.tsx:753`)
   ```typescript
   // TODO: Add delete endpoint to Windmill
   ```

   **Action:** Create `f/admin/delete_tenant` script in Windmill

### 2.2 Inconsistent URL Patterns

**Frontend API Client:**
- Uses dynamic hostname detection (`window.location.hostname`)
- Good for local network testing but hardcoded fallbacks exist

**Admin Dashboard:**
- Hardcoded localhost references in multiple components
- `database-stats.tsx`: `data?.postgres.host || "localhost"`
- `system-settings.tsx`: Default values point to localhost

**Recommendation:** Create central config file:
```typescript
// frontend/src/config/env.ts
export const CONFIG = {
  windmill: {
    url: import.meta.env.VITE_WINDMILL_URL || getWindmillUrl(),
    workspace: import.meta.env.VITE_WINDMILL_WORKSPACE || 'family-brain',
  },
  strapi: {
    url: import.meta.env.VITE_STRAPI_URL || 'http://localhost:1338',
  },
  app: {
    url: import.meta.env.VITE_APP_URL || window.location.origin,
  }
}

function getWindmillUrl() {
  if (typeof window === 'undefined') return 'http://localhost';
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}`;
}
```

---

## 3. Strapi CMS Opportunities

### 3.1 Current Content Types (7)

1. **Blog Posts** - Articles, tutorials, changelog posts
2. **FAQs** - Categorized questions and answers
3. **Announcements** - Site-wide banners and notifications
4. **Changelog** - Version release notes
5. **Testimonials** - Customer quotes and feedback
6. **Features** - Feature descriptions for marketing
7. **Legal Pages** - Privacy Policy, Terms of Service, etc.

### 3.2 New Content Type Opportunities

#### A. **Product Roadmap**
**Why:** Public transparency, align customer expectations

**Fields:**
- `title` (string) - Feature name
- `description` (rich text) - Feature details
- `status` (enum) - In Development, Planned, Under Review, Shipped
- `quarter` (string) - Q1 2026, Q2 2026, etc.
- `votes` (integer) - Customer vote count
- `category` (relation to Feature) - Links to feature page
- `tags` (array) - AI, Search, Mobile, etc.

**Use Cases:**
- `/roadmap` page showing upcoming features
- Customer voting/feedback system
- Newsletter content automation

#### B. **Help Center Articles**
**Why:** Reduce support load, improve onboarding

**Fields:**
- `title` (string)
- `content` (rich text with images)
- `category` (enum) - Getting Started, Documents, AI Search, Billing, etc.
- `difficulty` (enum) - Beginner, Intermediate, Advanced
- `views` (integer) - Track popularity
- `related_articles` (relation) - Suggest related help
- `video_url` (string) - Optional YouTube/Vimeo link

**Use Cases:**
- `/help` searchable knowledge base
- Context-aware help widgets in app
- Onboarding tour content

#### C. **Use Cases / Success Stories**
**Why:** Social proof, SEO, content marketing

**Fields:**
- `customer_name` (string)
- `family_size` (integer)
- `location` (string) - Toronto, Vancouver, etc.
- `challenge` (rich text) - Problem before Archevi
- `solution` (rich text) - How they use Archevi
- `results` (rich text) - Outcomes/benefits
- `quote` (text) - Pull quote for homepage
- `image` (media) - Family photo (optional)
- `metrics` (array) - "500 documents organized", "10 hours saved/month"

**Use Cases:**
- `/customers` page
- Email nurture campaigns
- Social media content

#### D. **Integration Guides**
**Why:** Expand ecosystem, technical SEO

**Fields:**
- `service_name` (string) - Gmail, Google Drive, Dropbox, etc.
- `logo` (media)
- `description` (text)
- `setup_steps` (rich text)
- `difficulty` (enum)
- `status` (enum) - Available, Coming Soon, Beta
- `video_tutorial` (string)
- `popular` (boolean) - Feature on homepage?

**Use Cases:**
- `/integrations` page
- SEO for "archevi + gmail integration"
- Feature comparison content

#### E. **Pricing Tiers** (Manage via CMS)
**Why:** A/B testing, seasonal promotions, easy updates

**Fields:**
- `name` (string) - Free, Family, Family Plus, etc.
- `price_monthly` (decimal)
- `price_annual` (decimal)
- `documents` (integer)
- `members` (integer)
- `features` (array of strings) - Bullet list
- `cta_text` (string) - "Start Free Trial" vs "Get Started"
- `popular` (boolean) - Highlight badge
- `hidden` (boolean) - Disable tier temporarily

**Use Cases:**
- Dynamic pricing page
- A/B test pricing copy
- Seasonal promotions (Black Friday)
- Geographic pricing (CAD/USD)

#### F. **Email Templates**
**Why:** Centralize copy, enable marketing team

**Fields:**
- `template_name` (string) - welcome_email, expiry_reminder, etc.
- `subject` (string)
- `preview_text` (string)
- `body_html` (rich text)
- `cta_text` (string)
- `cta_url` (string)
- `footer_text` (text)

**Use Cases:**
- Pull email copy from Strapi instead of hardcoding
- Marketing team edits copy without dev deploy
- A/B test email messaging

### 3.3 Advanced Strapi Features to Leverage

#### Internationalization (i18n)
- Add French/Spanish translations for Canadian market
- `/fr/`, `/es/` URL structure
- Localized pricing (CAD/USD/EUR)

#### Content Scheduling
- Schedule blog posts for future publication
- Seasonal homepage content rotation
- Announcement expiration

#### Webhooks
- Trigger rebuild when content changes
- Notify Slack when new testimonial published
- Sync changelog to GitHub Releases

#### API Tokens with Roles
- Public content (no auth)
- Marketing team (edit blog/FAQ)
- Product team (edit roadmap/changelog)
- Dev team (full access)

---

## 4. Code Cleanup Opportunities

### 4.1 Unused Imports & Dead Code

**Frontend:**
- Search for unused React imports: `grep -r "import React" frontend/src/ | wc -l`
- Check for unused Lucide icons
- Remove commented-out code blocks

**Scripts:**
- Archive old deployment scripts in `scripts/archive/`
- Remove deprecated placeholder files (already done: `.placeholder_*.py`)

### 4.2 Duplicate Code

**Email HTML Templates:**
- `scripts/email_service.py` has inline HTML templates
- Consider moving to Strapi or external template files

**Error Handling Patterns:**
- Standardize try/catch patterns across Python scripts
- Create `scripts/utils/error_handler.py` with common patterns

### 4.3 Type Safety

**Frontend:**
- Add Zod schemas for API responses
- Replace `any` types with proper interfaces (already minimal)

**Python:**
- Add type hints to all function signatures
- Use `TypedDict` for response objects

---

## 5. Testing Opportunities

### 5.1 Missing Test Coverage

**Critical Paths:**
- User signup flow (website → windmill → frontend)
- Document upload with AI enhancement
- RAG query with multi-model selection
- Payment processing (when implemented)

**Test Structure:**
```
tests/
├── unit/               # Pure functions
│   ├── test_embed.py
│   └── test_email_service.py
├── integration/        # Cross-service tests
│   ├── test_rag_flow.py
│   └── test_auth_flow.py
└── e2e/               # Full user flows (Playwright exists)
    ├── signup.spec.ts
    └── document_upload.spec.ts
```

### 5.2 Existing E2E Tests to Expand

Current tests (in `/e2e/`):
- `login.spec.ts` - Basic login
- `rag-query.spec.ts` - Chat functionality
- `accessibility.spec.ts` - A11y checks

**Add:**
- Document upload flow
- Voice note recording
- 2FA setup and verification
- Billing subscription changes
- Calendar feed generation

---

## 6. Performance Opportunities

### 6.1 Frontend Optimization

**Bundle Size:**
- Analyze with `pnpm run build && npx vite-bundle-visualizer`
- Consider lazy loading admin features
- Split vendor chunks more aggressively

**Image Optimization:**
- Use Next.js Image component in website (already doing)
- Lazy load document thumbnails
- Implement progressive image loading

**API Calls:**
- Implement request deduplication
- Add caching layer (React Query or SWR)
- Batch document metadata requests

### 6.2 Backend Optimization

**Database Queries:**
- Add indexes for common queries (already has pgvector index)
- Review N+1 query patterns in Windmill scripts
- Implement connection pooling for high load

**RAG Performance:**
- Cache embeddings for common queries
- Implement semantic cache (similar queries → same answer)
- Add query result pagination

---

## 7. Documentation Opportunities

### 7.1 Missing User Guides

**High Priority:**
- "Getting Started in 5 Minutes" video walkthrough
- "How to Organize Your Documents" best practices guide
- "Understanding Visibility Controls" with examples
- "Setting Up Your Family" invitation workflow

### 7.2 Developer Documentation

**Internal:**
- Windmill script development guide
- How to add new AI models
- Database migration process
- Deployment checklist

**Public:**
- API documentation (if opening public API)
- Webhook integration guide
- Browser extension API (when built)

---

## 8. Security Opportunities

### 8.1 Environment Variable Management

**Current State:**
- Multiple `.env.example` files (good)
- JWT_SECRET generation script exists (good)
- Some hardcoded values remain (see Section 1.1)

**Recommendations:**
1. Create central environment validation script
2. Add environment variable documentation
3. Implement secret rotation schedule

### 8.2 Rate Limiting Enhancements

**Current:**
- Plan-based rate limits exist
- PostgreSQL-backed implementation

**Opportunities:**
- Add IP-based rate limiting for signup
- Implement CAPTCHA for high-risk operations
- Add abuse detection (rapid document deletion, etc.)

---

## 9. Marketing & Content Strategy

### 9.1 Blog Content Ideas (Strapi)

**SEO-Driven:**
1. "How to Organize Family Documents: The Complete Guide"
2. "What to Do When Important Documents Expire"
3. "Family Document Management for Caregivers"
4. "Canadian PIPEDA Compliance for Family Data"
5. "Voice Notes vs. Text: When to Use Each"

**Technical:**
1. "How RAG Works: Making Documents Searchable with AI"
2. "Multi-Tenant Architecture for Family SaaS"
3. "Building a PWA with React and Vite"

**Case Studies:**
1. "How the Hudson Family Organized 15 Years of Documents"
2. "Managing Medical Records for Aging Parents"
3. "Estate Planning Made Easier with Document Management"

### 9.2 FAQ Content Ideas (Strapi)

**Categories:**
- Getting Started (10 questions)
- Security & Privacy (8 questions)
- Billing & Plans (6 questions)
- AI & Search (7 questions)
- Mobile & PWA (5 questions)
- Integrations (4 questions)

**Examples:**
- "Is my data encrypted?"
- "Can I export my documents?"
- "How accurate is the AI extraction?"
- "What happens if I cancel?"
- "Can I use Archevi offline?"

### 9.3 Changelog Strategy (Strapi)

**Current:** CHANGELOG.md in repo (not user-facing)

**Opportunity:** Public changelog at archevi.ca/changelog
- Auto-populated from Strapi
- Email subscribers on major releases
- RSS feed for changelog updates
- Link from in-app notification banner

---

## 10. Integration Opportunities

### 10.1 Planned Integrations (Roadmap)

**Email (Phase 1 - Exists):**
- ✅ Email forwarding (`save@archevi.ca`)
- ⬜ Gmail deep integration (read attachments directly)
- ⬜ Outlook add-in

**Calendar (Phase 2 - Exists):**
- ✅ iCal subscription for expiry dates
- ⬜ Google Calendar two-way sync
- ⬜ Reminder notifications via email

**Browser (Phase 3):**
- ⬜ Chrome extension for web clipping
- ⬜ Firefox extension
- ⬜ Safari extension (iOS 17+)

**Cloud Storage:**
- ⬜ Google Drive import
- ⬜ Dropbox sync
- ⬜ OneDrive integration

**Communication:**
- ⬜ Slack bot for document search
- ⬜ Discord bot
- ⬜ SMS notifications via Twilio

### 10.2 API Strategy

**Current:** Windmill-based REST API (private)

**Opportunities:**
1. **Public API:** Enable third-party integrations
   - Rate-limited per tenant
   - OAuth 2.0 authentication
   - OpenAPI documentation

2. **Webhooks:** Notify external services
   - Document uploaded
   - Expiry date approaching
   - New family member joined

3. **Zapier Integration:** No-code automation
   - Trigger: Document expires soon
   - Action: Create Trello card

---

## Priority Recommendations

### Immediate (Next Sprint)

1. ✅ **Fix tenant_id in auth system** - Remove TODO workarounds
2. ✅ **Create website/.env.example** - Missing local dev config
3. ✅ **Move email config to env vars** - scripts/email_service.py
4. ✅ **Add missing Windmill scripts** - delete_tenant, get_2fa_status

### Short-Term (1 Month)

1. **Strapi content expansion:**
   - Add Help Center content type
   - Populate 20 initial help articles
   - Create 3 use case studies

2. **Code consistency:**
   - Centralize URL configuration
   - Standardize error handling
   - Type safety improvements

3. **Testing:**
   - E2E tests for signup flow
   - Integration tests for RAG pipeline
   - Load testing for concurrent users

### Medium-Term (3 Months)

1. **Strapi advanced features:**
   - Implement i18n (French/Spanish)
   - Content scheduling for blog
   - Email template management

2. **Integrations:**
   - Browser extension MVP
   - Gmail deep integration
   - Public API beta

3. **Performance:**
   - Implement semantic caching
   - Bundle size optimization
   - Database query optimization

---

## Conclusion

The project is in excellent shape with solid foundations. Key opportunities:

1. **Configuration Management** - Centralize and env-ify hardcoded values
2. **Strapi Expansion** - Leverage CMS for roadmap, help center, use cases
3. **Code Consistency** - Resolve TODOs, standardize patterns
4. **Testing** - Expand E2E coverage for critical paths
5. **Content Strategy** - SEO-driven blog, comprehensive FAQ, public changelog

Next steps: Prioritize based on business goals (acquisition vs. retention vs. technical debt).

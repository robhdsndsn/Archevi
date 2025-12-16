# Comprehensive Testing Strategy for Archevi (FamilySecondBrain)

## Executive Summary

This plan establishes a full-gamut testing strategy to stress-test every component of Archevi before launch. The goal is to ensure all competitive advantages are bulletproof with 90%+ code coverage.

---

## Current State Analysis

### Existing Tests
- `frontend/src/components/auth/LoginPage.test.tsx` (10 tests)
- `frontend/src/components/auth/SetPasswordPage.test.tsx` (tests exist)
- `frontend/src/components/documents/BulkUpload.test.ts` (upload tests)
- Test setup configured in `frontend/src/test/setup.ts`
- Python tests: `stress_test.py`, `full_api_test.py`, `run_full_test_battery.py`

### Test Infrastructure
- **Frontend**: Vitest + React Testing Library + jsdom (configured)
- **Admin**: No testing setup (needs installation)
- **Backend**: Python unittest/pytest (partial)
- **E2E**: None configured (need Playwright)

---

## Test Categories

### 1. Unit Tests (Target: 90% coverage)

#### Frontend Components to Test

**Authentication (4 components)**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| LoginPage | auth/LoginPage.tsx | HIGH | DONE |
| SetPasswordPage | auth/SetPasswordPage.tsx | HIGH | DONE |
| ForgotPasswordPage | auth/ForgotPasswordPage.tsx | HIGH | TODO |
| AuthCallback | auth/AuthCallback.tsx | MEDIUM | TODO |

**Chat System (14 components)**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| ChatContainer | chat/ChatContainer.tsx | CRITICAL | TODO |
| ChatInput | chat/ChatInput.tsx | CRITICAL | TODO |
| ChatMessage | chat/ChatMessage.tsx | CRITICAL | TODO |
| ChatHeader | chat/ChatHeader.tsx | MEDIUM | TODO |
| ChatMessageSkeleton | chat/ChatMessageSkeleton.tsx | LOW | TODO |
| AskAIView | chat/AskAIView.tsx | HIGH | TODO |
| ModelSelector | chat/ModelSelector.tsx | MEDIUM | TODO |
| QueryTemplates | chat/QueryTemplates.tsx | MEDIUM | TODO |
| ResearchModeToggle | chat/ResearchModeToggle.tsx | MEDIUM | TODO |
| SearchSuggestions | chat/SearchSuggestions.tsx | MEDIUM | TODO |
| SourcesList | chat/SourcesList.tsx | HIGH | TODO |

**Document Management (20 components)**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| DocumentBrowser | documents/DocumentBrowser.tsx | CRITICAL | TODO |
| DocumentUpload | documents/DocumentUpload.tsx | CRITICAL | TODO |
| FamilyDocumentsList | documents/FamilyDocumentsList.tsx | CRITICAL | TODO |
| BulkUpload | documents/BulkUpload.tsx | HIGH | PARTIAL |
| BulkZipUpload | documents/BulkZipUpload.tsx | HIGH | TODO |
| AddDocumentView | documents/AddDocumentView.tsx | MEDIUM | TODO |
| CameraCapture | documents/CameraCapture.tsx | MEDIUM | TODO |
| DocumentsView | documents/DocumentsView.tsx | HIGH | TODO |
| ExpiryAlerts | documents/ExpiryAlerts.tsx | HIGH | TODO |
| ExtractedDataDisplay | documents/ExtractedDataDisplay.tsx | MEDIUM | TODO |
| RelatedDocuments | documents/RelatedDocuments.tsx | MEDIUM | TODO |
| SecureLinkDialog | documents/SecureLinkDialog.tsx | HIGH | TODO |
| ShareDocumentDialog | documents/ShareDocumentDialog.tsx | HIGH | TODO |
| TagCloud | documents/TagCloud.tsx | LOW | TODO |
| TagSuggestions | documents/TagSuggestions.tsx | MEDIUM | TODO |
| VersionHistory | documents/VersionHistory.tsx | HIGH | TODO |
| VoiceNoteRecorder | documents/VoiceNoteRecorder.tsx | MEDIUM | TODO |

**AI Elements (6 components)**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| Sources | ai-elements/sources.tsx | HIGH | TODO |
| Reasoning | ai-elements/reasoning.tsx | MEDIUM | TODO |
| Suggestion | ai-elements/suggestion.tsx | MEDIUM | TODO |
| Task | ai-elements/task.tsx | MEDIUM | TODO |
| ModelSelector | ai-elements/model-selector.tsx | LOW | TODO |

**Billing and Subscriptions (3 components)**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| PricingTable | billing/PricingTable.tsx | HIGH | TODO |
| UsageMetrics | billing/UsageMetrics.tsx | HIGH | TODO |
| BillingSubscription | billing/BillingSubscription.tsx | HIGH | TODO |

**Settings and Security (2FA)**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| TwoFactorSetup | settings/TwoFactorSetup.tsx | CRITICAL | TODO |
| SecuritySettings | settings/* | HIGH | TODO |

**Family Management**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| FamilyMembersList | family/* | HIGH | TODO |
| AddMemberDialog | family/* | HIGH | TODO |
| BiographyGenerator | family/BiographyGenerator.tsx | MEDIUM | TODO |

**Timeline**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| FamilyTimeline | timeline/FamilyTimeline.tsx | HIGH | TODO |
| TimelineEvent | timeline/* | MEDIUM | TODO |

**Audio/TTS**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| TextToSpeech | audio/TextToSpeech.tsx | MEDIUM | TODO |
| AudioPlayer | audio/AudioPlayer.tsx | MEDIUM | TODO |

**Core UI Components**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| AppSidebar | AppSidebar.tsx | CRITICAL | TODO |
| CommandPalette | CommandPalette.tsx | HIGH | TODO |
| MobileBottomNav | MobileBottomNav.tsx | HIGH | TODO |
| NotificationBanner | NotificationBanner.tsx | MEDIUM | TODO |

**Analytics**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| AnalyticsView | analytics/AnalyticsView.tsx | MEDIUM | TODO |

**Admin View (embedded)**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| AdminView | admin/AdminView.tsx | HIGH | TODO |
| AdminDocumentsView | admin/AdminDocumentsView.tsx | HIGH | TODO |

**Onboarding**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| OnboardingFlow | onboarding/* | HIGH | TODO |

**PWA**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| PWAInstallPrompt | pwa/* | MEDIUM | TODO |

#### Admin Dashboard Components (Separate App)

**Dashboard**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| Overview | dashboard/overview.tsx | HIGH | TODO |
| SystemHealth | dashboard/system-health.tsx | CRITICAL | TODO |
| UsageAlerts | dashboard/usage-alerts.tsx | HIGH | TODO |

**Tenant Management**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| TenantList | tenants/tenant-list.tsx | CRITICAL | TODO |

**RAG Monitoring**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| DocumentsList | rag/documents-list.tsx | HIGH | TODO |
| EmbeddingsStats | rag/embeddings-stats.tsx | HIGH | TODO |
| QueryStats | rag/query-stats.tsx | HIGH | TODO |

**Database**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| DatabaseStats | database/database-stats.tsx | HIGH | TODO |

**Billing**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| APICosts | billing/api-costs.tsx | HIGH | TODO |
| CostProjections | billing/cost-projections.tsx | MEDIUM | TODO |
| UsageTracking | billing/usage-tracking.tsx | HIGH | TODO |

**Settings**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| BrandingSettings | settings/branding-settings.tsx | MEDIUM | TODO |
| SystemSettings | settings/system-settings.tsx | HIGH | TODO |

**Logs**
| Component | File | Priority | Status |
|-----------|------|----------|--------|
| ActivityLog | logs/activity-log.tsx | HIGH | TODO |

---

### 2. Integration Tests

#### Store Tests (Zustand)
| Store | File | Tests Needed |
|-------|------|--------------|
| auth-store | store/auth-store.ts | Login flow, token refresh, logout |
| document-store | store/* | CRUD operations, search |
| chat-store | store/* | Message handling, sessions |
| theme-store | store/* | Theme persistence |
| notification-store | store/* | Alert management |

#### API Client Tests
| Module | File | Tests Needed |
|--------|------|--------------|
| Windmill API | api/windmill.ts | All 14+ endpoints |
| Supabase client | lib/supabase.ts | Auth, storage, RPC |

---

### 3. End-to-End Tests (Playwright)

#### Critical User Flows
| Flow | Description | Priority |
|------|-------------|----------|
| Sign Up Flow | New user registration | CRITICAL |
| Login Flow | Email/password + 2FA | CRITICAL |
| Document Upload | Single file upload with categorization | CRITICAL |
| Bulk Upload | Multiple files via drag-drop | HIGH |
| RAG Query | Ask question, get answer with sources | CRITICAL |
| Family Member Invite | Send invite, accept, join | HIGH |
| Document Search | Semantic search, filters | HIGH |
| Settings Update | Profile, 2FA setup | HIGH |
| Password Reset | Request, email, set new | HIGH |
| Document Sharing | Create secure link | HIGH |
| Timeline View | View events, add manual | MEDIUM |
| Biography Generation | Generate for family member | MEDIUM |
| Calendar Integration | Subscribe to iCal feed | MEDIUM |

#### Admin Flow Tests
| Flow | Description | Priority |
|------|-------------|----------|
| Admin Login | Access admin dashboard | CRITICAL |
| Tenant Creation | Create new tenant | CRITICAL |
| Tenant Management | Edit, suspend, delete | HIGH |
| System Health | Check all services | HIGH |
| Database Stats | View PostgreSQL info | MEDIUM |
| Billing Review | View API costs | MEDIUM |

---

### 4. Accessibility Tests (WCAG 2.1 AA)

#### Automated Checks (axe-core)
- Color contrast ratios (4.5:1 minimum)
- Focus indicators visible
- ARIA labels present
- Keyboard navigation complete
- Screen reader compatibility

#### Manual Checks
| Area | Test Description |
|------|------------------|
| Chat | Can navigate and send messages with keyboard only |
| Documents | Upload, browse, search accessible |
| Forms | All inputs labeled, errors announced |
| Modals | Focus trapped, escape closes |
| Navigation | Skip links, logical tab order |

#### Target Components
- All shadcn/ui components (already accessible)
- Custom components need audit:
  - CommandPalette
  - ChatContainer
  - DocumentBrowser
  - Timeline
  - BiographyGenerator

---

### 5. Visual Regression Tests

#### Storybook + Chromatic (recommended)
| Component Category | Stories Needed |
|--------------------|----------------|
| UI primitives | Button, Input, Card, Dialog |
| Chat components | Message types, loading states |
| Document cards | Various states |
| Forms | All form variations |
| Modals | All dialog types |
| Mobile views | Responsive breakpoints |

---

### 6. Performance Tests

#### Frontend Metrics
| Metric | Target | Tool |
|--------|--------|------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Time to Interactive | < 3.5s | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Bundle size (gzipped) | < 500KB | vite-bundle-analyzer |

#### Backend Metrics
| Metric | Target | Tool |
|--------|--------|------|
| RAG query latency | < 3s | stress_test.py |
| Document embedding | < 5s | Python timing |
| Search response | < 500ms | Python timing |
| Concurrent users | 50+ | k6 or locust |

---

### 7. Backend/API Tests (Python)

#### Authentication Scripts
| Script | Tests Needed |
|--------|--------------|
| auth_login.py | Valid/invalid creds, 2FA flow, rate limiting |
| auth_signup.py | Registration, validation, duplicate check |
| auth_setup_2fa.py | TOTP setup, backup codes |
| auth_verify_2fa.py | Code validation, timing |
| auth_verify_backup_code.py | Code usage, single-use |
| auth_refresh.py | Token refresh flow |
| auth_logout.py | Session cleanup |
| auth_request_password_reset.py | Email sending, token generation |
| auth_set_password.py | Token validation, password rules |

#### Document Processing Scripts
| Script | Tests Needed |
|--------|--------------|
| embed_document.py | Embedding generation, storage |
| embed_document_enhanced.py | Auto-categorization, tags, expiry |
| embed_document_from_storage.py | Supabase file handling |
| embed_image.py | Image embedding |
| extract_text_from_storage.py | PDF, image, text extraction |
| extract_document_data.py | Metadata extraction |
| process_pdf_pages.py | Page-level processing |
| process_zip_upload.py | Archive handling |

#### RAG Scripts
| Script | Tests Needed |
|--------|--------------|
| rag_query.py | Query processing, source citation |
| rag_query_agent.py | Agent tool calling, research mode |
| search_documents.py | Vector search accuracy |
| search_documents_advanced.py | Filters, date ranges |

#### Multi-tenant Scripts
| Script | Tests Needed |
|--------|--------------|
| create_tenant.py | Tenant creation, limits |
| provision_tenant.py | Resource provisioning |
| list_tenants.py | Pagination, filtering |
| update_tenant.py | Plan changes, settings |
| switch_tenant.py | Context switching |

#### Admin Scripts
| Script | Tests Needed |
|--------|--------------|
| get_analytics.py | Usage stats accuracy |
| get_api_costs.py | Cost calculation |
| get_database_stats.py | PostgreSQL metrics |
| get_embedding_stats.py | pgvector health |
| log_admin_action.py | Audit trail |

---

### 8. Database Tests

#### Migration Integrity
| Migration | Test |
|-----------|------|
| All migrations | Idempotent execution |
| Rollback | Each migration reversible |
| Data integrity | Foreign keys, constraints |

#### pgvector Tests
| Test | Description |
|------|-------------|
| Index performance | Vector search under load |
| Embedding storage | 1024-dim vectors stored correctly |
| Similarity search | Cosine similarity accuracy |

---

## Implementation Plan

### Phase 1: Infrastructure Setup (Foundation)

**Task 1.1: Frontend Test Infrastructure**
- [ ] Verify Vitest config in frontend
- [ ] Add test:coverage script
- [ ] Set up coverage thresholds (80% minimum)
- [ ] Add test CI workflow

**Task 1.2: Admin Dashboard Test Setup**
- [ ] Install vitest, testing-library, jsdom
- [ ] Create test/setup.ts
- [ ] Add test scripts to package.json
- [ ] Port setup.ts patterns from frontend

**Task 1.3: E2E Setup (Playwright)**
- [ ] Install Playwright in project root
- [ ] Configure playwright.config.ts
- [ ] Set up test fixtures (auth, database)
- [ ] Create helper functions

**Task 1.4: Accessibility Tooling**
- [ ] Install @axe-core/react
- [ ] Configure axe with vitest
- [ ] Create accessibility test helper

---

### Phase 2: Critical Path Tests

**Task 2.1: Authentication Tests**
- [ ] LoginPage (enhance existing)
- [ ] SetPasswordPage (enhance existing)
- [ ] ForgotPasswordPage tests
- [ ] 2FA setup flow tests
- [ ] Python auth script tests

**Task 2.2: Chat System Tests**
- [ ] ChatContainer tests (message handling)
- [ ] ChatInput tests (submission, validation)
- [ ] ChatMessage tests (rendering, markdown)
- [ ] SourcesList tests (citations)

**Task 2.3: Document Management Tests**
- [ ] DocumentUpload tests (validation, progress)
- [ ] BulkUpload tests (enhance existing)
- [ ] FamilyDocumentsList tests (CRUD)
- [ ] DocumentBrowser tests (search, filter)

---

### Phase 3: E2E Critical Flows

**Task 3.1: Core User Journeys**
- [ ] Complete signup to first query flow
- [ ] Document upload to search flow
- [ ] Family member invitation flow
- [ ] Password reset flow

**Task 3.2: Admin Flows**
- [ ] Tenant creation flow
- [ ] System health monitoring
- [ ] User management flow

---

### Phase 4: Comprehensive Coverage

**Task 4.1: Remaining Frontend Tests**
- [ ] All billing components
- [ ] All settings components
- [ ] Timeline components
- [ ] Analytics views
- [ ] Admin embedded views

**Task 4.2: Admin Dashboard Tests**
- [ ] All dashboard components
- [ ] Tenant management
- [ ] RAG monitoring
- [ ] Database stats

**Task 4.3: Integration Tests**
- [ ] Zustand store tests
- [ ] API client tests
- [ ] Supabase integration tests

---

### Phase 5: Quality and Performance

**Task 5.1: Accessibility Audit**
- [ ] Run axe on all pages
- [ ] Manual keyboard testing
- [ ] Screen reader testing
- [ ] Fix all violations

**Task 5.2: Visual Regression**
- [ ] Set up Storybook (or similar)
- [ ] Create component stories
- [ ] Baseline screenshots

**Task 5.3: Performance Tests**
- [ ] Lighthouse CI setup
- [ ] Bundle analysis
- [ ] Backend load testing

---

### Phase 6: Backend Complete Coverage

**Task 6.1: Python Unit Tests**
- [ ] All auth scripts
- [ ] All document scripts
- [ ] All RAG scripts

**Task 6.2: API Integration Tests**
- [ ] Full API test battery
- [ ] Rate limiting tests
- [ ] Error handling tests

**Task 6.3: Database Tests**
- [ ] Migration tests
- [ ] pgvector tests
- [ ] Backup/restore tests

---

## Test File Naming Convention

```
component.test.tsx       # Unit tests
component.spec.tsx       # Integration tests (alternative)
component.e2e.ts         # E2E tests (Playwright)
component.a11y.test.tsx  # Accessibility tests
script_test.py           # Python unit tests
```

---

## Coverage Targets

| Category | Target |
|----------|--------|
| Frontend components | 90% |
| Admin components | 85% |
| Stores (Zustand) | 95% |
| API clients | 90% |
| Python scripts | 80% |
| E2E critical paths | 100% |
| Accessibility | WCAG 2.1 AA |

---

## Test Commands

```bash
# Frontend unit tests
cd frontend && pnpm test

# Frontend with coverage
cd frontend && pnpm test:coverage

# Admin tests (after setup)
cd admin && pnpm test

# E2E tests (after Playwright setup)
pnpm exec playwright test

# Python tests
cd scripts && python -m pytest

# Full test battery
python scripts/run_full_test_battery.py
```

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Large test scope | Prioritize critical paths first |
| Test flakiness | Use proper async handling, retry logic |
| CI time | Parallelize tests, use caching |
| Mock complexity | Create reusable test fixtures |
| Coverage gaps | Weekly coverage reviews |

---

## Success Criteria

1. All CRITICAL priority tests passing
2. 90% code coverage on frontend
3. 85% code coverage on admin
4. Zero accessibility violations (critical)
5. All E2E critical paths green
6. Performance targets met
7. Zero security test failures

---

## Estimated Component Count

| Category | Components | Tests Needed |
|----------|------------|--------------|
| Frontend Auth | 4 | 40+ |
| Frontend Chat | 14 | 100+ |
| Frontend Documents | 20 | 150+ |
| Frontend Other | 25 | 150+ |
| Admin Dashboard | 15 | 100+ |
| Stores | 5 | 50+ |
| API Clients | 2 | 30+ |
| Python Scripts | 60+ | 200+ |
| E2E Flows | 15 | 50+ |
| **TOTAL** | **160+** | **870+** |

---

## UX Test Scenarios

### User Experience Tests (Manual + Automated)

#### Onboarding UX
| Scenario | Test Description | Type |
|----------|------------------|------|
| First-time user | Clear path from landing to first query | Manual |
| Empty states | Helpful guidance when no documents | Manual |
| Error recovery | User can recover from any error | E2E |
| Progress indicators | User knows what's happening | Manual |

#### Chat UX
| Scenario | Test Description | Type |
|----------|------------------|------|
| Query response time | User sees typing indicator | E2E |
| Source visibility | Citations are clear and clickable | E2E |
| Follow-up queries | Context maintained | E2E |
| Mobile experience | Usable on small screens | E2E |

#### Document UX
| Scenario | Test Description | Type |
|----------|------------------|------|
| Upload feedback | Progress clear during upload | E2E |
| Categorization | Auto-suggestions helpful | Manual |
| Search results | Results match user intent | E2E |
| Bulk operations | Multi-select works smoothly | E2E |

#### Settings UX
| Scenario | Test Description | Type |
|----------|------------------|------|
| 2FA setup | QR code visible, instructions clear | E2E |
| Profile update | Changes save with confirmation | E2E |
| Theme switching | Instant, smooth transition | Manual |

---

## Notes

- This is the most comprehensive testing effort for Archevi
- Focus on critical paths first to get value quickly
- Tests serve as documentation for behavior
- Maintain tests as features evolve
- CI must pass before any merge to main

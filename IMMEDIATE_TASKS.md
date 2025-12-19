# Immediate Priority Tasks

**Created:** December 18, 2025
**From:** OPPORTUNITIES.md analysis

These are the highest-priority items to tackle next. Add to Beads when daemon is running.

---

## 🔴 Critical - Auth System

### ARCH-001: Fix tenant_id auth workaround (4 TODOs)

**Type:** Bug
**Priority:** P1 (Highest)
**Labels:** auth, frontend, backend

**Description:**
Remove hardcoded 'test-hudson' fallback in auth system. Update JWT payload to include tenant_id properly.

**Affected Files:**
- `frontend/src/components/chat/ChatContainer.tsx:22`
- `frontend/src/components/documents/DocumentBrowser.tsx:79`
- `frontend/src/components/documents/DocumentUpload.tsx:60`
- `frontend/src/components/documents/VoiceNoteRecorder.tsx:21`

All have: `// TODO: Remove this when auth properly returns tenant_id`

**Solution Steps:**
1. Update `scripts/auth_login.py` to include tenant_id in JWT payload
2. Update `frontend/src/store/auth-store.ts` to extract tenant_id from token
3. Remove fallback logic from all 4 files
4. Test auth flow end-to-end (signup → login → tenant switch)

**Acceptance Criteria:**
- [ ] JWT payload includes `tenant_id` field
- [ ] Auth store properly decodes and stores tenant_id
- [ ] All 4 TODO comments removed
- [ ] Auth flow works without hardcoded fallback
- [ ] Multi-tenant switching works correctly

---

## 🟡 High Priority - Configuration

### ARCH-002: Move email config to environment variables

**Type:** Task
**Priority:** P2
**Labels:** backend, config, security

**Description:**
Hardcoded email and domain values in `scripts/email_service.py` should be environment variables.

**Current Code:**
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

**Solution:**
1. Update `scripts/email_service.py` to read from env vars
2. Add to `Infrastructure/.env.example`:
   ```bash
   BRAND_FROM_EMAIL=Archevi <hello@archevi.ca>
   BRAND_REPLY_TO=support@archevi.ca
   BRAND_LOGO_URL=https://archevi.ca/logo.png
   APP_URL=https://app.archevi.ca
   MARKETING_URL=https://archevi.ca
   DOCS_URL=https://docs.archevi.ca
   ```
3. Test email sending still works

**Acceptance Criteria:**
- [ ] Email config uses env vars with sensible defaults
- [ ] All email scripts work in dev and prod
- [ ] Documentation updated

---

### ARCH-003: Create website/.env.example

**Type:** Task
**Priority:** P2
**Labels:** frontend, config, documentation

**Description:**
Website has `.env.production.example` but missing `.env.example` for local development.

**Solution:**
Create `website/.env.example`:
```bash
# Development Environment Variables
NEXT_PUBLIC_STRAPI_URL=http://localhost:1338
NEXT_PUBLIC_APP_URL=http://localhost:5173
NEXT_PUBLIC_DOCS_URL=http://localhost:5175
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost
NEXT_PUBLIC_WINDMILL_WORKSPACE=family-brain
# NEXT_PUBLIC_WINDMILL_TOKEN= (optional for local dev)
# NEXT_PUBLIC_GA_MEASUREMENT_ID= (optional)
```

**Acceptance Criteria:**
- [ ] `.env.example` created with all required vars
- [ ] README.md updated with setup instructions
- [ ] Tested that website starts with example config

---

### ARCH-004: Centralize URL configuration

**Type:** Refactor
**Priority:** P2
**Labels:** frontend, admin, config

**Description:**
Multiple hardcoded localhost URLs across frontend and admin. Create central config.

**Affected Files:**
- `frontend/src/components/settings/SettingsView.tsx` - `http://localhost`
- `admin/src/components/database/database-stats.tsx` - `localhost`
- `admin/src/components/system-settings.tsx` - `http://localhost`
- `admin/src/components/windmill/jobs-list.tsx` - `http://localhost/user/runs`

**Solution:**
1. Create `frontend/src/config/env.ts`:
   ```typescript
   export const CONFIG = {
     windmill: {
       url: import.meta.env.VITE_WINDMILL_URL || getWindmillUrl(),
       workspace: import.meta.env.VITE_WINDMILL_WORKSPACE || 'family-brain',
     },
     strapi: {
       url: import.meta.env.VITE_STRAPI_URL || 'http://localhost:1338',
     },
   }

   function getWindmillUrl() {
     if (typeof window === 'undefined') return 'http://localhost';
     const protocol = window.location.protocol;
     const hostname = window.location.hostname;
     return `${protocol}//${hostname}`;
   }
   ```

2. Create similar file for admin: `admin/src/config/env.ts`

3. Replace all hardcoded URLs with config imports

**Acceptance Criteria:**
- [ ] Central config files created for frontend and admin
- [ ] All hardcoded URLs replaced with config references
- [ ] Works on localhost, local network IP, and production
- [ ] No broken links in either app

---

## 🟢 Medium Priority - Backend

### ARCH-005: Add get_2fa_status endpoint

**Type:** Feature
**Priority:** P3
**Labels:** backend, auth, 2fa

**Description:**
Frontend 2FA component has TODO: `Get from user profile`

**Location:** `frontend/src/components/settings/TwoFactorAuth.tsx:60`

**Solution:**
1. Create `scripts/get_2fa_status.py`:
   ```python
   def main(user_id: str, tenant_id: str):
       # Query database for user's 2FA status
       return {
           "enabled": bool,
           "totp_enabled": bool,
           "backup_codes_remaining": int
       }
   ```

2. Deploy to Windmill: `f/chatbot/get_2fa_status`

3. Update frontend to call endpoint

4. Remove TODO comment

**Acceptance Criteria:**
- [ ] Windmill script created and deployed
- [ ] Frontend fetches real 2FA status
- [ ] UI reflects actual state (enabled/disabled)
- [ ] TODO removed

---

### ARCH-006: Add delete_tenant endpoint

**Type:** Feature
**Priority:** P3
**Labels:** backend, admin, tenant-management

**Description:**
Admin tenant list has TODO for delete functionality.

**Location:** `admin/src/components/tenants/tenant-list.tsx:753`

**Solution:**
1. Create `scripts/delete_tenant.py`:
   ```python
   def main(tenant_id: str, admin_user_id: str, reason: str):
       # Soft delete: set is_active = false
       # Log admin action
       # Return success/error
   ```

2. Deploy to Windmill: `f/admin/delete_tenant`

3. Add confirmation dialog in admin UI

4. Update tenant list to call endpoint

5. Remove TODO comment

**Acceptance Criteria:**
- [ ] Windmill script created with soft delete
- [ ] Admin action logged for audit
- [ ] Confirmation dialog prevents accidental deletion
- [ ] Deleted tenants don't appear in list
- [ ] TODO removed

---

### ARCH-007: Move calendar feed URL to env var

**Type:** Task
**Priority:** P3
**Labels:** backend, config

**Description:**
Hardcoded calendar feed base URL in `scripts/get_calendar_settings.py`

**Current Code:**
```python
FEED_BASE_URL = "https://archevi.ca/api/calendar"
```

**Solution:**
1. Update script:
   ```python
   FEED_BASE_URL = os.getenv("CALENDAR_FEED_BASE_URL", "https://archevi.ca/api/calendar")
   ```

2. Add to `Infrastructure/.env.example`:
   ```bash
   CALENDAR_FEED_BASE_URL=https://archevi.ca/api/calendar
   ```

3. Test calendar subscription still works

**Acceptance Criteria:**
- [ ] Environment variable used with sensible default
- [ ] iCal subscription URLs work correctly
- [ ] Documentation updated

---

## 📋 Checklist Summary

**Critical (P1):** 1 task
**High Priority (P2):** 3 tasks
**Medium Priority (P3):** 3 tasks

**Total:** 7 immediate tasks

---

## To Add to Beads:

When Beads daemon is running, use these commands:

```bash
# Auth system fix
bd create "Fix tenant_id auth workaround (4 TODOs)" \
  --type bug \
  --priority 1 \
  --description "See IMMEDIATE_TASKS.md ARCH-001"

# Email config
bd create "Move email config to environment variables" \
  --type task \
  --priority 2 \
  --description "See IMMEDIATE_TASKS.md ARCH-002"

# Website env
bd create "Create website/.env.example" \
  --type task \
  --priority 2 \
  --description "See IMMEDIATE_TASKS.md ARCH-003"

# URL centralization
bd create "Centralize URL configuration" \
  --type task \
  --priority 2 \
  --description "See IMMEDIATE_TASKS.md ARCH-004"

# 2FA status
bd create "Add get_2fa_status endpoint" \
  --type feature \
  --priority 3 \
  --description "See IMMEDIATE_TASKS.md ARCH-005"

# Delete tenant
bd create "Add delete_tenant endpoint" \
  --type feature \
  --priority 3 \
  --description "See IMMEDIATE_TASKS.md ARCH-006"

# Calendar URL
bd create "Move calendar feed URL to env var" \
  --type task \
  --priority 3 \
  --description "See IMMEDIATE_TASKS.md ARCH-007"
```

---

## Next Steps

1. Start Beads daemon if needed
2. Add issues using commands above
3. Tackle ARCH-001 first (critical auth fix)
4. Move through P2 tasks
5. Complete P3 tasks when time allows

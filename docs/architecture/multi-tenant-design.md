# Multi-Tenant Architecture

::: tip Version 0.3.0
Multi-tenant isolation has been implemented and verified. Cross-tenant data access is completely blocked.
:::

## Overview

Archevi supports users belonging to multiple families (tenants) with different roles. This enables use cases like:

- Adult children managing elderly parents' family + their own
- Divorce/blended families with separate knowledge bases
- Professional organizers managing multiple clients

## Data Model

### Core Entities

```
Users (Global)
    |
    +-- tenant_memberships --+-- Tenants (Families)
                             |
                             +-- documents
                             +-- chat_sessions
                             +-- ai_usage
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | Global user accounts (email, password, preferences) |
| `tenants` | Families/organizations (billing, limits, AI config) |
| `tenant_memberships` | Links users to tenants with roles |
| `documents` | Tenant-scoped document storage |
| `chat_sessions` | Tenant-scoped conversation history |
| `ai_usage` | Per-tenant AI cost tracking |

### Roles

| Role | Permissions |
|------|-------------|
| `owner` | Full control, billing, delete tenant |
| `admin` | Manage members, all documents, settings |
| `member` | Add/edit own documents, chat |
| `viewer` | Read-only access, can chat |

## User Flow

### 1. Signup - New User, New Family

```
1. User signs up with email/password
2. System creates User record
3. User enters family name (e.g., "The Hudson Family")
4. System generates slug (hudson.archevi.ca)
5. System provisions tenant:
   - Create tenant record
   - Create owner membership
   - Queue Stripe setup
   - Configure subdomain
   - Send welcome email
6. User lands in their new family
```

### 2. Invite - Existing User Joins Family

```
1. Admin invites user by email
2. System creates pending membership with invite token
3. Email sent with invite link
4. User clicks link:
   - If existing user: Accept invite, add membership
   - If new user: Signup flow, then auto-accept
5. User now has access to both families
```

### 3. Family Switching

```
1. User logs in
2. System loads user's tenants via get_user_tenants()
3. UI shows family selector in sidebar
4. User clicks different family
5. System switches context (tenant_id in session)
6. All queries scoped to new tenant
```

## Frontend Integration

### Session Context

```typescript
interface SessionContext {
  user: {
    id: string;
    email: string;
    name: string;
  };
  currentTenant: {
    id: string;
    name: string;
    slug: string;
    role: 'owner' | 'admin' | 'member' | 'viewer';
    plan: string;
  };
  availableTenants: Tenant[];
}
```

### Family Switcher Component

```tsx
function FamilySwitcher() {
  const { currentTenant, availableTenants, switchTenant } = useSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {currentTenant.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {availableTenants.map(tenant => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => switchTenant(tenant.id)}
          >
            {tenant.name}
            <Badge>{tenant.role}</Badge>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => createNewFamily()}>
          + Create New Family
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## API Integration

### All API Calls Include tenant_id

```python
# Windmill script pattern
def rag_query(tenant_id: str, user_id: str, query: str):
    # Verify user has access to tenant
    if not user_has_tenant_access(user_id, tenant_id):
        raise PermissionError("Access denied")

    # All queries scoped to tenant
    docs = db.query("""
        SELECT * FROM documents
        WHERE tenant_id = %s
        ORDER BY embedding <-> %s
        LIMIT 5
    """, [tenant_id, query_embedding])

    # Track usage per tenant
    track_ai_usage(tenant_id, user_id, 'generate', tokens)
```

### JWT Token Structure

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "tenant_id": "current_tenant_id",
  "role": "member",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Tenant Isolation

### Data Isolation

- All tenant-scoped tables have `tenant_id` column
- Indexes include `tenant_id` for efficient filtering
- Row Level Security (RLS) available for direct DB access
- No cross-tenant queries possible through API

### Verified Isolation Testing

The multi-tenant isolation has been tested and verified:

| Test Case | Expected | Result |
|-----------|----------|--------|
| Family A queries own documents | Returns Family A docs only | PASS |
| Family B queries own documents | Returns Family B docs only | PASS |
| Family A queries for Family B data | No results (blocked) | PASS |
| Family B queries for Family A data | No results (blocked) | PASS |

**RAG queries are fully isolated** - the vector similarity search includes a mandatory `tenant_id` filter, ensuring documents from other tenants are never returned regardless of semantic similarity.

### Billing Isolation

- Each tenant has own Stripe customer
- AI usage tracked per tenant
- Overages billed to tenant's payment method

### URL Routing

Path-based routing for simplicity:

```
archevi.ca/f/hudson -> tenant_id: abc123
archevi.ca/f/smith  -> tenant_id: def456
```

Subdomain routing (`hudson.archevi.ca`) is planned for future releases.

## Provisioning Flow

### Automatic Steps

```
1. create_tenant     - Insert tenant record
2. setup_stripe      - Create Stripe customer, subscription
3. configure_subdomain - Update DNS/routing
4. send_welcome_email - Welcome + getting started guide
5. complete          - Mark provisioning done
```

### Provisioning Queue

```sql
SELECT * FROM provisioning_queue
WHERE status = 'pending'
ORDER BY created_at;
```

Worker processes queue items, retries on failure.

## Migration from Single-Tenant

For existing users on old schema:

1. Create default tenant
2. Migrate `family_members` -> `users`
3. Create memberships linking users to default tenant
4. Migrate `family_documents` -> `documents` with tenant_id
5. Update frontend to use new API

See migration SQL in `003_multi_tenant_schema.sql`.

## Security Considerations

### Access Control

- Every API call validates `user_has_tenant_access()`
- Role checked for sensitive operations
- Audit log tracks cross-tenant access attempts

### Data Leakage Prevention

- No endpoints return data from multiple tenants
- Search is always tenant-scoped
- Error messages don't reveal other tenant info

### BYOK Mode

- API keys stored encrypted per tenant
- Keys never shared between tenants
- Key rotation affects single tenant only

# API Key Management Architecture

## Overview

Archevi uses a **hybrid model** for Cohere API key management:

1. **Default**: Archevi-managed API key (zero-friction onboarding)
2. **Optional**: Bring Your Own Key (BYOK) for privacy-conscious users

This eliminates the friction of requiring users to create a Cohere account during signup while preserving the privacy option for those who want it.

---

## Architecture

### Default Mode: Archevi-Managed Key

```
User Query
    |
    v
+-------------------+
|   Archevi API     |
+-------------------+
    |
    v
+-------------------+
| Usage Metering    |  <-- Track tokens per tenant
+-------------------+
    |
    v
+-------------------+
| Cohere API        |  <-- Single production key
| (Archevi Account) |
+-------------------+
    |
    v
Response to User
```

**How it works:**
- Archevi holds a single Cohere production API key
- All API calls go through Archevi's backend
- Usage is metered per tenant (family)
- Costs are included in subscription OR billed as usage overage

### BYOK Mode: User's Own Key

```
User Query
    |
    v
+-------------------+
|   Archevi API     |
+-------------------+
    |
    v
+-------------------+
| Key Selection     |  <-- Check if BYOK enabled
+-------------------+
    |
    v
+-------------------+
| Cohere API        |  <-- User's own key (encrypted)
| (User's Account)  |
+-------------------+
    |
    v
Response to User
```

**How it works:**
- User provides their own Cohere API key
- Key is encrypted at rest (AES-256)
- API calls use user's key directly
- User pays Cohere directly, sees their own usage

---

## Database Schema

### Tenant Configuration

```sql
CREATE TABLE tenant_api_config (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
    api_mode VARCHAR(10) DEFAULT 'managed',  -- 'managed' or 'byok'
    cohere_api_key_encrypted BYTEA,          -- Encrypted BYOK key
    key_last_verified TIMESTAMP,             -- Last successful API call
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT valid_mode CHECK (api_mode IN ('managed', 'byok'))
);

-- Index for quick lookups
CREATE INDEX idx_tenant_api_mode ON tenant_api_config(api_mode);
```

### Usage Tracking (Managed Mode Only)

```sql
CREATE TABLE ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    operation VARCHAR(50) NOT NULL,          -- 'embed', 'generate', 'rerank'
    model VARCHAR(100) NOT NULL,             -- 'embed-v4.0', 'command-a-03-2025'
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER DEFAULT 0,
    cost_usd DECIMAL(10, 6) NOT NULL,        -- Calculated cost
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for billing queries
CREATE INDEX idx_usage_tenant ON ai_usage(tenant_id);
CREATE INDEX idx_usage_created ON ai_usage(created_at);
CREATE INDEX idx_usage_tenant_month ON ai_usage(tenant_id, DATE_TRUNC('month', created_at));
```

### Monthly Usage Summary

```sql
CREATE TABLE monthly_usage_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    month DATE NOT NULL,                     -- First day of month
    total_embed_tokens BIGINT DEFAULT 0,
    total_generate_tokens BIGINT DEFAULT 0,
    total_rerank_tokens BIGINT DEFAULT 0,
    total_cost_usd DECIMAL(10, 4) DEFAULT 0,
    included_allowance_usd DECIMAL(10, 4),   -- From their plan
    overage_usd DECIMAL(10, 4) DEFAULT 0,

    UNIQUE(tenant_id, month)
);
```

---

## Pricing Model

### Included AI Allowance by Plan

| Plan | Monthly AI Allowance | Overage Rate |
|------|---------------------|--------------|
| Starter ($14.99) | $3.00 | $0.01/1K tokens |
| Family ($24.99) | $8.00 | $0.008/1K tokens |
| Family Office | Unlimited | N/A |

### Cost Calculation

Based on Cohere pricing (as of 2025):

| Model | Input Cost | Output Cost |
|-------|------------|-------------|
| Embed v4 | $0.10/M tokens | N/A |
| Command A | $2.50/M tokens | $10.00/M tokens |
| Rerank v3.5 | $2.00/M tokens | N/A |

**Margin:** Archevi charges ~20% markup on pass-through costs for managed mode.

### Example Monthly Costs

| Usage Level | Queries/Month | Est. Cohere Cost | Archevi Markup | Total |
|-------------|---------------|------------------|----------------|-------|
| Light | 50 | $0.50 | $0.10 | $0.60 |
| Normal | 150 | $1.50 | $0.30 | $1.80 |
| Heavy | 300 | $3.00 | $0.60 | $3.60 |
| Power | 500 | $5.00 | $1.00 | $6.00 |

Most users on Starter plan ($3 allowance) will never see overages.

---

## Implementation

### API Key Selection Logic

```python
# Pseudocode for key selection
async def get_cohere_client(tenant_id: str) -> CohereClient:
    config = await db.get_tenant_api_config(tenant_id)

    if config.api_mode == 'byok' and config.cohere_api_key_encrypted:
        # Decrypt and use user's key
        api_key = decrypt(config.cohere_api_key_encrypted)
        return CohereClient(api_key=api_key)
    else:
        # Use Archevi's managed key
        return CohereClient(api_key=ARCHEVI_COHERE_KEY)
```

### Usage Metering Middleware

```python
# Pseudocode for usage tracking
async def track_cohere_usage(
    tenant_id: str,
    operation: str,
    model: str,
    input_tokens: int,
    output_tokens: int = 0
):
    config = await db.get_tenant_api_config(tenant_id)

    # Only track for managed mode
    if config.api_mode != 'managed':
        return

    # Calculate cost
    cost = calculate_cost(model, input_tokens, output_tokens)

    # Record usage
    await db.insert_ai_usage(
        tenant_id=tenant_id,
        operation=operation,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_usd=cost
    )

    # Update monthly summary
    await db.increment_monthly_summary(tenant_id, cost)
```

### BYOK Key Storage

```python
# Pseudocode for secure key storage
from cryptography.fernet import Fernet

# Key derived from tenant-specific secret + master key
def encrypt_api_key(tenant_id: str, api_key: str) -> bytes:
    encryption_key = derive_key(MASTER_KEY, tenant_id)
    f = Fernet(encryption_key)
    return f.encrypt(api_key.encode())

def decrypt_api_key(tenant_id: str, encrypted_key: bytes) -> str:
    encryption_key = derive_key(MASTER_KEY, tenant_id)
    f = Fernet(encryption_key)
    return f.decrypt(encrypted_key).decode()
```

---

## User Experience

### Default Flow (Managed Mode)

1. User signs up for Archevi
2. No API key required - works immediately
3. Usage tracked automatically
4. Included in subscription (with generous allowance)
5. Overages billed monthly via Stripe

### BYOK Flow

1. User goes to Settings > AI Configuration
2. Toggles "Use my own Cohere API key"
3. Enters their Cohere API key
4. Key is verified with a test call
5. Future queries use their key
6. No usage tracking or metering by Archevi

### Settings UI

```
AI Configuration
----------------

[ ] Use my own Cohere API key (BYOK)

When enabled, your queries go directly to Cohere using your
own API key. You'll pay Cohere directly and Archevi won't
track your AI usage.

[Cohere API Key: ****************************]
[Test Key] [Save]

Current Mode: Archevi Managed
This Month's Usage: $1.47 / $3.00 included
```

---

## Billing Integration

### Stripe Setup

```javascript
// Monthly usage billing with Stripe
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [
    { price: 'price_starter_monthly' },     // Base subscription
    { price: 'price_ai_usage_metered' },    // Metered AI usage
  ],
});

// Report usage at end of billing period
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItemId,
  {
    quantity: overageTokens,
    timestamp: Math.floor(Date.now() / 1000),
    action: 'set',
  }
);
```

### Usage Dashboard

Users can view their AI usage in Settings:

```
AI Usage This Month
-------------------
Embed operations: 1,234 (12,340 tokens)
Generate operations: 45 (89,000 tokens)
Rerank operations: 23 (4,600 tokens)

Total Cost: $2.34
Included: $3.00
Overage: $0.00

[View detailed usage log]
```

---

## Security Considerations

### Managed Mode
- Single production key stored in secrets manager (AWS Secrets Manager / Vault)
- Key rotated quarterly
- Rate limiting per tenant to prevent abuse
- Anomaly detection for unusual usage patterns

### BYOK Mode
- Keys encrypted at rest with AES-256
- Keys never logged or exposed in error messages
- Key verification on save (test API call)
- Users can revoke/rotate anytime

### Rate Limiting

| Plan | Queries/Hour | Queries/Day |
|------|--------------|-------------|
| Starter | 60 | 500 |
| Family | 120 | 1,000 |
| Family Office | Unlimited | Unlimited |

---

## Migration Path

### Phase 1: Launch with Managed Only
- Use Archevi's Cohere production key
- Include generous AI allowance in all plans
- Track usage but don't charge overages initially

### Phase 2: Add BYOK Option (Month 2-3)
- Add BYOK toggle in settings
- Implement key encryption/storage
- Document BYOK setup process

### Phase 3: Usage-Based Billing (Month 4+)
- Enable overage billing for power users
- Add usage alerts ("You've used 80% of your allowance")
- Consider Cohere Partner Program for volume discounts

---

## Cohere Partner Program

Once Archevi reaches sufficient volume, apply for Cohere Partner Program:

**Benefits:**
- Volume discounts (potentially 20-40% off)
- Dedicated support
- Early access to new models
- Co-marketing opportunities

**Requirements:**
- Demonstrated usage volume
- Production deployment
- Business plan/use case documentation

**Target:** Apply after 50+ paying customers or $500+/month API spend.

---

## Advantages of This Approach

### For Users
- Zero-friction onboarding (no Cohere account needed)
- Privacy option (BYOK) for those who want it
- Predictable costs (included allowance)
- Transparent usage tracking

### For Archevi
- Lower barrier to signup (3x higher conversion expected)
- Revenue opportunity (20% markup on AI costs)
- Simpler support (one API setup to maintain)
- Path to Cohere partnership (volume leverage)

### For Privacy-Conscious Users
- Full BYOK option available
- Their queries never touch Archevi's key
- Direct relationship with Cohere
- Complete cost transparency

# Security Setup Checklist

## ✅ Completed
- [x] Generated secure JWT_SECRET and added to Infrastructure/.env
- [x] Removed hardcoded JWT_SECRET from auth scripts
- [x] Removed hardcoded Windmill token from .mcp.json
- [x] All auth scripts now use config.get_jwt_secret()

## 🔴 Action Required

### 1. Rotate Windmill MCP Token (CRITICAL)
The current token `bE9ivXyS47LQJlyVQ5O0AvtxHjUkQvUI` was exposed in git history.

**Steps:**
1. Open Windmill UI: http://localhost
2. Go to Settings > Tokens
3. Find the token starting with `bE9ivXy...`
4. **Delete it** (or revoke it)
5. Click "Generate MCP URL"
6. Copy the new token from the URL: `?token=NEW_TOKEN_HERE`
7. Update `Infrastructure/.env`:
   ```bash
   WINDMILL_MCP_TOKEN=NEW_TOKEN_HERE
   ```

### 2. Set Windmill API Token
**Steps:**
1. In Windmill UI > Settings > Tokens
2. Click "Create Token"
3. Name it: "Script Deployment"
4. Copy the token
5. Update `Infrastructure/.env`:
   ```bash
   WINDMILL_TOKEN=YOUR_NEW_TOKEN_HERE
   ```

### 3. Verify Scripts Can Access Environment Variables

**Test JWT_SECRET:**
```bash
cd scripts
python3 -c "from config import get_jwt_secret; print('JWT_SECRET loaded:', len(get_jwt_secret()), 'chars')"
```

Expected output: `JWT_SECRET loaded: 43 chars`

**Test WINDMILL_TOKEN:**
```bash
python3 -c "from config import get_windmill_token; print('WINDMILL_TOKEN loaded')"
```

## 📝 Current .env Status

```bash
# View current settings (tokens hidden):
cd Infrastructure
grep -E "JWT_SECRET|WINDMILL.*TOKEN" .env | sed 's/=.*/=***HIDDEN***/'
```

## 🔒 Production Checklist

Before deploying to production:
- [ ] Change all default passwords
- [ ] Use production Cohere API key
- [ ] Set strong JWT_SECRET (already done ✓)
- [ ] Rotate all Windmill tokens
- [ ] Enable HTTPS
- [ ] Set up proper secret management (AWS Secrets Manager, etc.)

---

**Auto-generated:** $(date)

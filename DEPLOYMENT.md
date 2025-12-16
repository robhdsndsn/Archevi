# Archevi Deployment Guide

This guide covers deploying the Archevi marketing website and CMS to production.

## Architecture Overview

```
                    +------------------+
                    |   archevi.ca     |
                    |    (Vercel)      |
                    |   Next.js 15     |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
    +---------v---------+        +----------v----------+
    |  cms.archevi.ca   |        |  app.archevi.ca     |
    |    (Railway)      |        |  (Existing Vite)    |
    |    Strapi 5       |        |                     |
    +---------+---------+        +---------------------+
              |
    +---------v---------+
    |   PostgreSQL      |
    |   (Railway/Neon)  |
    +-------------------+
```

## Quick Start (Recommended Path)

### 1. Deploy Marketing Site to Vercel (5 min)

1. **Import Project**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Set **Root Directory** to `website`
   - Framework will auto-detect as Next.js

2. **Configure Environment Variables**
   ```
   NEXT_PUBLIC_STRAPI_URL=https://cms.archevi.ca
   NEXT_PUBLIC_APP_URL=https://app.archevi.ca
   NEXT_PUBLIC_DOCS_URL=https://docs.archevi.ca
   NEXT_PUBLIC_SITE_URL=https://archevi.ca
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **Add Domain**
   - Settings > Domains > Add `archevi.ca`
   - Add `www.archevi.ca` (redirects to apex)
   - Update DNS records as shown

4. **Deploy**
   - Click "Deploy"
   - Automatic deploys on push to `main`

### 2. Deploy Strapi CMS to Railway (10 min)

Railway is the easiest option for Strapi with PostgreSQL.

1. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - New Project > Deploy from GitHub
   - Select your repo, set root to `cms`

2. **Add PostgreSQL**
   - Click "+ New" > "Database" > "PostgreSQL"
   - Railway auto-connects it

3. **Configure Environment Variables**
   ```
   NODE_ENV=production
   DATABASE_CLIENT=postgres
   DATABASE_URL=${{Postgres.DATABASE_URL}}

   # Generate these (openssl rand -base64 32)
   APP_KEYS=key1,key2,key3,key4
   API_TOKEN_SALT=random_salt_here
   ADMIN_JWT_SECRET=random_secret_here
   TRANSFER_TOKEN_SALT=random_salt_here
   JWT_SECRET=random_secret_here
   ```

4. **Add Domain**
   - Settings > Domains > Generate or add custom
   - Point `cms.archevi.ca` CNAME to Railway domain

5. **Deploy**
   - Railway auto-deploys on push
   - First deploy takes ~5 min to build

### 3. Configure DNS

Add these records to your domain registrar:

| Type | Name | Value |
|------|------|-------|
| A | @ | Vercel IP (from dashboard) |
| CNAME | www | cname.vercel-dns.com |
| CNAME | cms | your-app.railway.app |
| CNAME | app | (your existing dashboard) |
| CNAME | docs | (GitHub Pages) |

### 4. Post-Deployment Setup

1. **Create Strapi Admin User**
   - Visit `https://cms.archevi.ca/admin`
   - Create first admin account
   - Settings > API Tokens > Create token for Next.js (if needed)

2. **Configure CORS in Strapi**
   - Settings > Global Settings > Edit
   - Add `https://archevi.ca` to allowed origins

3. **Seed Initial Content**
   - Create blog posts, FAQs, testimonials
   - Or import from development via Strapi transfer

4. **Verify Google Analytics**
   - Visit site, check GA4 Realtime
   - Test event tracking

---

## Alternative: Self-Hosted (Docker)

For more control, deploy both services via Docker.

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  website:
    build:
      context: ./website
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_STRAPI_URL=https://cms.archevi.ca
    restart: unless-stopped

  strapi:
    build:
      context: ./cms
      dockerfile: Dockerfile
    ports:
      - "1337:1337"
    environment:
      - NODE_ENV=production
      - DATABASE_CLIENT=postgres
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=strapi
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=strapi
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  caddy_data:
```

### Caddyfile

```
archevi.ca {
    reverse_proxy website:3000
}

www.archevi.ca {
    redir https://archevi.ca{uri} permanent
}

cms.archevi.ca {
    reverse_proxy strapi:1337
}
```

---

## Strapi Hosting Options Comparison

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **Railway** | Easy setup, auto PostgreSQL, generous free tier | Limited regions | $5-20/mo |
| **Render** | Similar to Railway, good UX | Cold starts on free tier | $7-25/mo |
| **Strapi Cloud** | Managed, automatic updates | Limited customization | $29/mo+ |
| **DigitalOcean** | Full control, good value | More setup required | $6-24/mo |
| **Self-hosted** | Complete control | Maintenance burden | Varies |

**Recommendation**: Start with Railway for simplicity. Migrate to self-hosted if you need more control or cost optimization.

---

## Security Checklist

- [ ] All secrets in environment variables (not committed)
- [ ] HTTPS on all domains (auto with Vercel/Railway)
- [ ] Strapi admin behind strong password
- [ ] API tokens rotated periodically
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (Strapi has built-in)
- [ ] Backup strategy for PostgreSQL

---

## Monitoring

### Vercel (Website)
- Analytics: Built-in Web Analytics
- Errors: Vercel Functions logs
- Performance: Speed Insights

### Railway (Strapi)
- Logs: Railway dashboard
- Metrics: Built-in CPU/Memory graphs
- Alerts: Configure in settings

### Recommended Additions
- **Sentry**: Error tracking for both
- **UptimeRobot**: Free uptime monitoring
- **LogDNA/Papertrail**: Centralized logging

---

## Rollback Procedures

### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

### Railway
- Dashboard > Deployments > Click previous deployment > Redeploy

### Database
- Railway has automatic daily backups
- For manual: `pg_dump` before major changes

---

## Troubleshooting

### "Failed to fetch" from Strapi
1. Check CORS settings in Strapi
2. Verify `NEXT_PUBLIC_STRAPI_URL` is correct
3. Check Strapi is running and accessible

### Strapi admin blank page
1. Clear browser cache
2. Check `STRAPI_ADMIN_BACKEND_URL` matches actual URL
3. Rebuild admin: `npm run build`

### Images not loading
1. Check media provider configuration
2. Verify bucket permissions (S3/R2)
3. Check CSP headers allow image domain

### Slow initial load
1. Enable ISR in Next.js pages
2. Check Strapi response times
3. Consider CDN for Strapi (Cloudflare)

---

## Cost Estimates (Monthly)

| Service | Free Tier | Basic | Production |
|---------|-----------|-------|------------|
| Vercel | 100GB bandwidth | - | $20/mo |
| Railway | $5 credit | $5-10 | $20-40 |
| Domain | - | $12/yr | $12/yr |
| **Total** | ~$0 | ~$10 | ~$50 |

---

## Next Steps After Deployment

1. [ ] Submit sitemap to Google Search Console
2. [ ] Set up Google Analytics goals/conversions
3. [ ] Configure email notifications (Strapi)
4. [ ] Set up automated backups
5. [ ] Create staging environment
6. [ ] Document admin procedures for team

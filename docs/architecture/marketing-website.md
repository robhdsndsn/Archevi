# Marketing Website Architecture

This document describes the architecture of the Archevi marketing website and CMS.

## Overview

The marketing website is a separate Next.js application that handles:
- Public-facing marketing pages (landing, pricing, features, blog, FAQ)
- Content management via Strapi CMS
- Self-service signup with tenant provisioning
- Cross-domain authentication to the main dashboard

## System Architecture

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

## Components

### Marketing Site (website/)

**Stack:**
- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui components

**Key Pages:**

| Route | Purpose |
|-------|---------|
| `/` | Landing page with hero, features, testimonials |
| `/pricing` | Plan comparison with monthly/yearly toggle |
| `/features` | Detailed feature breakdown |
| `/blog` | Blog index with pagination |
| `/blog/[slug]` | Individual blog posts |
| `/faq` | Searchable FAQ with category tabs |
| `/signup` | Self-service registration form |

**Key Features:**
- Server-side rendering (SSR) for SEO
- Incremental Static Regeneration (ISR) for content updates
- Mobile-first responsive design
- SEO optimized (meta tags, Open Graph, sitemap, robots.txt)

### CMS (cms/)

**Stack:**
- Strapi 5
- PostgreSQL (production)
- SQLite (development)

**Content Types:**

| Type | Purpose |
|------|---------|
| Blog Post | Marketing blog articles |
| FAQ | Frequently asked questions |
| Announcement | Site-wide banners |
| Changelog | Product updates |
| Testimonial | Customer quotes |
| Feature | Feature descriptions |
| Legal Page | Terms, Privacy, etc. |

**API Integration:**
- REST API with type-safe TypeScript client
- Public read access (no auth required)
- Admin write access via Strapi dashboard

### Authentication Flow

**Self-Service Signup:**
1. User fills signup form (email, password, family name)
2. Form submits to Windmill `auth_signup.py` endpoint
3. Windmill creates user account and tenant
4. Returns JWT token in URL fragment
5. Redirect to `app.archevi.ca/auth/callback#token=...`
6. AuthCallback component extracts token, validates, sets auth state
7. User lands in dashboard logged in

**Cross-Domain Auth:**
- JWT passed via URL fragment (not query param for security)
- Token validated server-side before setting auth state
- Short-lived signup tokens (5 minutes)

## Deployment

### Vercel (Marketing Site)

```bash
# Automatic deployment on push to main
# Root directory: website/
# Framework: Next.js (auto-detected)
```

**Environment Variables:**
- `NEXT_PUBLIC_STRAPI_URL` - CMS API endpoint
- `NEXT_PUBLIC_APP_URL` - Dashboard URL
- `NEXT_PUBLIC_DOCS_URL` - Documentation URL
- `NEXT_PUBLIC_SITE_URL` - Marketing site URL
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics

### Railway (Strapi CMS)

```bash
# Automatic deployment on push to main
# Root directory: cms/
# Database: PostgreSQL addon
```

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `APP_KEYS` - Strapi security keys
- `API_TOKEN_SALT` - API token salt
- `ADMIN_JWT_SECRET` - Admin JWT secret
- `JWT_SECRET` - User JWT secret

## DNS Configuration

| Domain | Type | Destination |
|--------|------|-------------|
| archevi.ca | A | Vercel IP |
| www.archevi.ca | CNAME | cname.vercel-dns.com |
| cms.archevi.ca | CNAME | railway.app domain |
| app.archevi.ca | CNAME | existing dashboard |
| docs.archevi.ca | CNAME | VitePress site |

## Development

### Local Setup

```bash
# Marketing site
cd website
pnpm install
pnpm dev  # http://localhost:3000

# CMS
cd cms
pnpm install
pnpm develop  # http://localhost:1337
```

## Security Considerations

- Strapi admin panel secured with strong passwords
- API tokens rotated regularly
- CORS configured for specific domains only
- Rate limiting on signup endpoint
- Input validation on all forms
- XSS prevention via React's built-in escaping

## Related Documentation

- [Deployment Guide](/DEPLOYMENT.md) - Full deployment instructions
- [Multi-Tenant Design](/docs/architecture/multi-tenant-design.md) - Backend architecture
- [API Reference](/docs/api/) - Windmill endpoints

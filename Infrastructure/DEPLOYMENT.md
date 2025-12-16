# Archevi Production Deployment Guide

This guide covers deploying Archevi to a production server.

## Prerequisites

### Server Requirements
- Linux server (Ubuntu 22.04+ recommended)
- Docker 20.10+
- Docker Compose v2
- 4+ CPU cores
- 8+ GB RAM
- 50+ GB storage (SSD recommended)
- Ports 80, 443, 25 open

### Domain Setup
1. Purchase/configure domain (e.g., `archevi.ca`)
2. Create DNS A records:
   - `archevi.ca` -> Server IP
   - `api.archevi.ca` -> Server IP
   - `www.archevi.ca` -> Server IP

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/archevi.git
cd archevi/Infrastructure

# 2. Create production environment file
cp .env.production.example .env.production

# 3. Edit environment variables
nano .env.production
# At minimum, set:
#   - POSTGRES_PASSWORD (generate with: openssl rand -base64 32)
#   - ACME_EMAIL (your email for Let's Encrypt)

# 4. Deploy
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# 5. Verify deployment
docker compose -f docker-compose.prod.yml ps
```

## Detailed Setup

### Step 1: Environment Configuration

Copy the example environment file:

```bash
cp .env.production.example .env.production
```

Required variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DOMAIN` | Main application domain | `archevi.ca` |
| `API_DOMAIN` | Windmill API domain | `api.archevi.ca` |
| `BASE_URL` | Full Windmill URL | `https://api.archevi.ca` |
| `ACME_EMAIL` | Let's Encrypt contact | `admin@archevi.ca` |
| `POSTGRES_PASSWORD` | Database password | (generate securely) |

Generate a secure password:
```bash
openssl rand -base64 32
```

### Step 2: AI API Keys

AI API keys are configured in Windmill Resources, NOT in environment files:

1. Access Windmill at `https://api.archevi.ca`
2. Navigate to Resources
3. Create/update resources:
   - `f/chatbot/cohere_api_key`
   - `f/chatbot/groq_api_key`
   - `f/chatbot/postgres_db`

### Step 3: Deploy Services

```bash
# Start all services
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Watch logs
docker compose -f docker-compose.prod.yml logs -f

# Check service health
docker compose -f docker-compose.prod.yml ps
```

### Step 4: Database Setup

On first deployment, run database migrations:

```bash
# Connect to a running worker container
docker exec -it archevi-windmill-server bash

# Inside container, migrations run automatically on Windmill startup
# For manual schema setup, connect to PostgreSQL:
docker exec -it archevi-db psql -U archevi -d archevi
```

Apply custom migrations from `migrations/` folder:

```bash
# Copy migrations to db container
docker cp ../migrations archevi-db:/migrations

# Apply migrations
docker exec archevi-db bash -c "for f in /migrations/*.sql; do psql -U archevi -d archevi -f \$f; done"
```

### Step 5: Verify Deployment

1. **Frontend**: Visit `https://archevi.ca`
2. **API**: Visit `https://api.archevi.ca/api/version`
3. **Health checks**:
   ```bash
   curl https://archevi.ca/health
   curl https://api.archevi.ca/api/version
   ```

## Architecture

```
                    Internet
                        |
                   Port 80/443
                        |
                   +--------+
                   |  Caddy | (reverse proxy, auto HTTPS)
                   +--------+
                        |
          +-------------+-------------+
          |                           |
    archevi.ca               api.archevi.ca
          |                           |
    +-----------+              +---------------+
    | Frontend  |              | Windmill      |
    | (nginx)   |              | Server        |
    +-----------+              +---------------+
                                      |
                    +--------+--------+--------+
                    |        |        |        |
              +--------+ +--------+ +--------+ +--------+
              |Worker 1| |Worker 2| |Worker 3| | Native |
              +--------+ +--------+ +--------+ +--------+
                    |        |        |        |
                    +--------+--------+--------+
                                |
                         +-----------+
                         | PostgreSQL|
                         | + pgvector|
                         +-----------+
```

## Operations

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f windmill_server
docker compose -f docker-compose.prod.yml logs -f caddy
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Restart Services

```bash
# Restart specific service
docker compose -f docker-compose.prod.yml restart windmill_server

# Restart all
docker compose -f docker-compose.prod.yml restart
```

### Scale Workers

```bash
# Scale workers (default is 3)
docker compose -f docker-compose.prod.yml up -d --scale windmill_worker=5
```

### Update Deployment

```bash
# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Recreate containers with new images
docker compose -f docker-compose.prod.yml up -d

# For frontend changes, rebuild
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

### Database Backup

Backups are automated via Windmill schedules. Manual backup:

```bash
# Using backup script (no pg_dump required)
docker exec archevi-db python /scripts/backup_database.py

# Or manual pg_dump
docker exec archevi-db pg_dump -U archevi archevi > backup_$(date +%Y%m%d_%H%M%S).sql
```

Restore from backup:

```bash
# Using restore script
docker exec archevi-db python /scripts/restore_database.py --backup-name backup_20251207.sql
```

### SSL Certificate Issues

Caddy handles certificates automatically. If issues occur:

```bash
# Check Caddy logs
docker compose -f docker-compose.prod.yml logs caddy

# Force certificate renewal
docker compose -f docker-compose.prod.yml restart caddy
```

## Monitoring

### Health Endpoints

| Endpoint | Service | Expected |
|----------|---------|----------|
| `https://archevi.ca/health` | Frontend | "healthy" |
| `https://api.archevi.ca/api/version` | Windmill | JSON version |
| PostgreSQL | Internal | pg_isready |

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Troubleshooting

### Frontend Not Loading

1. Check Caddy logs: `docker logs archevi-caddy`
2. Check frontend container: `docker logs archevi-frontend`
3. Verify DNS resolution: `dig archevi.ca`

### API Errors (500)

1. Check Windmill logs: `docker logs archevi-windmill-server`
2. Check database connection: `docker exec archevi-db pg_isready`
3. Verify resources in Windmill UI

### Database Connection Issues

1. Check db container health: `docker logs archevi-db`
2. Test connection: `docker exec archevi-db psql -U archevi -d archevi -c "SELECT 1;"`
3. Verify DATABASE_URL in Windmill environment

### Certificate Errors

1. Verify DNS points to server
2. Check port 80 is open (required for ACME challenge)
3. Wait for certificate provisioning (can take a few minutes)
4. Check Caddy logs for ACME errors

## Security Checklist

- [ ] Strong POSTGRES_PASSWORD set (32+ characters)
- [ ] ACME_EMAIL configured for certificate alerts
- [ ] Firewall configured (only 80, 443, 25 open)
- [ ] SSH hardened (key-only, no root login)
- [ ] Regular backups configured
- [ ] Monitoring/alerting configured
- [ ] AI API keys stored in Windmill Resources (not env vars)

## File Structure

```
Infrastructure/
├── docker-compose.prod.yml    # Production Docker Compose
├── .env.production.example    # Environment template
├── .env.production            # Actual env (DO NOT COMMIT)
├── Caddyfile.prod             # Caddy reverse proxy config
├── DEPLOYMENT.md              # This file
└── backups/                   # Database backups (mounted volume)

frontend/
├── Dockerfile.prod            # Frontend production build
├── nginx.conf                 # Nginx config for SPA
└── dist/                      # Built frontend (created during build)
```

## Support

- Documentation: https://docs.archevi.ca
- Issues: support@archevi.ca
- Status: status.archevi.ca

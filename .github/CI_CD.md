# Archevi CI/CD Documentation

This document describes the continuous integration and deployment pipelines for Archevi.

## Overview

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | PR, push to main | Validate code quality |
| `deploy.yml` | Push to main, manual | Deploy to production |

## CI Pipeline (`ci.yml`)

### Jobs

#### 1. Frontend
- **Runs on**: `ubuntu-latest`
- **Working directory**: `frontend/`
- **Steps**:
  - Install pnpm dependencies
  - TypeScript type checking
  - Build production bundle
  - Run vitest tests
  - Upload build artifacts (main branch only)

#### 2. Admin Dashboard
- **Runs on**: `ubuntu-latest`
- **Working directory**: `admin/`
- **Steps**:
  - Install pnpm dependencies
  - ESLint linting
  - TypeScript type checking
  - Build production bundle
  - Upload build artifacts (main branch only)

#### 3. Python Scripts
- **Runs on**: `ubuntu-latest`
- **Steps**:
  - Install ruff and mypy
  - Lint with ruff (errors, warnings)
  - Type check with mypy (non-blocking)

#### 4. Docker Build
- **Runs on**: `ubuntu-latest`
- **Depends on**: frontend
- **Steps**:
  - Build frontend Docker image
  - Uses GitHub Actions cache for faster builds

### Concurrency

CI runs are grouped by workflow and branch. New pushes cancel in-progress runs for the same PR/branch.

## CD Pipeline (`deploy.yml`)

### Prerequisites

#### GitHub Secrets Required

| Secret | Description | Example |
|--------|-------------|---------|
| `PRODUCTION_HOST` | Server IP/hostname | `1.2.3.4` |
| `PRODUCTION_USER` | SSH username | `deploy` |
| `PRODUCTION_SSH_KEY` | SSH private key | `-----BEGIN OPENSSH...` |
| `VITE_WINDMILL_URL` | API URL for frontend build | `https://api.archevi.ca` |

#### GitHub Environment

Create a `production` environment in repository settings:
1. Go to Settings > Environments
2. Create "production" environment
3. Add protection rules (required reviewers, wait timer)
4. Add environment secrets

### Jobs

#### 1. Build Frontend Image
- Builds Docker image using `frontend/Dockerfile.prod`
- Pushes to GitHub Container Registry (ghcr.io)
- Tags: SHA, branch name, `latest` (main only)

#### 2. Deploy to Production
- **Environment**: production (requires approval)
- **Steps**:
  1. SSH to production server
  2. Pull latest code
  3. Pull latest Docker images
  4. Run docker-compose up
  5. Wait for health checks
  6. Verify deployment
  7. Cleanup old images

#### 3. Run Migrations (Manual)
- Only runs on `workflow_dispatch`
- Copies and runs SQL migrations in order
- Requires manual trigger after deployment

#### 4. Rollback (On Failure)
- Automatically available if deployment fails
- Rolls back to previous commit
- Re-deploys previous version

## Server Setup for CD

### Initial Setup

```bash
# On production server

# 1. Create deployment directory
sudo mkdir -p /opt/archevi
sudo chown deploy:deploy /opt/archevi

# 2. Clone repository
cd /opt/archevi
git clone https://github.com/your-org/archevi.git .

# 3. Setup environment
cp Infrastructure/.env.production.example Infrastructure/.env.production
nano Infrastructure/.env.production  # Fill in values

# 4. Initial deployment
docker compose -f Infrastructure/docker-compose.prod.yml --env-file Infrastructure/.env.production up -d
```

### SSH Key Setup

```bash
# Generate deployment key
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy

# Add to server's authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Copy private key to GitHub secret
cat ~/.ssh/github_deploy  # Copy entire contents to PRODUCTION_SSH_KEY secret
```

## Workflow Triggers

### Automatic (CI)
- All pull requests to `main`
- All pushes to `main`

### Automatic (CD)
- Pushes to `main` trigger build and deploy

### Manual (CD)
- Go to Actions > Deploy > Run workflow
- Select environment (production/staging)
- Optionally run migrations

## Monitoring Deployments

### GitHub Actions UI
- View workflow runs at `Actions` tab
- Check logs for each job
- Download artifacts from successful builds

### Production Health Checks
```bash
# Frontend health
curl https://archevi.ca/health

# API health
curl https://api.archevi.ca/api/version
```

### Rollback

If deployment fails:
1. Go to Actions > Deploy
2. Click "Run workflow"
3. The rollback job will be available

Or manually:
```bash
# SSH to server
cd /opt/archevi
git checkout HEAD~1
docker compose -f Infrastructure/docker-compose.prod.yml --env-file Infrastructure/.env.production up -d
```

## Adding New Workflows

### Linting Configuration

The CI pipeline uses:
- **Ruff** for Python (fast, modern linter)
- **ESLint** for admin dashboard
- **TypeScript** for type checking

To modify rules, edit:
- `pyproject.toml` for ruff config
- `admin/eslint.config.js` for ESLint

### Caching

Both workflows use GitHub Actions cache:
- **pnpm**: Cached via `actions/setup-node` with cache option
- **Docker**: Uses `gha` cache type for BuildKit

## Troubleshooting

### CI Failures

| Issue | Solution |
|-------|----------|
| pnpm install fails | Check `pnpm-lock.yaml` is committed |
| Type errors | Run `pnpm exec tsc --noEmit` locally |
| Test failures | Run `pnpm test:run` locally |
| Lint errors | Run `pnpm lint` or `ruff check scripts/` |

### CD Failures

| Issue | Solution |
|-------|----------|
| SSH connection fails | Verify secrets, check server firewall |
| Docker pull fails | Check GITHUB_TOKEN permissions |
| Health check fails | Check container logs on server |
| Out of disk space | Run `docker system prune -af` on server |

### Viewing Logs

```bash
# On production server
docker compose -f Infrastructure/docker-compose.prod.yml logs -f

# Specific service
docker compose -f Infrastructure/docker-compose.prod.yml logs -f frontend
docker compose -f Infrastructure/docker-compose.prod.yml logs -f windmill_server
```

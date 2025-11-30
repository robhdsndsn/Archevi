# Documentation Automation Implementation Plan

## Overview

This document provides a complete implementation plan for automating documentation generation and deployment for the Archevi (Family Second Brain) project. This plan is designed to be implemented by Claude Code or any developer following the steps sequentially.

## Project Context

- **Frontend**: React + TypeScript + Vite
- **Backend**: Windmill Python scripts
- **Current State**: Good markdown documentation structure already exists
- **Goal**: Automate documentation building, deployment, and maintenance without slowing down development

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Documentation Framework | VitePress | Modern, Vite-based docs site |
| CI/CD | GitHub Actions | Automated build and deployment |
| Hosting | GitHub Pages | Free documentation hosting |
| API Docs | TypeDoc | Auto-generate React API reference |
| Changelog | Conventional Commits | Automated changelog generation |

---

## Phase 1: Essential Pre-Launch Setup

### Step 1: Install VitePress

```bash
# From project root
cd C:\Users\RHudson\Desktop\Claudius\Projects\FamilySecondBrain
pnpm add -D vitepress

# Create docs directory
mkdir docs
cd docs
pnpm vitepress init
```

### Step 2: Create Documentation Structure

Create the following directory structure in `/docs`:

```
docs/
├── .vitepress/
│ ├── config.ts # VitePress configuration
│ └── theme/ # Custom theme (optional)
├── public/ # Static assets (images, videos, logos)
│ ├── logo.svg
│ ├── screenshots/
│ └── videos/
├── guide/
│ ├── index.md # Getting started
│ ├── installation.md # Self-hosted setup guide
│ ├── managed-service.md # Managed hosting info
│ ├── usage.md # How to use Archevi
│ └── faq.md # Frequently asked questions
├── comparison/
│ ├── index.md # Overview of alternatives
│ ├── notion.md # Archevi vs Notion
│ ├── obsidian.md # Archevi vs Obsidian
│ └── google-drive.md # Archevi vs Google Drive
├── use-cases/
│ ├── index.md # Overview of use cases
│ ├── medical-records.md # Medical documentation guide
│ ├── recipes.md # Recipe management
│ ├── estate-planning.md # Estate planning docs
│ ├── financial.md # Financial document management
│ └── family-history.md # Preserving family stories
├── api/
│ ├── index.md # API overview
│ ├── windmill-endpoints.md # Windmill API reference
│ ├── frontend-api.md # Frontend API client
│ └── components/ # Auto-generated component docs (TypeDoc)
├── contributing/
│ ├── index.md # How to contribute
│ ├── architecture.md # System architecture
│ ├── development.md # Development setup
│ └── code-standards.md # Code standards and conventions
├── pricing/
│ ├── index.md # Pricing overview
│ ├── self-hosted.md # DIY self-hosted costs
│ └── managed.md # Managed service pricing
└── index.md # Homepage
```

### Step 3: Configure VitePress

Create `docs/.vitepress/config.ts`:

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
 title: 'Archevi Documentation',
 description: 'Your family\'s AI-powered memory - privately stored, instantly accessible, and 90% cheaper than alternatives',
 base: '/FamilySecondBrain/', // Change this to match your GitHub repo name

 head: [
 ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
 ['meta', { name: 'theme-color', content: '#3eaf7c' }],
 ['meta', { name: 'og:type', content: 'website' }],
 ['meta', { name: 'og:locale', content: 'en' }],
 ['meta', { name: 'og:site_name', content: 'Archevi' }],
 ],

 themeConfig: {
 logo: '/logo.svg',
 siteTitle: 'Archevi',

 nav: [
 { text: 'Guide', link: '/guide/' },
 { text: 'Use Cases', link: '/use-cases/' },
 { text: 'Comparison', link: '/comparison/' },
 { text: 'API', link: '/api/' },
 { text: 'Pricing', link: '/pricing/' }
 ],

 sidebar: {
 '/guide/': [
 {
 text: 'Getting Started',
 items: [
 { text: 'Introduction', link: '/guide/' },
 { text: 'Installation', link: '/guide/installation' },
 { text: 'Managed Service', link: '/guide/managed-service' },
 { text: 'Usage', link: '/guide/usage' },
 { text: 'FAQ', link: '/guide/faq' }
 ]
 }
 ],

 '/use-cases/': [
 {
 text: 'Use Cases',
 items: [
 { text: 'Overview', link: '/use-cases/' },
 { text: 'Medical Records', link: '/use-cases/medical-records' },
 { text: 'Recipes', link: '/use-cases/recipes' },
 { text: 'Estate Planning', link: '/use-cases/estate-planning' },
 { text: 'Financial Documents', link: '/use-cases/financial' },
 { text: 'Family History', link: '/use-cases/family-history' }
 ]
 }
 ],

 '/comparison/': [
 {
 text: 'Comparisons',
 items: [
 { text: 'Overview', link: '/comparison/' },
 { text: 'vs Notion', link: '/comparison/notion' },
 { text: 'vs Obsidian', link: '/comparison/obsidian' },
 { text: 'vs Google Drive', link: '/comparison/google-drive' }
 ]
 }
 ],

 '/api/': [
 {
 text: 'API Reference',
 items: [
 { text: 'Overview', link: '/api/' },
 { text: 'Windmill Endpoints', link: '/api/windmill-endpoints' },
 { text: 'Frontend API', link: '/api/frontend-api' },
 { text: 'Component API', link: '/api/components/' }
 ]
 }
 ],

 '/contributing/': [
 {
 text: 'Contributing',
 items: [
 { text: 'Getting Started', link: '/contributing/' },
 { text: 'Architecture', link: '/contributing/architecture' },
 { text: 'Development Setup', link: '/contributing/development' },
 { text: 'Code Standards', link: '/contributing/code-standards' }
 ]
 }
 ],

 '/pricing/': [
 {
 text: 'Pricing',
 items: [
 { text: 'Overview', link: '/pricing/' },
 { text: 'Self-Hosted', link: '/pricing/self-hosted' },
 { text: 'Managed Service', link: '/pricing/managed' }
 ]
 }
 ]
 },

 socialLinks: [
 { icon: 'github', link: 'https://github.com/yourusername/FamilySecondBrain' }
 ],

 search: {
 provider: 'local'
 },

 editLink: {
 pattern: 'https://github.com/yourusername/FamilySecondBrain/edit/main/docs/:path',
 text: 'Edit this page on GitHub'
 },

 footer: {
 message: 'Released under the Apache 2.0 License.',
 copyright: 'Copyright © 2025-present Archevi'
 },

 lastUpdated: {
 text: 'Updated at',
 formatOptions: {
 dateStyle: 'full',
 timeStyle: 'medium'
 }
 }
 },

 markdown: {
 lineNumbers: true,
 theme: {
 light: 'github-light',
 dark: 'github-dark'
 }
 }
})
```

### Step 4: Create Essential Documentation Pages

#### Homepage (`docs/index.md`)

```markdown
---
layout: home

hero:
 name: Archevi
 text: Your Family's AI-Powered Memory
 tagline: Privately stored, instantly accessible, and 90% cheaper than alternatives
 image:
 src: /logo.svg
 alt: Archevi
 actions:
 - theme: brand
 text: Get Started
 link: /guide/
 - theme: alt
 text: View on GitHub
 link: https://github.com/yourusername/FamilySecondBrain

features:
 - icon: 
 title: Privacy First
 details: Self-hosted means your family data never leaves your control. PIPEDA compliant.

 - icon: 
 title: AI-Powered Search
 details: RAG technology understands your questions, not just keywords. Find anything instantly.

 - icon: 
 title: 90% Cost Savings
 details: Self-host for ~$2/month or managed for $15/month vs $20-40/month for alternatives.

 - icon: ‍‍‍
 title: Built for Families
 details: Medical records, recipes, insurance, family history - organized and searchable.

 - icon: 
 title: Easy to Use
 details: Chat interface everyone can use. No technical knowledge required.

 - icon: 
 title: No Vendor Lock-in
 details: Open source. Your data, your infrastructure, your control.
---

## Why Archevi?

Stop losing important family information. Stop paying $240/year for Notion. Stop digging through Google Drive folders.

Archevi is your family's centralized knowledge base powered by AI:

- **"What was grandma's cookie recipe?"** - Instant answers
- **"Where's the home insurance policy?"** - Found in seconds 
- **"What are dad's allergies?"** - Searchable medical history
- **"What's the WiFi password?"** - No more asking repeatedly

## Quick Start

### Self-Hosted (DIY)
```bash
git clone https://github.com/yourusername/FamilySecondBrain
cd FamilySecondBrain
docker-compose up -d
```

**Cost:** ~$2 CAD/month (Cohere API only)

### Managed Service
Sign up for hassle-free hosting at $14.99 CAD/month.

[Learn more →](/guide/managed-service)

## What People Are Saying

> "Finally, all our family recipes in one place and actually findable!" 
> — *Sarah T., Early Adopter*

> "The elder care use case is brilliant. All my mom's medical info is now accessible to caregivers instantly." 
> — *Michael R., Beta Tester*

## Open Source

Archevi is open source under Apache 2.0 License. Contributions welcome!

[View on GitHub →](https://github.com/yourusername/FamilySecondBrain)
```

#### Getting Started Guide (`docs/guide/index.md`)

```markdown
# Getting Started

Welcome to Archevi! This guide will help you get up and running in minutes.

## What is Archevi?

Archevi is an AI-powered family knowledge base that helps you:

- Store and organize family documents
- Search using natural language
- Access information instantly
- Maintain complete privacy
- Save money compared to alternatives

## Choosing Your Path

You have two options:

### 1. Self-Hosted (DIY)

**Best for:**
- Technical families comfortable with Docker
- Those who want complete control
- Privacy-conscious users
- Cost-conscious families (~$2/month)

[Installation Guide →](/guide/installation)

### 2. Managed Service

**Best for:**
- Non-technical families
- Those who want hassle-free experience
- Families wanting professional support
- Quick setup (5 minutes)

[Managed Service Info →](/guide/managed-service)

## Quick Demo

Watch this 2-minute video to see Archevi in action:

[Demo Video Here]

## Next Steps

1. [Choose installation method](/guide/installation)
2. [Upload your first documents](/guide/usage#uploading-documents)
3. [Start asking questions](/guide/usage#asking-questions)
4. [Explore use cases](/use-cases/)

## Need Help?

- [Read the FAQ](/guide/faq)
- [Join our Discord](https://discord.gg/archevi)
- [Email support](mailto:support@archevi.com)
- [Report a bug](https://github.com/yourusername/FamilySecondBrain/issues)
```

#### Installation Guide (`docs/guide/installation.md`)

```markdown
# Installation Guide

This guide covers self-hosted installation of Archevi.

::: tip Prefer Managed Hosting?
Skip the setup and [sign up for managed hosting](/guide/managed-service) at $14.99/month.
:::

## Prerequisites

Before you begin, ensure you have:

- **Docker Desktop** installed (Windows/Mac/Linux)
- **4GB RAM** minimum
- **Git** installed
- **Cohere API Key** ([Get one free](https://dashboard.cohere.com/))
- **Node.js 18+** and **pnpm** (for frontend)

## Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/FamilySecondBrain.git
cd FamilySecondBrain
```

## Step 2: Configure Environment Variables

### Backend Infrastructure

```bash
cd Infrastructure
cp .env.example .env
```

Edit `.env` and add your Cohere API key:

```env
COHERE_API_KEY=your_cohere_api_key_here
POSTGRES_PASSWORD=your_secure_password_here
```

### Frontend

```bash
cd ../frontend
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
VITE_WINDMILL_API_URL=http://localhost/api/w/family-brain
```

## Step 3: Start Backend Services

```bash
# Start PostgreSQL + pgvector
cd Infrastructure
docker-compose up -d

# Start Windmill
cd ../windmill-setup
docker-compose up -d
```

Wait 2-3 minutes for services to start.

## Step 4: Initialize Database

Access Windmill at `http://localhost` and login:
- Email: `admin@familybrain.com`
- Password: `FamilyBrain2025!Admin`

Run the database schema initialization script (found in `/Infrastructure/schema.sql`).

## Step 5: Deploy Backend Scripts

Deploy the 5 Python scripts from `/scripts` to Windmill workspace:
- `embed_document.py`
- `rag_query.py`
- `search_documents.py`
- `get_conversation_history.py`
- `bulk_upload_documents.py`

## Step 6: Start Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

Access the app at `http://localhost:5173`

## Step 7: Upload Your First Document

1. Click "Documents" in the sidebar
2. Click "Upload Document"
3. Enter title, select category, paste content
4. Click "Upload"

## Step 8: Ask Your First Question

1. Click "Chat" in the sidebar
2. Type a question about your document
3. Press Enter

 **Congratulations!** You're now running Archevi.

## Troubleshooting

### Services Won't Start

Check Docker Desktop is running:
```bash
docker ps
```

### Can't Connect to Windmill

Ensure port 80 is not in use by another application.

### Frontend Shows API Errors

Check that Windmill is running and accessible at `http://localhost`.

## Updating

```bash
git pull origin main
cd Infrastructure
docker-compose pull
docker-compose up -d

cd ../windmill-setup
docker-compose pull
docker-compose up -d

cd ../frontend
pnpm install
```

## Backup Your Data

**Important:** Back up your PostgreSQL database regularly:

```bash
docker exec family-brain-db pg_dump -U familyuser family_brain > backup.sql
```

## Next Steps

- [Learn how to use Archevi](/guide/usage)
- [Explore use cases](/use-cases/)
- [Join the community](https://discord.gg/archevi)
```

### Step 5: Create GitHub Actions Workflows

Create `.github/workflows/docs-deploy.yml`:

```yaml
name: Deploy Documentation

on:
 push:
 branches:
 - main
 paths:
 - 'docs/**'
 - '.github/workflows/docs-deploy.yml'
 workflow_dispatch: # Allow manual triggers

permissions:
 contents: read
 pages: write
 id-token: write

# Only allow one deployment at a time
concurrency:
 group: pages
 cancel-in-progress: false

jobs:
 build:
 runs-on: ubuntu-latest
 steps:
 - name: Checkout
 uses: actions/checkout@v4
 with:
 fetch-depth: 0 # Needed for git history (lastUpdated)

 - name: Setup Node
 uses: actions/setup-node@v4
 with:
 node-version: 20

 - name: Setup pnpm
 uses: pnpm/action-setup@v2
 with:
 version: 8

 - name: Get pnpm store directory
 shell: bash
 run: |
 echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

 - name: Setup pnpm cache
 uses: actions/cache@v3
 with:
 path: ${{ env.STORE_PATH }}
 key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
 restore-keys: |
 ${{ runner.os }}-pnpm-store-

 - name: Install dependencies
 run: pnpm install --frozen-lockfile
 working-directory: ./docs

 - name: Build documentation
 run: pnpm vitepress build
 working-directory: ./docs

 - name: Upload artifact
 uses: actions/upload-pages-artifact@v3
 with:
 path: docs/.vitepress/dist

 deploy:
 needs: build
 runs-on: ubuntu-latest
 environment:
 name: github-pages
 url: ${{ steps.deployment.outputs.page_url }}
 steps:
 - name: Deploy to GitHub Pages
 id: deployment
 uses: actions/deploy-pages@v4
```

Create `.github/workflows/docs-preview.yml`:

```yaml
name: Preview Documentation

on:
 pull_request:
 paths:
 - 'docs/**'
 - '.github/workflows/docs-preview.yml'

jobs:
 preview:
 runs-on: ubuntu-latest
 steps:
 - name: Checkout
 uses: actions/checkout@v4

 - name: Setup Node
 uses: actions/setup-node@v4
 with:
 node-version: 20

 - name: Setup pnpm
 uses: pnpm/action-setup@v2
 with:
 version: 8

 - name: Install dependencies
 run: pnpm install --frozen-lockfile
 working-directory: ./docs

 - name: Build documentation
 run: pnpm vitepress build
 working-directory: ./docs

 - name: Comment preview instructions
 uses: actions/github-script@v7
 with:
 script: |
 github.rest.issues.createComment({
 issue_number: context.issue.number,
 owner: context.repo.owner,
 repo: context.repo.repo,
 body: ' **Documentation Preview**\n\nTo preview the documentation changes locally:\n\n```bash\ncd docs\npnpm install\npnpm vitepress dev\n```\n\nOnce merged, docs will be deployed to GitHub Pages automatically.'
 })
```

### Step 6: Enable GitHub Pages

1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment":
 - Source: Select **"GitHub Actions"**
4. Save changes

Your documentation will now be available at:
`https://yourusername.github.io/FamilySecondBrain/`

### Step 7: Add Scripts to package.json

Update your root `package.json` (or create one if it doesn't exist):

```json
{
 "name": "archevi",
 "version": "2.1.0",
 "private": true,
 "scripts": {
 "docs:dev": "cd docs && pnpm vitepress dev",
 "docs:build": "cd docs && pnpm vitepress build",
 "docs:preview": "cd docs && pnpm vitepress preview"
 },
 "devDependencies": {
 "vitepress": "^1.0.0"
 }
}
```

---

## Phase 2: Component API Documentation

### Step 1: Install TypeDoc

```bash
cd frontend
pnpm add -D typedoc typedoc-plugin-markdown
```

### Step 2: Configure TypeDoc

Create `frontend/typedoc.json`:

```json
{
 "entryPoints": [
 "src/components",
 "src/api",
 "src/store",
 "src/hooks"
 ],
 "out": "../docs/api/components",
 "plugin": ["typedoc-plugin-markdown"],
 "readme": "none",
 "excludePrivate": true,
 "excludeProtected": true,
 "excludeExternals": true,
 "hideGenerator": true,
 "gitRevision": "main"
}
```

### Step 3: Add TypeDoc Scripts

Update `frontend/package.json`:

```json
{
 "scripts": {
 "docs:api": "typedoc",
 "docs:api:watch": "typedoc --watch"
 }
}
```

### Step 4: Generate Component Documentation

```bash
cd frontend
pnpm run docs:api
```

### Step 5: Update GitHub Action

Modify `.github/workflows/docs-deploy.yml` to include API doc generation:

```yaml
 - name: Install frontend dependencies
 run: pnpm install --frozen-lockfile
 working-directory: ./frontend

 - name: Generate API documentation
 run: pnpm run docs:api
 working-directory: ./frontend

 - name: Install docs dependencies
 run: pnpm install --frozen-lockfile
 working-directory: ./docs
```

### Step 6: Create API Reference Index

Create `docs/api/components/index.md`:

```markdown
# Component API Reference

This section contains auto-generated documentation for Archevi's React components, API clients, and state management.

## Components

Browse the component library:

- [Chat Components](./components/chat/)
- [Document Components](./components/documents/)
- [UI Components](./components/ui/)
- [Layout Components](./components/layout/)

## API Clients

- [Windmill API Client](./api/)
- [API Types](./types/)

## State Management

- [Chat Store](./store/)
- [Hooks](./hooks/)

## How to Use This Reference

Each component includes:
- **Props**: All available properties with types
- **Usage Examples**: How to import and use the component
- **Related Components**: Links to similar components

::: tip Auto-Generated
This documentation is automatically generated from TypeScript source code and updated on every commit.
:::
```

---

## Phase 3: Automated Changelog

### Step 1: Install Commitlint

```bash
pnpm add -D @commitlint/cli @commitlint/config-conventional husky
npx husky init
```

### Step 2: Configure Commitlint

Create `.commitlintrc.json` in project root:

```json
{
 "extends": ["@commitlint/config-conventional"],
 "rules": {
 "type-enum": [
 2,
 "always",
 [
 "feat",
 "fix",
 "docs",
 "style",
 "refactor",
 "perf",
 "test",
 "chore",
 "revert"
 ]
 ]
 }
}
```

### Step 3: Add Husky Hook

```bash
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

Make it executable (on Unix systems):
```bash
chmod +x .husky/commit-msg
```

### Step 4: Create Changelog Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
 push:
 tags:
 - 'v*.*.*'

permissions:
 contents: write

jobs:
 release:
 runs-on: ubuntu-latest
 steps:
 - name: Checkout
 uses: actions/checkout@v4
 with:
 fetch-depth: 0

 - name: Setup Node
 uses: actions/setup-node@v4
 with:
 node-version: 20

 - name: Generate changelog
 id: changelog
 uses: TriPSs/conventional-changelog-action@v5
 with:
 github-token: ${{ secrets.GITHUB_TOKEN }}
 output-file: 'CHANGELOG.md'
 skip-version-file: true
 skip-commit: true
 git-push: false

 - name: Create GitHub Release
 uses: softprops/action-gh-release@v1
 with:
 body: ${{ steps.changelog.outputs.clean_changelog }}
 draft: false
 prerelease: false
 env:
 GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Step 5: Commit Message Guidelines

Create `docs/contributing/commit-messages.md`:

```markdown
# Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (white-space, formatting)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

## Examples

```
feat(chat): add voice input support

- Implement microphone access
- Add speech-to-text integration
- Update UI with voice button

Closes #123
```

```
fix(upload): resolve document upload timeout

Fixed an issue where large documents would timeout during upload.

Fixes #456
```

```
docs(api): update Windmill endpoint documentation

Added missing parameters and response examples.
```

## Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the footer:

```
feat(api): change RAG query response format

BREAKING CHANGE: Response now includes confidence score as separate field
```

## Creating a Release

To create a new release:

```bash
# Ensure you're on main and up to date
git checkout main
git pull

# Create and push a tag
git tag -a v1.2.3 -m "Release v1.2.3"
git push origin v1.2.3
```

The GitHub Action will automatically:
1. Generate changelog from commits
2. Create GitHub release
3. Attach release notes
```

---

## Implementation Checklist

### Phase 1: Essential (Week 1)
- [ ] Install VitePress in `/docs` directory
- [ ] Create documentation structure (folders and index files)
- [ ] Configure VitePress (`config.ts`)
- [ ] Create homepage (`docs/index.md`)
- [ ] Create Getting Started guide (`docs/guide/index.md`)
- [ ] Create Installation guide (`docs/guide/installation.md`)
- [ ] Create GitHub Actions workflows (deploy + preview)
- [ ] Enable GitHub Pages in repository settings
- [ ] Test local preview: `pnpm docs:dev`
- [ ] Push to GitHub and verify deployment

### Phase 2: Marketing Content (Week 2)
- [ ] Write use case guides (medical, recipes, estate planning, etc.)
- [ ] Create comparison pages (vs Notion, Obsidian, Google Drive)
- [ ] Add pricing pages (self-hosted + managed)
- [ ] Add screenshots and demo videos to `/docs/public`
- [ ] Create FAQ page
- [ ] Write API reference manually (Windmill endpoints)

### Phase 3: Developer Docs (Week 3)
- [ ] Install TypeDoc for component documentation
- [ ] Generate component API reference
- [ ] Create architecture documentation
- [ ] Write contributing guide
- [ ] Document development setup
- [ ] Add code standards documentation
- [ ] Update GitHub Action to include TypeDoc generation

### Phase 4: Automation (Week 4)
- [ ] Install and configure Commitlint
- [ ] Set up Husky hooks
- [ ] Create release workflow for automated changelogs
- [ ] Test conventional commits locally
- [ ] Create commit message guidelines documentation
- [ ] Add search functionality (already included in VitePress)
- [ ] Add analytics (Plausible or Umami - optional)

---

## Testing the Documentation

### Local Testing

```bash
# Preview docs locally
cd docs
pnpm vitepress dev
# Open http://localhost:5173

# Build docs for production
pnpm vitepress build

# Preview production build
pnpm vitepress preview
```

### Link Checking

Install link checker:
```bash
pnpm add -D markdown-link-check
```

Add to `package.json`:
```json
{
 "scripts": {
 "docs:check-links": "find docs -name '*.md' -exec markdown-link-check {} \\;"
 }
}
```

### Spell Checking

Install spell checker:
```bash
pnpm add -D cspell
```

Create `.cspell.json`:
```json
{
 "version": "0.2",
 "language": "en",
 "words": [
 "Archevi",
 "Windmill",
 "pgvector",
 "Cohere",
 "TypeDoc",
 "VitePress"
 ],
 "ignorePaths": [
 "node_modules/**",
 "*.log",
 "dist/**"
 ]
}
```

Add to `package.json`:
```json
{
 "scripts": {
 "docs:spell-check": "cspell 'docs/**/*.md'"
 }
}
```

---

## Maintenance

### Updating Documentation

1. Make changes in feature branch
2. Preview locally: `pnpm docs:dev`
3. Commit with conventional commit format
4. Open PR (triggers preview build)
5. Merge to main (triggers deployment)

### Adding New Pages

1. Create markdown file in appropriate directory
2. Add entry to `.vitepress/config.ts` sidebar
3. Link from relevant pages
4. Test locally before committing

### Updating VitePress

```bash
cd docs
pnpm update vitepress
```

### Monitoring

- GitHub Pages build status: Check Actions tab
- Broken links: Run `pnpm docs:check-links`
- Spelling: Run `pnpm docs:spell-check`
- Analytics: View Plausible/Umami dashboard (if configured)

---

## Troubleshooting

### Docs Won't Build Locally

```bash
# Clear cache and reinstall
cd docs
rm -rf node_modules .vitepress/cache .vitepress/dist
pnpm install
pnpm vitepress dev
```

### GitHub Pages Not Deploying

1. Check GitHub Actions logs for errors
2. Verify GitHub Pages is enabled in Settings
3. Ensure base path in `config.ts` matches repo name
4. Check branch protection rules aren't blocking deployment

### Links Broken After Deployment

- Ensure base path in VitePress config matches GitHub Pages URL
- Use relative links without base path (VitePress handles this)
- Check that files exist in correct directories

### Images Not Loading

- Place images in `/docs/public` directory
- Reference as `/image.png` (leading slash, no "public")
- Check image file names are lowercase and have no spaces

---

## Resources

### Official Documentation
- [VitePress](https://vitepress.dev/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [GitHub Pages](https://pages.github.com/)
- [TypeDoc](https://typedoc.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Examples
- [Vite Documentation](https://vitejs.dev/) - Built with VitePress
- [Vue.js Documentation](https://vuejs.org/) - Built with VitePress
- [Vitest Documentation](https://vitest.dev/) - Built with VitePress

### Community
- [VitePress Discord](https://chat.vitejs.dev/)
- [GitHub Discussions](https://github.com/vuejs/vitepress/discussions)

---

## Success Criteria

Your documentation automation is successful when:

- Docs automatically deploy on every push to main
- PR previews show documentation changes before merge
- Component API reference auto-generates from TypeScript
- Changelog auto-generates from conventional commits
- Local preview works smoothly for development
- Documentation is searchable (VitePress local search)
- Mobile-responsive and accessible
- Fast load times (<2s)
- No broken links
- Professional appearance matching brand

---

## Next Steps After Implementation

1. **Content Creation**: Fill in all documentation pages with actual content
2. **Screenshot Collection**: Add visual aids to every guide
3. **Video Production**: Create demo videos for key features
4. **SEO Optimization**: Add meta descriptions, OG images
5. **Analytics Setup**: Track which docs are most visited
6. **User Feedback**: Add feedback widget to docs pages
7. **Versioning**: When you have multiple versions, add version selector
8. **Internationalization**: Add French translation for Quebec market

---

**Last Updated**: 2025-11-27 
**Implementation Time Estimate**: 2-4 weeks (depending on content depth) 
**Maintenance Effort**: ~2 hours/week after initial setup

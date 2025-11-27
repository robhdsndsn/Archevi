# Development Setup

Set up your local development environment.

## Prerequisites

- Node.js 18+
- pnpm
- Docker Desktop
- Git

## Quick Start

```bash
# Clone repository
git clone https://github.com/robhdsndsn/FamilySecondBrain
cd FamilySecondBrain

# Start backend
cd Infrastructure
docker-compose up -d

cd ../windmill-setup
docker-compose up -d

# Start frontend
cd ../frontend
pnpm install
pnpm run dev
```

## Frontend Development

```bash
cd frontend
pnpm run dev      # Start dev server
pnpm run build    # Build for production
pnpm run lint     # Run linter
pnpm run test     # Run tests
```

## Documentation Development

```bash
cd docs
pnpm run dev      # Start VitePress dev server
pnpm run build    # Build docs
```

## Code Style

- ESLint + Prettier for frontend
- TypeScript strict mode
- Conventional commits

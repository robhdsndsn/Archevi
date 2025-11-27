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
git clone https://github.com/robhdsndsn/Archevi.git
cd Archevi
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
VITE_WINDMILL_API_URL=http://localhost/api/w/archevi
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
- Email: `admin@archevi.com`
- Password: `ChangeThisPassword!`

Run the database schema initialization script (found in `/Infrastructure/schema.sql`).

## Step 5: Deploy Backend Scripts

Deploy the Python scripts from `/scripts` to Windmill workspace:
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
docker exec archevi-db pg_dump -U archevi archevi > backup.sql
```

## Next Steps

- [Learn how to use Archevi](/guide/usage)
- [Explore use cases](/use-cases/)

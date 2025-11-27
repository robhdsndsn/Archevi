# Infrastructure Setup

This folder contains all infrastructure configuration files for the Archevi project.

## Files

- **schema.sql** - PostgreSQL database schema with pgvector extension
- **docker-compose.yml** - Docker Compose configuration for PostgreSQL
- **.env.example** - Environment variables template (copy to .env and configure)

## Quick Start

### 1. Setup Environment Variables

```bash
cp .env.example .env
# Edit .env and add your Cohere API key and database password
```

### 2. Start PostgreSQL with pgvector

```bash
docker compose up -d
```

### 3. Verify Database Setup

```bash
# Connect to database
docker exec -it archevi-db psql -U archevi -d archevi

# Verify pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

# Verify tables
\dt
```

### 4. Setup Windmill

Follow the official Windmill setup guide:
```bash
mkdir ~/windmill-archevi
cd ~/windmill-archevi
curl -o docker-compose.yml https://raw.githubusercontent.com/windmill-labs/windmill/main/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/windmill-labs/windmill/main/.env
docker compose up -d
```

Access Windmill at: http://localhost
Default credentials: admin@windmill.dev / changeme (change immediately!)

## Database Backup

```bash
# Create backup
docker exec archevi-db pg_dump -U archevi archevi | gzip > ../backups/archevi_$(date +%Y%m%d).sql.gz

# Restore backup
gunzip -c ../backups/archevi_YYYYMMDD.sql.gz | docker exec -i archevi-db psql -U archevi -d archevi
```

## Troubleshooting

### Cannot connect to database
```bash
# Check if container is running
docker ps | grep archevi-db

# Check logs
docker logs archevi-db

# Restart container
docker restart archevi-db
```

### Schema not applied
```bash
# Manually apply schema
docker exec -i archevi-db psql -U archevi -d archevi < schema.sql
```

## Security Notes

- PostgreSQL is bound to localhost only (127.0.0.1:5433)
- Change default passwords in .env before deployment
- Never commit .env file to git (already in .gitignore)
- Consider enabling Cohere ZDR (Zero Data Retention) for privacy

# Self-Hosted Pricing

Run Archevi on your own infrastructure.

## Costs Breakdown

| Component | Monthly Cost |
|-----------|-------------|
| Cohere API | ~$2 |
| Your Server | $0-20 |
| **Total** | **~$2-22** |

## Cohere API Pricing

Archevi uses Cohere's Command and Embed models:

- **Embed**: ~$0.10 per 1M tokens
- **Command**: ~$0.50 per 1M tokens

Typical family usage: 100-500K tokens/month = **$0.50-$2.00**

## Server Options

### Free Tier (Home Server)

Run on existing hardware:
- Old laptop or desktop
- Raspberry Pi 4+ (8GB)
- NAS with Docker support

**Cost: $0** (uses existing hardware)

### Cloud VPS

- DigitalOcean: $4-12/month
- Linode: $5-12/month
- AWS Lightsail: $5-20/month

**Recommended: 2GB RAM, 20GB storage**

## What You Need

- Docker Desktop
- 4GB RAM minimum
- Cohere API key (free tier available)
- Basic command line knowledge

## Example Monthly Budget

| Usage Level | Cohere | Server | Total |
|-------------|--------|--------|-------|
| Light | $0.50 | $0 | $0.50 |
| Normal | $2.00 | $0 | $2.00 |
| Heavy | $5.00 | $0 | $5.00 |
| With Cloud | $2.00 | $10 | $12.00 |

*Most families fall in the $2/month range*

## Get Started

[Installation Guide](/guide/installation)

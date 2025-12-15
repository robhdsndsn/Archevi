# Frequently Asked Questions

## General

### What is Archevi?

Archevi is an AI-powered family knowledge base that helps you store, organize, and instantly search all your important family information using natural language.

### How is it different from Google Drive or Dropbox?

Unlike file storage services, Archevi **understands your content**. You can ask "What medications is mom taking?" and get an instant answer, rather than opening multiple files to find the information.

### Do I need to set up anything technical?

No! Archevi is a fully-managed service. Sign up, and you're ready to go. AI is included in your subscription - no API keys, no configuration, no technical setup required.

### How do I know if I'm exceeding my AI allowance?

Your Archevi dashboard shows your current usage against your plan's allowance. We'll notify you if you approach your limit, and overages are minimal (roughly $0.01 per extra query).

### Is my data safe?

Absolutely. Each family gets their own **isolated database** - your data is never mixed with other customers. We process queries securely on your behalf, and your documents are never used to train AI models.

### Where is my data stored?

All data is stored in Canadian data centers, making Archevi **PIPEDA compliant**. Your family's information never leaves Canada.

## Privacy & Security

### Do you read my documents?

No. Your documents are stored in your isolated database. We process your queries securely but don't store them. Your documents are never used to train AI models.

### Is Archevi PIPEDA compliant?

Yes. Archevi is designed with Canadian privacy law in mind:
- Canadian-hosted infrastructure
- Data isolation per customer
- Full data export available
- Clear privacy policies

### Can I export my data?

Yes! You can export all documents, chat history, and settings at any time in standard formats (JSON, Markdown).

## Technical

### Which AI models does Archevi use?

Archevi uses enterprise-grade AI:
- **Embed v4.0** - For understanding and searching your documents
- **Rerank v3.5** - For finding the most relevant results
- **Command A** - For generating comprehensive answers
- **Command R** - For quick, efficient responses

### How much does the AI cost?

AI usage is included in your subscription:

| Plan | Included AI Allowance |
|------|----------------------|
| Starter ($14.99/mo) | $3.00/month (~150 queries) |
| Family ($24.99/mo) | $8.00/month (~400 queries) |
| Family Office | Unlimited |

Most families never exceed their allowance. If you do, overages are billed at $0.01 per 1,000 tokens (roughly $0.01 per query).

## Features

### How many documents can I store?

- **Starter Plan**: 10GB storage
- **Family Plan**: 50GB storage
- **Family Office**: Unlimited

### Can I share with family members?

Yes! Depending on your plan:
- **Starter**: Up to 5 family members
- **Family**: Unlimited family members
- **Family Office**: Unlimited with custom roles

Each member can have different permission levels:
- **Owner** - Full control, billing access
- **Admin** - Manage members, all documents
- **Member** - Add/view documents, chat
- **Viewer** - Read-only access

### Can I belong to multiple families?

Yes! The multi-tenant architecture supports users belonging to multiple families. For example:
- Adult children managing elderly parents' family + their own
- Blended families with separate knowledge bases
- Professional organizers managing multiple clients

Switch between families using the family selector in the sidebar.

### Does it work on mobile?

Yes, Archevi is fully responsive and works great on phones and tablets. A native mobile app is on the roadmap.

### Can I use it offline?

Currently, Archevi requires an internet connection for AI processing. Offline mode is being considered for future releases.

## Getting Started

### How long does setup take?

About **60 seconds** to sign up. You can start adding documents and asking questions immediately.

### What happens after I sign up?

1. You get your own subdomain (e.g., `yourfamily.archevi.ca`)
2. Your isolated database is created automatically
3. You're ready to add documents and start querying immediately

You're ready to start organizing your family's information immediately.

### Can I try before I buy?

Yes! We offer a **14-day free trial** with full features, including AI usage.

## Troubleshooting

### Why are my queries slow?

First query after logging in may take a few seconds as the system warms up. Subsequent queries should be fast (1-2 seconds). If consistently slow:
- Check your internet connection
- Check our status page
- Contact support if the issue persists

### Why didn't it find my document?

- Ensure the document was successfully uploaded
- Try more specific keywords
- Check that the document contains the information you're looking for
- Very new documents may take a moment to be indexed

### How do I reset my password?

Click "Forgot Password" on the login page. You'll receive a reset link via email.

## Pricing & Billing

### What's included in the platform fee?

Your monthly fee covers:
- Isolated database and storage
- Secure hosting in Canada
- Automatic backups
- SSL and security
- Updates and new features
- Email support
- AI usage (included in your plan allowance)

### Can I cancel anytime?

Yes. Cancel anytime from your dashboard. Your data export is available for 30 days after cancellation.

### Do you offer discounts?

- **Founding Member**: First 100 families get 33% off forever
- **Annual billing**: Coming soon

## Support

### How do I get help?

1. Check this FAQ
2. Read the [documentation](/guide/)
3. Email [support@archevi.ca](mailto:support@archevi.ca)
4. Family plan includes priority support

### Is there a community?

A Discord community is coming soon! [Join the waitlist](https://archevi.ca/community) to be notified.

## Roadmap

### What's New in v0.3.0?

Major multi-tenant architecture release:

- **Multi-Tenant Architecture** - Complete data isolation between families
- **Multi-Family Support** - Users can belong to multiple families with different roles
- **Admin Dashboard** - System-wide tenant management for administrators
- **Plan-Based Limits** - Starter, Family, and Family Office tiers
- **Per-Tenant AI Tracking** - Usage and cost monitoring per family
- **Verified Isolation** - Cross-tenant queries are blocked (tested and verified)

### What's New in v0.2.0?

AI-enhanced document features:

- **Voice Notes** - Record and transcribe voice memos (80+ languages)
- **Document OCR** - Scan paper documents and extract text (Tesseract.js)
- **Smart Tags** - AI auto-generates relevant document tags
- **Expiry Alerts** - Get notified when documents expire
- **Auto-Categorization** - AI suggests document categories

### What features are coming?

- Tenant creation UI in admin dashboard
- Member invitation system (email-based)
- Document expiry notification emails
- Mobile-responsive improvements
- Bulk document import (ZIP upload)
- Advanced search filters (date range, category)
- Mobile native apps (iOS/Android)

### Can I request features?

Absolutely! Email [feedback@archevi.ca](mailto:feedback@archevi.ca) with your suggestions.

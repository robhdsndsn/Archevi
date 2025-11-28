# Frequently Asked Questions

## General

### What is Archevi?

Archevi is an AI-powered family knowledge base that helps you store, organize, and instantly search all your important family information using natural language.

### How is it different from Google Drive or Dropbox?

Unlike file storage services, Archevi **understands your content**. You can ask "What medications is mom taking?" and get an instant answer, rather than opening multiple files to find the information.

### Do I need to set up an API key?

No! Archevi includes AI usage in your subscription. You can start using it immediately after signing up. Optionally, you can bring your own Cohere API key (BYOK) for maximum privacy, but it's not required.

### What's the difference between managed and BYOK mode?

- **Managed Mode (default)**: AI is included in your subscription. We handle everything, you just use it.
- **BYOK Mode (optional)**: You use your own Cohere API key. Your queries go directly to Cohere for maximum privacy.

Most families use managed mode and never need to think about API keys.

### How do I know if I'm exceeding my AI allowance?

Your Archevi dashboard shows your current usage against your plan's allowance. We'll notify you if you approach your limit, and overages are minimal (roughly $0.01 per extra query).

### Is my data safe?

Absolutely. Each family gets their own **isolated database** - your data is never mixed with other customers. In managed mode, we process queries securely on your behalf. In BYOK mode, queries go directly to Cohere using your key.

### Where is my data stored?

All data is stored in Canadian data centers, making Archevi **PIPEDA compliant**. Your family's information never leaves Canada.

## Privacy & Security

### Do you read my documents?

No. Your documents are stored in your isolated database, and we have no access to them. In managed mode, we process your queries securely but don't store them. In BYOK mode, queries go directly to Cohere using your API key.

### What makes the BYOK model more private?

With Bring Your Own Key (BYOK):
- Your AI queries go directly to Cohere, not through our servers
- We never see your search patterns or questions
- You have full control over your AI usage and costs
- No query logs on our side

BYOK is optional and recommended for users handling highly sensitive information.

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

Archevi uses Cohere's latest enterprise AI:
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

### What if I want to use my own Cohere API key (BYOK)?

BYOK is optional. If you choose BYOK:
- You pay Cohere directly (typically $2-5 CAD/month for normal usage)
- Your queries go directly to Cohere for maximum privacy
- You have complete transparency on AI costs
- A single question costs less than $0.001 (a tenth of a cent)

[How to set up BYOK](/guide/byok-setup)

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

Each member can have different permission levels (Admin or User).

### Does it work on mobile?

Yes, Archevi is fully responsive and works great on phones and tablets. A native mobile app is on the roadmap.

### Can I use it offline?

Currently, Archevi requires an internet connection for AI processing. Offline mode is being considered for future releases.

## Getting Started

### How long does setup take?

About **60 seconds** to sign up. You can start adding documents and asking questions immediately - no API key setup required.

### What happens after I sign up?

1. You get your own subdomain (e.g., `yourfamily.archevi.ca`)
2. Your isolated database is created automatically
3. You're ready to add documents and start querying immediately

Optionally, you can set up BYOK for maximum privacy, but it's not required to get started.

### Can I try before I buy?

Yes! We offer a **14-day free trial** with full features, including AI usage.

## Troubleshooting

### Why are my queries slow?

First query after logging in may take a few seconds as the system warms up. Subsequent queries should be fast (1-2 seconds). If consistently slow:
- Check your internet connection
- Check [Cohere Status](https://status.cohere.com)
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

### Why would I use BYOK if AI is already included?

BYOK is optional and recommended if you:
- Handle highly sensitive information (medical, legal)
- Want queries to go directly to Cohere for maximum privacy
- Prefer direct billing transparency with Cohere
- Are a power user who wants granular cost control

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

### What features are coming?

- Mobile native apps (iOS/Android)
- Document OCR (scan paper documents)
- Voice queries
- Multi-language support (French first)
- Calendar integration
- Automated reminders
- Additional AI provider support

### Can I request features?

Absolutely! Email [feedback@archevi.ca](mailto:feedback@archevi.ca) with your suggestions.

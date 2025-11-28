# Frequently Asked Questions

## General

### What is Archevi?

Archevi is an AI-powered family knowledge base that helps you store, organize, and instantly search all your important family information using natural language.

### How is it different from Google Drive or Dropbox?

Unlike file storage services, Archevi **understands your content**. You can ask "What medications is mom taking?" and get an instant answer, rather than opening multiple files to find the information.

### Is my data safe?

Absolutely. Each family gets their own **isolated database** - your data is never mixed with other customers. Plus, you control your own AI processing through your Cohere API key, so we never see your queries.

### Where is my data stored?

All data is stored in Canadian data centers, making Archevi **PIPEDA compliant**. Your family's information never leaves Canada.

## Privacy & Security

### Do you read my documents?

No. Your documents are stored in your isolated database, and we have no access to them. When you query, your questions go directly to Cohere using YOUR API key - we never see what you're asking.

### What makes the BYOK model more private?

With Bring Your Own Key (BYOK):
- Your AI queries go directly to Cohere, not through our servers
- We never see your search patterns or questions
- You have full control over your AI usage
- No query logs on our side

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

You pay Cohere directly. Typical family usage is **$2-5 CAD/month**. Heavy users might see $5-10/month.

A single question costs less than $0.001 (a tenth of a cent).

[See full cost breakdown](/guide/cohere-setup#understanding-cohere-costs)

### Why do I need my own Cohere API key?

This is what makes Archevi truly private:
- Your queries never touch our servers
- You control your AI spending directly
- No usage limits from us
- Complete transparency on costs

[How to set up your Cohere API key](/guide/cohere-setup)

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

About **60 seconds** to sign up, plus **2 minutes** to set up your Cohere API key. You can start adding documents immediately after.

### What happens after I sign up?

1. You get your own subdomain (e.g., `yourfamily.archevi.ca`)
2. Your isolated database is created automatically
3. You connect your Cohere API key
4. You're ready to add documents and start querying

### Can I try before I buy?

Yes! We offer a **14-day free trial** with full features. You'll still need a Cohere API key (they have a free tier too).

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

### Why do I pay Cohere separately?

The BYOK model means:
- **Complete transparency** - You see exactly what AI costs
- **No markups** - We don't profit from your AI usage
- **Privacy** - We never see your queries
- **Control** - Set your own spending limits

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

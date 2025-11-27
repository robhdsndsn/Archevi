# Frequently Asked Questions

## General

### What is Archevi?

Archevi is an AI-powered family knowledge base that helps you store, organize, and instantly search all your important family information using natural language.

### How is it different from Google Drive or Dropbox?

Unlike file storage services, Archevi understands your content. You can ask "What medications is mom taking?" and get an instant answer, rather than opening multiple files to find the information.

### Is my data safe?

Yes. With self-hosted Archevi, your data never leaves your own servers. With managed hosting, data is encrypted and stored securely in Canadian data centers.

## Technical

### What are the system requirements?

**Self-Hosted:**
- Docker Desktop
- 4GB RAM minimum
- 10GB storage
- Cohere API key

**Managed:**
- Just a web browser!

### Which AI model does Archevi use?

Archevi uses Cohere's Command model for RAG (Retrieval-Augmented Generation) and their Embed model for document vectorization. This provides high-quality answers while keeping costs low.

### Can I use a different AI provider?

Currently, Archevi is optimized for Cohere. Support for OpenAI, Anthropic, and local models (Ollama) is on the roadmap.

### How much does the AI cost?

With Cohere's pricing, typical family usage costs about **$2 CAD/month**. Heavy users might see $5-10/month.

## Privacy

### Do you read my documents?

**Self-Hosted:** No one but you has access to your data.

**Managed:** We cannot read your documents. They're encrypted and we have no decryption access.

### Is Archevi PIPEDA compliant?

Yes. Archevi is designed with Canadian privacy law in mind. Your data stays in Canada (for managed hosting) and you have full control over your information.

### Can I export my data?

Yes! You can export all documents, chat history, and settings at any time in standard formats (JSON, Markdown).

## Features

### How many documents can I store?

**Self-Hosted:** Limited only by your storage space.

**Managed:** 10GB included, expandable upon request.

### Can I share with family members?

Yes! Add up to 5 family members (managed) or unlimited (self-hosted). Each member can have different permission levels.

### Does it work on mobile?

Yes, Archevi is fully responsive and works on phones and tablets. A native mobile app is on the roadmap.

### Can I use it offline?

Currently, Archevi requires an internet connection for AI processing. Offline mode is being considered for future releases.

## Troubleshooting

### Why are my queries slow?

First query after startup may take a few seconds as the system warms up. Subsequent queries should be fast (1-2 seconds). If consistently slow, check your internet connection and Cohere API status.

### Why didn't it find my document?

- Ensure the document was successfully uploaded
- Try more specific keywords
- Check that the document contains the information you're looking for
- Very new documents may take a moment to be indexed

### How do I reset my password?

**Self-Hosted:** Use the Windmill admin panel.

**Managed:** Use the "Forgot Password" link on the login page.

## Pricing

### Why is it so cheap?

We use efficient AI models (Cohere) and lean infrastructure. No VC funding pressure means we can keep prices sustainable.

### Is there a free tier?

Self-hosted is essentially free (just the ~$2/month Cohere API cost). Managed hosting has no free tier, but we offer a 14-day free trial.

### Do you offer family discounts?

The base plan includes 5 family members at no extra cost!

## Support

### How do I get help?

1. Check this FAQ
2. Read the [documentation](/guide/)
3. [GitHub Issues](https://github.com/robhdsndsn/Archevi/issues)
4. Email support (managed customers)

### Is there a community?

Yes! Join our [Discord server](https://discord.gg/archevi) (coming soon) to connect with other Archevi users.

## Roadmap

### What features are coming?

- Mobile native apps (iOS/Android)
- Document OCR (scan paper documents)
- Voice queries
- Multi-language support (French first)
- Ollama support (local AI)
- Calendar integration
- Automated reminders

### Can I request features?

Absolutely! Open an issue on [GitHub](https://github.com/robhdsndsn/Archevi/issues) or vote on existing feature requests.

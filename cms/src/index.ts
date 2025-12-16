import type { Core } from '@strapi/strapi';

// Seed data for testimonials
const testimonialSeedData = [
  {
    quote: "Archevi has completely transformed how our family manages important documents. I can finally find my insurance policies without digging through filing cabinets!",
    author_name: "Sarah Johnson",
    author_title: "Working Mom",
    author_company: "Toronto, ON",
    rating: 5,
    is_featured: true,
    display_order: 1
  },
  {
    quote: "As someone managing documents for aging parents, Archevi is a lifesaver. The AI search means I can quickly find Dad's medical records when we need them.",
    author_name: "Michael Chen",
    author_title: "Family Caregiver",
    author_company: "Vancouver, BC",
    rating: 5,
    is_featured: true,
    display_order: 2
  },
  {
    quote: "The expiry date alerts alone are worth the subscription. No more surprise license renewals or expired insurance policies.",
    author_name: "Emily Rodriguez",
    author_title: "Small Business Owner",
    author_company: "Calgary, AB",
    rating: 5,
    is_featured: true,
    display_order: 3
  },
  {
    quote: "Setting up our family vault took minutes, and now everyone has secure access to the documents they need.",
    author_name: "David Thompson",
    author_title: "IT Professional",
    author_company: "Ottawa, ON",
    rating: 4,
    is_featured: false,
    display_order: 4
  },
  {
    quote: "I love being able to ask questions in plain English and get answers from my documents. It's like having a personal assistant for our family paperwork.",
    author_name: "Lisa Patel",
    author_title: "Busy Parent",
    author_company: "Montreal, QC",
    rating: 5,
    is_featured: false,
    display_order: 5
  }
];

// Seed data for changelog entries
// Strapi Blocks content format: array of block objects
// Using 'as const' to preserve literal types for TypeScript
const changelogSeedData = [
  {
    version: 'v0.5.0',
    release_date: '2025-12-12',
    is_major: true,
    content: [
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Marketing Website' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Complete Next.js 16 marketing site with landing page, pricing, blog, FAQ, and signup functionality. Built with Strapi CMS integration for content management.' }] },
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Self-Service Signup' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'New users can sign up directly from the marketing site. Includes form validation, tenant provisioning, and seamless redirect to the dashboard.' }] },
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Strapi CMS Integration' }] },
      { type: 'list' as const, format: 'unordered' as const, children: [
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: '7 content types: Blog Posts, FAQs, Announcements, Changelog, Testimonials, Features, Legal Pages' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'REST API client with type-safe TypeScript interfaces' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'ISR (Incremental Static Regeneration) for content updates' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Announcement banner with location-based filtering' }] },
      ]},
    ],
  },
  {
    version: 'v0.4.9',
    release_date: '2025-12-10',
    is_major: false,
    content: [
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Billing & Subscription UI' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Complete subscription management in Settings with pricing table, usage metrics, and plan management.' }] },
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Biography Generator' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'AI-powered family member biographies with 4 writing styles, word count slider, and source citations from documents.' }] },
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Browser Text-to-Speech' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Free document reading using Web Speech API with voice selection, speed/pitch controls, and progress visualization.' }] },
    ],
  },
  {
    version: 'v0.4.8',
    release_date: '2025-12-10',
    is_major: false,
    content: [
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Family Timeline' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Visual chronological view of family events and milestones with AI-powered event extraction from documents.' }] },
      { type: 'list' as const, format: 'unordered' as const, children: [
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Color-coded event types (birth, death, wedding, medical, legal)' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Manual event creation with date picker' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Filter by year and event type' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Events linked to source documents' }] },
      ]},
    ],
  },
  {
    version: 'v0.4.7',
    release_date: '2025-12-10',
    is_major: false,
    content: [
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Two-Factor Authentication (2FA)' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'TOTP-based security for user accounts with authenticator app support, QR code setup, and backup codes for account recovery.' }] },
      { type: 'list' as const, format: 'unordered' as const, children: [
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Works with Google Authenticator, Authy, 1Password' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: '6-digit TOTP verification with 30-second window' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: '10 backup codes for account recovery' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'TOTP secrets stored encrypted in database' }] },
      ]},
    ],
  },
  {
    version: 'v0.4.6',
    release_date: '2025-12-10',
    is_major: false,
    content: [
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'PDF Visual Search' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Page-level visual search within PDF documents using Cohere Embed v4 multimodal embeddings.' }] },
      { type: 'list' as const, format: 'unordered' as const, children: [
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Find specific pages by visual content (charts, diagrams, handwritten notes)' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Page thumbnail previews with OCR text overlay' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Similarity scores for each matching page' }] },
      ]},
    ],
  },
  {
    version: 'v0.4.5',
    release_date: '2025-12-10',
    is_major: false,
    content: [
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Secure Links' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Password-protected document sharing with external parties.' }] },
      { type: 'list' as const, format: 'unordered' as const, children: [
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Generate unique shareable URLs' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Optional password protection (bcrypt hashed)' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'View limits (1, 5, 10, 25, unlimited)' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Expiration options (1 hour to 1 year)' }] },
      ]},
    ],
  },
  {
    version: 'v0.4.0',
    release_date: '2025-12-05',
    is_major: true,
    content: [
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Admin Dashboard' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Comprehensive administration interface with system health monitoring, tenant management, and API cost tracking.' }] },
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Document Sharing' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Share documents between tenant accounts with visibility controls.' }] },
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Rate Limiting' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'PostgreSQL-backed per-tenant rate limits with plan-based tiers.' }] },
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Automated Backups' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Scheduled database backups with configurable retention policies.' }] },
    ],
  },
  {
    version: 'v0.3.0',
    release_date: '2024-11-30',
    is_major: true,
    content: [
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Privacy Controls' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Document visibility levels: Everyone, Adults Only, Admins Only, Private.' }] },
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Member Types' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Admin, Adult, Teen, Child access levels with server-side visibility filtering.' }] },
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'New Features' }] },
      { type: 'list' as const, format: 'unordered' as const, children: [
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'AI Workflow Visualization' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'PDF Export for chat conversations' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Duplicate Detection on upload' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Document Preview on Hover' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Bulk Operations with multi-select' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Image Embedding with Cohere Embed v4' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Keyboard Shortcuts (Cmd+K, Cmd+U, Cmd+N)' }] },
      ]},
    ],
  },
  {
    version: 'v0.2.0',
    release_date: '2024-11-15',
    is_major: true,
    content: [
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Multi-Tenant Architecture' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'Complete data isolation between families with member invitation system.' }] },
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'New Features' }] },
      { type: 'list' as const, format: 'unordered' as const, children: [
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Analytics and usage tracking' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'OCR for scanned documents (20 languages)' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Voice note transcription (80+ languages)' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Expiry alerts dashboard' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Mobile PWA with camera scanning' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Tag cloud browsing' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Advanced filtering' }] },
      ]},
    ],
  },
  {
    version: 'v0.1.0',
    release_date: '2024-10-01',
    is_major: true,
    content: [
      { type: 'heading' as const, level: 3 as const, children: [{ type: 'text' as const, text: 'Initial Release' }] },
      { type: 'paragraph' as const, children: [{ type: 'text' as const, text: 'The first public release of Archevi - your family\'s AI-powered knowledge vault.' }] },
      { type: 'list' as const, format: 'unordered' as const, children: [
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Core RAG pipeline with source citations' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Document upload, search, and management' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'AI-enhanced document processing' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'PDF text extraction' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Natural language search' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'Family accounts with isolated storage' }] },
        { type: 'list-item' as const, children: [{ type: 'text' as const, text: 'JWT authentication with refresh tokens' }] },
      ]},
    ],
  },
];

// Seed data for features - category typed as literal union
const featureSeedData: Array<{
  title: string;
  slug: string;
  description: string;
  icon: string;
  category: 'Core' | 'AI' | 'Security' | 'Collaboration';
  display_order: number;
  is_highlighted: boolean;
}> = [
  {
    title: "Natural Language Search",
    slug: "natural-language-search",
    description: "Ask questions in plain English like 'When does my car insurance expire?' and get instant answers from your documents.",
    icon: "Search",
    category: "AI",
    display_order: 1,
    is_highlighted: true
  },
  {
    title: "AI-Powered Extraction",
    slug: "ai-powered-extraction",
    description: "Automatically extract key dates, names, amounts, and important information from uploaded documents.",
    icon: "Sparkles",
    category: "AI",
    display_order: 2,
    is_highlighted: true
  },
  {
    title: "Smart Expiry Alerts",
    slug: "smart-expiry-alerts",
    description: "Never miss a renewal date. Get automatic notifications before documents expire, from insurance policies to passports.",
    icon: "Bell",
    category: "Core",
    display_order: 3,
    is_highlighted: true
  },
  {
    title: "Family Collaboration",
    slug: "family-collaboration",
    description: "Securely share documents with family members. Control who can view, edit, or manage different categories.",
    icon: "Users",
    category: "Collaboration",
    display_order: 4,
    is_highlighted: true
  },
  {
    title: "Voice Note Transcription",
    slug: "voice-note-transcription",
    description: "Record voice notes and have them automatically transcribed and made searchable alongside your documents.",
    icon: "Mic",
    category: "AI",
    display_order: 5,
    is_highlighted: false
  },
  {
    title: "Bank-Level Encryption",
    slug: "bank-level-encryption",
    description: "Your documents are encrypted with AES-256 at rest and in transit. We never access your content for training.",
    icon: "Shield",
    category: "Security",
    display_order: 6,
    is_highlighted: true
  },
  {
    title: "OCR for Scanned Documents",
    slug: "ocr-scanned-documents",
    description: "Upload scanned documents and photos. Our OCR technology makes the text fully searchable.",
    icon: "ScanLine",
    category: "AI",
    display_order: 7,
    is_highlighted: false
  },
  {
    title: "Document Versioning",
    slug: "document-versioning",
    description: "Track changes over time. Access previous versions of documents and see the full history of updates.",
    icon: "History",
    category: "Core",
    display_order: 8,
    is_highlighted: false
  },
  {
    title: "Calendar Integration",
    slug: "calendar-integration",
    description: "Subscribe to a calendar feed of document expiry dates. Works with Google Calendar, Apple Calendar, and Outlook.",
    icon: "Calendar",
    category: "Core",
    display_order: 9,
    is_highlighted: false
  },
  {
    title: "PIPEDA Compliant",
    slug: "pipeda-compliant",
    description: "Built with Canadian privacy regulations in mind. Your data stays in Canada and is protected under PIPEDA.",
    icon: "ShieldCheck",
    category: "Security",
    display_order: 10,
    is_highlighted: false
  }
];

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Set up public permissions for marketing content types
    const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (publicRole) {
      // Content types that should be publicly readable
      const publicContentTypes = [
        'api::announcement.announcement',
        'api::blog-post.blog-post',
        'api::faq.faq',
        'api::changelog.changelog',
        'api::testimonial.testimonial',
        'api::feature.feature',
        'api::legal-page.legal-page',
      ];

      // Actions to allow for public access (read-only)
      const publicActions = ['find', 'findOne'];

      for (const contentType of publicContentTypes) {
        for (const action of publicActions) {
          const permissionExists = await strapi.query('plugin::users-permissions.permission').findOne({
            where: {
              role: publicRole.id,
              action: `${contentType}.${action}`,
            },
          });

          if (!permissionExists) {
            await strapi.query('plugin::users-permissions.permission').create({
              data: {
                role: publicRole.id,
                action: `${contentType}.${action}`,
              },
            });
            console.log(`Created public permission: ${contentType}.${action}`);
          }
        }
      }
    }

    // Seed testimonials if empty
    const existingTestimonials = await strapi.documents('api::testimonial.testimonial').findMany({
      limit: 1,
    });

    if (existingTestimonials.length === 0) {
      console.log('Seeding testimonials...');
      for (const testimonial of testimonialSeedData) {
        await strapi.documents('api::testimonial.testimonial').create({
          data: testimonial,
          status: 'published',
        });
        console.log(`Created testimonial: ${testimonial.author_name}`);
      }
    }

    // Seed features if empty
    const existingFeatures = await strapi.documents('api::feature.feature').findMany({
      limit: 1,
    });

    if (existingFeatures.length === 0) {
      console.log('Seeding features...');
      for (const feature of featureSeedData) {
        await strapi.documents('api::feature.feature').create({
          data: feature,
          status: 'published',
        });
        console.log(`Created feature: ${feature.title}`);
      }
    }

    // Seed changelog entries if empty
    const existingChangelogs = await strapi.documents('api::changelog.changelog').findMany({
      limit: 1,
    });

    if (existingChangelogs.length === 0) {
      console.log('Seeding changelog entries...');
      for (const entry of changelogSeedData) {
        await strapi.documents('api::changelog.changelog').create({
          data: entry,
          status: 'published',
        });
        console.log(`Created changelog entry: ${entry.version}`);
      }
    }
  },
};

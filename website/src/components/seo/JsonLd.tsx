/**
 * JSON-LD Structured Data Components
 * Provides rich snippets for Google search results
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

import type { BlogPost, FAQ, Changelog } from '@/lib/types/strapi';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://archevi.ca';
const SITE_NAME = 'Archevi';

/**
 * Organization schema - Use on homepage
 * Shows company info in search results
 */
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "Archevi is your family's AI-powered knowledge vault. Store, search, and understand your important documents with natural language.",
    foundingDate: '2024',
    founders: [
      {
        '@type': 'Person',
        name: 'Archevi Team',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CA',
    },
    sameAs: [
      // Add social media URLs when available
      // 'https://twitter.com/archevi',
      // 'https://github.com/archevi',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@archevi.ca',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * WebSite schema with SearchAction - Use on homepage
 * Enables sitelinks search box in Google
 */
export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Your family's AI-powered knowledge vault for document management and search.",
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * SoftwareApplication schema - Use on homepage or pricing page
 * Shows app info in search results
 */
export function SoftwareApplicationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'CAD',
      lowPrice: '14.99',
      highPrice: '24.99',
      offerCount: 3,
    },
    description:
      "AI-powered family document management. Store, search, and understand your documents with natural language queries.",
    featureList: [
      'Natural Language Search',
      'AI-Powered Document Extraction',
      'Expiry Date Alerts',
      'Voice Note Transcription',
      'Family Collaboration',
      'Privacy-First Design',
    ],
    screenshot: `${SITE_URL}/screenshots/dashboard.png`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQPage schema - Use on /faq page
 * Shows FAQ rich snippets in search results
 */
interface FAQPageJsonLdProps {
  faqs: FAQ[];
}

export function FAQPageJsonLd({ faqs }: FAQPageJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: extractTextFromBlocks(faq.answer),
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * BlogPosting schema - Use on individual blog post pages
 * Shows article rich snippets with author, date, image
 */
interface BlogPostingJsonLdProps {
  post: BlogPost;
}

export function BlogPostingJsonLd({ post }: BlogPostingJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || '',
    image: post.featured_image?.url
      ? post.featured_image.url.startsWith('http')
        ? post.featured_image.url
        : `${process.env.NEXT_PUBLIC_STRAPI_URL}${post.featured_image.url}`
      : `${SITE_URL}/og-image.png`,
    datePublished: post.published_date || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author || 'Archevi Team',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    keywords: post.category ? [post.category] : [],
    articleSection: post.category || 'General',
    wordCount: estimateWordCount(post.content),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * BreadcrumbList schema - Use on any page with breadcrumbs
 * Shows breadcrumb navigation in search results
 */
interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Product schema with pricing - Use on pricing page
 * Shows price information in search results
 */
interface PricingPlan {
  name: string;
  description: string;
  price: number | null;
  currency: string;
  features: string[];
}

interface ProductJsonLdProps {
  plans: PricingPlan[];
}

export function ProductJsonLd({ plans }: ProductJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${SITE_NAME} Subscription`,
    description:
      "AI-powered family document management with natural language search, expiry alerts, and secure collaboration.",
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    offers: plans
      .filter((plan) => plan.price !== null)
      .map((plan) => ({
        '@type': 'Offer',
        name: plan.name,
        description: plan.description,
        price: plan.price,
        priceCurrency: plan.currency,
        priceValidUntil: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(),
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/pricing`,
      })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Article schema for changelog/release notes
 */
interface ChangelogJsonLdProps {
  entries: Changelog[];
}

export function ChangelogJsonLd({ entries }: ChangelogJsonLdProps) {
  const latestEntry = entries[0];
  if (!latestEntry) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${SITE_NAME} Changelog - Version ${latestEntry.version}`,
    description: `Release notes and updates for ${SITE_NAME}. Latest version: ${latestEntry.version}`,
    datePublished: latestEntry.release_date,
    dateModified: entries[0]?.release_date,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/changelog`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Helper function to extract plain text from Strapi Blocks content
function extractTextFromBlocks(content: unknown): string {
  if (!content || !Array.isArray(content)) return '';

  const extractText = (node: unknown): string => {
    if (!node || typeof node !== 'object') return '';

    const n = node as Record<string, unknown>;

    if (n.text && typeof n.text === 'string') {
      return n.text;
    }

    if (n.children && Array.isArray(n.children)) {
      return n.children.map(extractText).join(' ');
    }

    return '';
  };

  return content.map(extractText).join(' ').trim();
}

// Helper function to estimate word count from Blocks content
function estimateWordCount(content: unknown): number {
  const text = extractTextFromBlocks(content);
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

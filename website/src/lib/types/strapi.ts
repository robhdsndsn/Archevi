/**
 * Strapi CMS Types for Archevi Marketing Site
 * These types match the Strapi content types for Blog, FAQ, Announcement, and Changelog
 */

// =============================================================================
// Strapi Response Types
// =============================================================================

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiMeta {
  pagination?: StrapiPagination;
}

export interface StrapiResponse<T> {
  data: T[];
  meta: StrapiMeta;
}

export interface StrapiSingleResponse<T> {
  data: T;
  meta: object;
}

export interface StrapiError {
  status: number;
  name: string;
  message: string;
  details?: object;
}

// =============================================================================
// Strapi Media Types
// =============================================================================

export interface StrapiMediaFormat {
  url: string;
  width: number;
  height: number;
  size: number;
  name: string;
  hash: string;
  ext: string;
  mime: string;
}

export interface StrapiMedia {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: {
    thumbnail?: StrapiMediaFormat;
    small?: StrapiMediaFormat;
    medium?: StrapiMediaFormat;
    large?: StrapiMediaFormat;
  } | null;
  url: string;
  previewUrl: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// Rich Text (Blocks) Types
// =============================================================================

export type BlocksContent = Array<{
  type: string;
  children?: Array<{
    type: string;
    text?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    code?: boolean;
    url?: string;
    children?: Array<{ type: string; text: string }>;
  }>;
  level?: number;
  format?: string;
  image?: {
    url: string;
    alternativeText: string | null;
    width: number;
    height: number;
  };
}>;

// =============================================================================
// Content Types
// =============================================================================

// Blog Post Categories (PascalCase as defined in Strapi)
export type BlogCategory = 'News' | 'Updates' | 'Features' | 'Community';

// FAQ Categories (matches Strapi schema - can be customized in Strapi admin)
export type FAQCategory = 'Getting Started' | 'Messaging' | 'Account' | 'Privacy' | 'Technical';

// Announcement Types (PascalCase as defined in Strapi)
export type AnnouncementType = 'Info' | 'Warning' | 'Success' | 'Alert';

// Target roles for announcements
export type AnnouncementTargetRole = 'All' | 'OlderAdult' | 'Volunteer' | 'Family';

// Display locations for announcements
export type AnnouncementDisplayLocation = 'Everywhere' | 'Home' | 'Pricing' | 'Features' | 'Blog' | 'FAQ' | 'Dashboard' | 'Changelog';

// Feature Categories
export type FeatureCategory = 'Core' | 'AI' | 'Security' | 'Collaboration';

// =============================================================================
// Blog Post
// =============================================================================

export interface BlogPost {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: BlocksContent;
  excerpt: string | null;
  featured_image: StrapiMedia | null;
  author: string | null;
  published_date: string | null;
  category: BlogCategory | null;
  is_published: boolean;
  seo?: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    canonicalURL: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// =============================================================================
// FAQ
// =============================================================================

export interface FAQ {
  id: number;
  documentId: string;
  question: string;
  answer: BlocksContent;
  category: FAQCategory | null;
  order: number;
  is_published: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// =============================================================================
// Announcement
// =============================================================================

export interface Announcement {
  id: number;
  documentId: string;
  title: string;
  message: BlocksContent;
  announcement_type: AnnouncementType;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  target_roles: AnnouncementTargetRole;
  display_location: AnnouncementDisplayLocation;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// =============================================================================
// Changelog
// =============================================================================

export interface Changelog {
  id: number;
  documentId: string;
  version: string;
  release_date: string;
  content: BlocksContent;
  is_major: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// =============================================================================
// Query Parameters
// =============================================================================

export interface BlogQueryParams {
  page?: number;
  pageSize?: number;
  category?: BlogCategory;
  slug?: string;
}

export interface FAQQueryParams {
  category?: FAQCategory;
}

export interface AnnouncementQueryParams {
  activeOnly?: boolean;
  location?: AnnouncementDisplayLocation;
}

export interface ChangelogQueryParams {
  limit?: number;
}

export interface TestimonialQueryParams {
  featuredOnly?: boolean;
  limit?: number;
}

export interface FeatureQueryParams {
  category?: FeatureCategory;
  highlightedOnly?: boolean;
}

export interface LegalPageQueryParams {
  slug?: string;
}

// =============================================================================
// Testimonial
// =============================================================================

export interface Testimonial {
  id: number;
  documentId: string;
  quote: string;
  author_name: string;
  author_title: string | null;
  author_company: string | null;
  author_image: StrapiMedia | null;
  rating: number | null;
  is_featured: boolean;
  display_order: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// =============================================================================
// Feature
// =============================================================================

export interface Feature {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  description: string;
  long_description: BlocksContent | null;
  icon: string | null;
  category: FeatureCategory;
  display_order: number;
  is_highlighted: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// =============================================================================
// Legal Page
// =============================================================================

export interface LegalPage {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content: BlocksContent;
  last_updated: string;
  version: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

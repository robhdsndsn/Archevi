/**
 * Strapi CMS Client for Archevi Marketing Site
 * Type-safe client for fetching content from Strapi headless CMS
 */

import type {
  StrapiResponse,
  StrapiSingleResponse,
  BlogPost,
  FAQ,
  Announcement,
  Changelog,
  Testimonial,
  Feature,
  LegalPage,
  BlogQueryParams,
  FAQQueryParams,
  AnnouncementQueryParams,
  ChangelogQueryParams,
  TestimonialQueryParams,
  FeatureQueryParams,
  LegalPageQueryParams,
  BlocksContent,
} from './types/strapi';

// =============================================================================
// Configuration
// =============================================================================

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Build query string from parameters
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        // Handle nested objects like filters and pagination
        Object.entries(value as Record<string, unknown>).forEach(([nestedKey, nestedValue]) => {
          if (nestedValue !== undefined && nestedValue !== null) {
            searchParams.append(`${key}[${nestedKey}]`, String(nestedValue));
          }
        });
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  return searchParams.toString();
}

/**
 * Make authenticated request to Strapi API
 */
async function strapiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${STRAPI_URL}/api${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(STRAPI_API_TOKEN && { Authorization: `Bearer ${STRAPI_API_TOKEN}` }),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Strapi API error: ${response.status} ${response.statusText}${
        errorData.error?.message ? ` - ${errorData.error.message}` : ''
      }`
    );
  }

  return response.json();
}

// =============================================================================
// Rich Text Renderer
// =============================================================================

/**
 * Convert Strapi Blocks content to HTML string
 * This is a basic renderer - consider using @strapi/blocks-react-renderer for React
 */
export function renderBlocksToHTML(content: BlocksContent): string {
  if (!content || !Array.isArray(content)) return '';

  return content
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
          return `<p>${renderChildren(block.children)}</p>`;
        case 'heading':
          const level = block.level || 2;
          return `<h${level}>${renderChildren(block.children)}</h${level}>`;
        case 'list':
          const tag = block.format === 'ordered' ? 'ol' : 'ul';
          return `<${tag}>${renderChildren(block.children)}</${tag}>`;
        case 'list-item':
          return `<li>${renderChildren(block.children)}</li>`;
        case 'quote':
          return `<blockquote>${renderChildren(block.children)}</blockquote>`;
        case 'code':
          return `<pre><code>${renderChildren(block.children)}</code></pre>`;
        case 'image':
          if (block.image) {
            return `<img src="${block.image.url}" alt="${block.image.alternativeText || ''}" width="${block.image.width}" height="${block.image.height}" />`;
          }
          return '';
        default:
          return renderChildren(block.children);
      }
    })
    .join('\n');
}

function renderChildren(children?: BlocksContent[number]['children']): string {
  if (!children) return '';

  return children
    .map((child) => {
      if (child.type === 'text' && child.text) {
        let text = child.text;
        if (child.bold) text = `<strong>${text}</strong>`;
        if (child.italic) text = `<em>${text}</em>`;
        if (child.underline) text = `<u>${text}</u>`;
        if (child.strikethrough) text = `<s>${text}</s>`;
        if (child.code) text = `<code>${text}</code>`;
        return text;
      }
      if (child.type === 'link' && child.url) {
        return `<a href="${child.url}">${renderChildren(child.children as BlocksContent[number]['children'])}</a>`;
      }
      return '';
    })
    .join('');
}

/**
 * Convert Strapi Blocks content to plain text (for excerpts, SEO, etc.)
 */
export function renderBlocksToText(content: BlocksContent): string {
  if (!content || !Array.isArray(content)) return '';

  return content
    .map((block) => {
      if (block.children) {
        return block.children
          .map((child) => {
            if (child.type === 'text' && child.text) {
              return child.text;
            }
            if (child.type === 'link' && child.children) {
              return child.children.map((c) => c.text || '').join('');
            }
            return '';
          })
          .join('');
      }
      return '';
    })
    .join(' ')
    .trim();
}

// =============================================================================
// Blog Posts API
// =============================================================================

/**
 * Get all published blog posts with pagination
 */
export async function getBlogPosts(
  params: BlogQueryParams = {}
): Promise<StrapiResponse<BlogPost>> {
  const { page = 1, pageSize = 10, category } = params;

  const queryParams: Record<string, unknown> = {
    'pagination[page]': page,
    'pagination[pageSize]': pageSize,
    'sort[0]': 'published_date:desc',
    'filters[is_published][$eq]': true,
    'populate': '*',
  };

  if (category) {
    queryParams['filters[category][$eq]'] = category;
  }

  const queryString = buildQueryString(queryParams);
  return strapiRequest<StrapiResponse<BlogPost>>(`/blog-posts?${queryString}`);
}

/**
 * Get a single blog post by document ID
 */
export async function getBlogPost(
  documentId: string
): Promise<StrapiSingleResponse<BlogPost>> {
  return strapiRequest<StrapiSingleResponse<BlogPost>>(
    `/blog-posts/${documentId}?populate=*`
  );
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const queryParams = buildQueryString({
    'filters[slug][$eq]': slug,
    'filters[is_published][$eq]': true,
    'populate': '*',
  });

  const response = await strapiRequest<StrapiResponse<BlogPost>>(
    `/blog-posts?${queryParams}`
  );

  return response.data[0] || null;
}

/**
 * Get all blog post slugs (for static generation)
 */
export async function getAllBlogSlugs(): Promise<string[]> {
  const queryParams = buildQueryString({
    'filters[is_published][$eq]': true,
    'fields[0]': 'slug',
    'pagination[pageSize]': 1000,
  });

  const response = await strapiRequest<StrapiResponse<Pick<BlogPost, 'slug'>>>(
    `/blog-posts?${queryParams}`
  );

  return response.data.map((post) => post.slug);
}

// =============================================================================
// FAQs API
// =============================================================================

/**
 * Get all published FAQs
 */
export async function getFAQs(
  params: FAQQueryParams = {}
): Promise<StrapiResponse<FAQ>> {
  const { category } = params;

  const queryParams: Record<string, unknown> = {
    'filters[is_published][$eq]': true,
    'sort[0]': 'order:asc',
    'pagination[pageSize]': 100,
  };

  if (category) {
    queryParams['filters[category][$eq]'] = category;
  }

  const queryString = buildQueryString(queryParams);
  return strapiRequest<StrapiResponse<FAQ>>(`/faqs?${queryString}`);
}

/**
 * Get FAQs grouped by category
 */
export async function getFAQsByCategory(): Promise<Record<string, FAQ[]>> {
  const response = await getFAQs();

  return response.data.reduce((acc, faq) => {
    const category = faq.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);
}

// =============================================================================
// Announcements API
// =============================================================================

/**
 * Get all announcements (optionally filtered by active status and location)
 */
export async function getAnnouncements(
  params: AnnouncementQueryParams = {}
): Promise<StrapiResponse<Announcement>> {
  const { activeOnly = true, location } = params;

  const queryParams: Record<string, unknown> = {
    'sort[0]': 'createdAt:desc',
  };

  if (activeOnly) {
    queryParams['filters[is_active][$eq]'] = true;
    // Also filter by date range
    const now = new Date().toISOString();
    queryParams['filters[$or][0][start_date][$null]'] = true;
    queryParams['filters[$or][1][start_date][$lte]'] = now;
    queryParams['filters[$or][2][end_date][$null]'] = true;
    queryParams['filters[$or][3][end_date][$gte]'] = now;
  }

  // Filter by location - show announcements for this location OR "Everywhere"
  if (location) {
    queryParams['filters[$or][4][display_location][$eq]'] = location;
    queryParams['filters[$or][5][display_location][$eq]'] = 'Everywhere';
  }

  const queryString = buildQueryString(queryParams);
  return strapiRequest<StrapiResponse<Announcement>>(
    `/announcements?${queryString}`
  );
}

/**
 * Get the latest active announcement for a specific location (for banner display)
 */
export async function getLatestAnnouncement(
  location?: AnnouncementQueryParams['location']
): Promise<Announcement | null> {
  const response = await getAnnouncements({
    activeOnly: true,
    location,
  });

  // Find the first announcement that matches the date criteria
  for (const announcement of response.data) {
    // Check date range on client side for more precise filtering
    if (announcement.start_date && new Date(announcement.start_date) > new Date()) {
      continue;
    }
    if (announcement.end_date && new Date(announcement.end_date) < new Date()) {
      continue;
    }

    // If location is specified, only return announcements for that location or "Everywhere"
    if (location && announcement.display_location !== location && announcement.display_location !== 'Everywhere') {
      continue;
    }

    return announcement;
  }

  return null;
}

/**
 * Get all active announcements for a specific page/location
 * Returns announcements that target this location OR "Everywhere"
 */
export async function getAnnouncementsForLocation(
  location: AnnouncementQueryParams['location']
): Promise<Announcement[]> {
  const response = await getAnnouncements({
    activeOnly: true,
    location,
  });

  // Filter by date range on client side for precision
  return response.data.filter((announcement) => {
    if (announcement.start_date && new Date(announcement.start_date) > new Date()) {
      return false;
    }
    if (announcement.end_date && new Date(announcement.end_date) < new Date()) {
      return false;
    }
    // Include if location matches OR is "Everywhere"
    return announcement.display_location === location || announcement.display_location === 'Everywhere';
  });
}

// =============================================================================
// Changelog API
// =============================================================================

/**
 * Get changelog entries
 */
export async function getChangelog(
  params: ChangelogQueryParams = {}
): Promise<StrapiResponse<Changelog>> {
  const { limit = 10 } = params;

  const queryParams = buildQueryString({
    'sort[0]': 'release_date:desc',
    'pagination[pageSize]': limit,
  });

  return strapiRequest<StrapiResponse<Changelog>>(`/changelogs?${queryParams}`);
}

/**
 * Get the latest changelog entry
 */
export async function getLatestChangelog(): Promise<Changelog | null> {
  const response = await getChangelog({ limit: 1 });
  return response.data[0] || null;
}

// =============================================================================
// Testimonials API
// =============================================================================

/**
 * Get testimonials
 */
export async function getTestimonials(
  params: TestimonialQueryParams = {}
): Promise<StrapiResponse<Testimonial>> {
  const { featuredOnly = false, limit = 10 } = params;

  const queryParams: Record<string, unknown> = {
    'sort[0]': 'display_order:asc',
    'pagination[pageSize]': limit,
    'populate': '*',
  };

  if (featuredOnly) {
    queryParams['filters[is_featured][$eq]'] = true;
  }

  const queryString = buildQueryString(queryParams);
  return strapiRequest<StrapiResponse<Testimonial>>(`/testimonials?${queryString}`);
}

/**
 * Get featured testimonials (for homepage)
 */
export async function getFeaturedTestimonials(
  limit = 3
): Promise<Testimonial[]> {
  const response = await getTestimonials({ featuredOnly: true, limit });
  return response.data;
}

// =============================================================================
// Features API
// =============================================================================

/**
 * Get features
 */
export async function getFeatures(
  params: FeatureQueryParams = {}
): Promise<StrapiResponse<Feature>> {
  const { category, highlightedOnly = false } = params;

  const queryParams: Record<string, unknown> = {
    'sort[0]': 'display_order:asc',
    'pagination[pageSize]': 100,
  };

  if (category) {
    queryParams['filters[category][$eq]'] = category;
  }

  if (highlightedOnly) {
    queryParams['filters[is_highlighted][$eq]'] = true;
  }

  const queryString = buildQueryString(queryParams);
  return strapiRequest<StrapiResponse<Feature>>(`/features?${queryString}`);
}

/**
 * Get a single feature by slug
 */
export async function getFeatureBySlug(slug: string): Promise<Feature | null> {
  const queryParams = buildQueryString({
    'filters[slug][$eq]': slug,
    'populate': '*',
  });

  const response = await strapiRequest<StrapiResponse<Feature>>(
    `/features?${queryParams}`
  );

  return response.data[0] || null;
}

/**
 * Get features grouped by category
 */
export async function getFeaturesByCategory(): Promise<Record<string, Feature[]>> {
  const response = await getFeatures();

  return response.data.reduce((acc, feature) => {
    const category = feature.category || 'Core';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);
}

// =============================================================================
// Legal Pages API
// =============================================================================

/**
 * Get all legal pages
 */
export async function getLegalPages(): Promise<StrapiResponse<LegalPage>> {
  const queryParams = buildQueryString({
    'sort[0]': 'title:asc',
    'pagination[pageSize]': 100,
  });

  return strapiRequest<StrapiResponse<LegalPage>>(`/legal-pages?${queryParams}`);
}

/**
 * Get a single legal page by slug
 */
export async function getLegalPageBySlug(slug: string): Promise<LegalPage | null> {
  const queryParams = buildQueryString({
    'filters[slug][$eq]': slug,
  });

  const response = await strapiRequest<StrapiResponse<LegalPage>>(
    `/legal-pages?${queryParams}`
  );

  return response.data[0] || null;
}

/**
 * Get all legal page slugs (for static generation)
 */
export async function getAllLegalPageSlugs(): Promise<string[]> {
  const queryParams = buildQueryString({
    'fields[0]': 'slug',
    'pagination[pageSize]': 100,
  });

  const response = await strapiRequest<StrapiResponse<Pick<LegalPage, 'slug'>>>(
    `/legal-pages?${queryParams}`
  );

  return response.data.map((page) => page.slug);
}

// =============================================================================
// Strapi Client Class (Alternative OOP interface)
// =============================================================================

export class StrapiClient {
  private baseURL: string;
  private apiToken?: string;

  constructor(baseURL?: string, apiToken?: string) {
    this.baseURL = baseURL || STRAPI_URL;
    this.apiToken = apiToken || STRAPI_API_TOKEN;
  }

  // Blog Posts
  getBlogPosts = getBlogPosts;
  getBlogPost = getBlogPost;
  getBlogPostBySlug = getBlogPostBySlug;
  getAllBlogSlugs = getAllBlogSlugs;

  // FAQs
  getFAQs = getFAQs;
  getFAQsByCategory = getFAQsByCategory;

  // Announcements
  getAnnouncements = getAnnouncements;
  getLatestAnnouncement = getLatestAnnouncement;
  getAnnouncementsForLocation = getAnnouncementsForLocation;

  // Changelog
  getChangelog = getChangelog;
  getLatestChangelog = getLatestChangelog;

  // Testimonials
  getTestimonials = getTestimonials;
  getFeaturedTestimonials = getFeaturedTestimonials;

  // Features
  getFeatures = getFeatures;
  getFeatureBySlug = getFeatureBySlug;
  getFeaturesByCategory = getFeaturesByCategory;

  // Legal Pages
  getLegalPages = getLegalPages;
  getLegalPageBySlug = getLegalPageBySlug;
  getAllLegalPageSlugs = getAllLegalPageSlugs;

  // Rich Text Rendering
  static renderBlocksToHTML = renderBlocksToHTML;
  static renderBlocksToText = renderBlocksToText;
}

// Default export
export default new StrapiClient();

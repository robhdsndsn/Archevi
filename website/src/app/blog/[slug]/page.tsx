import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, User, Share2 } from 'lucide-react';
import { getBlogPostBySlug, getAllBlogSlugs, renderBlocksToText } from '@/lib/strapi-client';
import { RichTextRenderer } from '@/components/blog';
import { BlogPostingJsonLd, BreadcrumbJsonLd } from '@/components/seo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static paths for all published blog posts
export async function generateStaticParams() {
  try {
    const slugs = await getAllBlogSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error('Failed to generate static params:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const excerpt = post.excerpt || renderBlocksToText(post.content).slice(0, 160);
  const imageUrl = post.featured_image?.url
    ? post.featured_image.url.startsWith('http')
      ? post.featured_image.url
      : STRAPI_URL + post.featured_image.url
    : undefined;

  return {
    title: post.title,
    description: excerpt,
    openGraph: {
      title: post.title,
      description: excerpt,
      type: 'article',
      publishedTime: post.published_date || undefined,
      authors: post.author ? [post.author] : undefined,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: excerpt,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const imageUrl = post.featured_image?.url
    ? post.featured_image.url.startsWith('http')
      ? post.featured_image.url
      : STRAPI_URL + post.featured_image.url
    : null;

  const formattedDate = post.published_date
    ? new Date(post.published_date).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <article className="py-8 md:py-12">
      {/* JSON-LD Structured Data */}
      <BlogPostingJsonLd post={post} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: post.title, url: `/blog/${slug}` },
        ]}
      />

      <div className="container mx-auto px-4">
        {/* Back Link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Header */}
        <header className="max-w-3xl mx-auto text-center mb-12">
          {post.category && (
            <Badge variant="secondary" className="mb-4">
              {post.category}
            </Badge>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-6 text-muted-foreground">
            {post.author && (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {post.author}
              </span>
            )}
            {formattedDate && (
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formattedDate}
              </span>
            )}
          </div>
        </header>

        {/* Featured Image */}
        {imageUrl && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
              <Image
                src={imageUrl}
                alt={post.featured_image?.alternativeText || post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-3xl mx-auto">
          <RichTextRenderer content={post.content} />

          <Separator className="my-12" />

          {/* Share & Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" asChild>
              <Link href="/blog">
                <ArrowLeft className="h-4 w-4 mr-2" />
                All Posts
              </Link>
            </Button>
            <Button variant="outline" size="icon" title="Share this post">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

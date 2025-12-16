import Image from 'next/image';
import Link from 'next/link';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { BlogPost } from '@/lib/types/strapi';
import { renderBlocksToText } from '@/lib/strapi-client';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
  className?: string;
}

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1338';

export function BlogCard({ post, featured = false, className }: BlogCardProps) {
  const excerpt = post.excerpt || renderBlocksToText(post.content).slice(0, 160) + '...';
  const imageUrl = post.featured_image?.url
    ? post.featured_image.url.startsWith('http')
      ? post.featured_image.url
      : `${STRAPI_URL}${post.featured_image.url}`
    : null;

  const formattedDate = post.published_date
    ? new Date(post.published_date).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <Card
      className={cn(
        'group overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300',
        featured && 'md:col-span-2 md:grid md:grid-cols-2',
        className
      )}
    >
      {/* Image */}
      <Link
        href={`/blog/${post.slug}`}
        className={cn(
          'block relative overflow-hidden bg-muted',
          featured ? 'aspect-[16/10] md:aspect-auto md:h-full' : 'aspect-[16/9]'
        )}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={post.featured_image?.alternativeText || post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes={featured ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 33vw, 100vw'}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-4xl font-bold text-primary/20">
              {post.title.charAt(0)}
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <CardContent className={cn('p-6', featured && 'flex flex-col justify-center')}>
        {/* Category Badge */}
        {post.category && (
          <Badge variant="secondary" className="mb-3 text-xs font-medium">
            {post.category}
          </Badge>
        )}

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h3
            className={cn(
              'font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2',
              featured ? 'text-2xl mb-3' : 'text-lg mb-2'
            )}
          >
            {post.title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p
          className={cn(
            'text-muted-foreground line-clamp-3',
            featured ? 'text-base mb-4' : 'text-sm mb-3'
          )}
        >
          {excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {post.author && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author}
            </span>
          )}
          {formattedDate && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </span>
          )}
        </div>

        {/* Read More Link (featured only) */}
        {featured && (
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-2 mt-4 text-primary font-medium hover:underline"
          >
            Read more
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

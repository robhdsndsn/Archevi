'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, User } from 'lucide-react';
import type { BlogPost, BlogCategory, StrapiPagination } from '@/lib/types/strapi';
import { renderBlocksToText } from '@/lib/strapi-client';

const categories: Array<{ value: BlogCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All Posts' },
  { value: 'News', label: 'News' },
  { value: 'Updates', label: 'Updates' },
  { value: 'Features', label: 'Features' },
  { value: 'Community', label: 'Community' },
];

interface BlogListProps {
  posts: BlogPost[];
  pagination?: StrapiPagination;
  currentPage: number;
  currentCategory?: BlogCategory;
}

export function BlogList({
  posts,
  pagination,
  currentPage,
  currentCategory,
}: BlogListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    params.delete('page'); // Reset to page 1
    router.push(`/blog?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`/blog?${params.toString()}`);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getExcerpt = (post: BlogPost) => {
    if (post.excerpt) return post.excerpt;
    const text = renderBlocksToText(post.content);
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  return (
    <div>
      {/* Category Filter */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={
              (currentCategory === cat.value) ||
              (!currentCategory && cat.value === 'all')
                ? 'default'
                : 'outline'
            }
            size="sm"
            onClick={() => handleCategoryChange(cat.value)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No blog posts found. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card
              key={post.documentId}
              className="group flex flex-col transition-shadow hover:shadow-lg"
            >
              {post.featured_image && (
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={post.featured_image.url}
                    alt={post.featured_image.alternativeText || post.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              )}
              <CardHeader className="flex-grow">
                <div className="mb-2 flex items-center gap-2">
                  {post.category && (
                    <Badge variant="secondary">{post.category}</Badge>
                  )}
                </div>
                <CardTitle className="line-clamp-2">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-primary"
                  >
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {getExcerpt(post)}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.published_date)}</span>
                </div>
                {post.author && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pageCount > 1 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {pagination.pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pagination.pageCount}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

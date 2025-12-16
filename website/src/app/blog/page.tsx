import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getBlogPosts } from '@/lib/strapi-client';
import { BlogCard } from '@/components/blog';
import { AnnouncementBanner } from '@/components/cms';
import { BreadcrumbJsonLd } from '@/components/seo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { BlogCategory } from '@/lib/types/strapi';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Insights, updates, and tips for managing your family documents with AI-powered search.',
  openGraph: {
    title: 'Blog | Archevi',
    description:
      'Insights, updates, and tips for managing your family documents with AI-powered search.',
  },
};

interface BlogPageProps {
  searchParams: Promise<{
    page?: string;
    category?: BlogCategory;
  }>;
}

const categories: { label: string; value: BlogCategory | null }[] = [
  { label: 'All', value: null },
  { label: 'News', value: 'News' },
  { label: 'Updates', value: 'Updates' },
  { label: 'Features', value: 'Features' },
  { label: 'Community', value: 'Community' },
];

function BlogSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-[16/9] rounded-lg" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  );
}

async function BlogList({
  page,
  category,
}: {
  page: number;
  category?: BlogCategory;
}) {
  const { data: posts, meta } = await getBlogPosts({
    page,
    pageSize: 9,
    category,
  });

  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
        <p className="text-muted-foreground">
          {category
            ? `No posts found in the "${category}" category.`
            : 'Check back soon for new content!'}
        </p>
      </div>
    );
  }

  const pagination = meta.pagination;
  const hasMore = pagination && pagination.page < pagination.pageCount;
  const hasPrev = pagination && pagination.page > 1;

  return (
    <>
      {/* Featured Post (first post on first page) */}
      {page === 1 && posts.length > 0 && (
        <div className="mb-12">
          <BlogCard post={posts[0]} featured />
        </div>
      )}

      {/* Post Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.slice(page === 1 ? 1 : 0).map((post) => (
          <BlogCard key={post.documentId} post={post} />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.pageCount > 1 && (
        <div className="flex justify-center gap-4 mt-12">
          {hasPrev && (
            <Button variant="outline" asChild>
              <a
                href={`/blog?page=${page - 1}${category ? `&category=${category}` : ''}`}
              >
                Previous
              </a>
            </Button>
          )}
          <span className="flex items-center text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pageCount}
          </span>
          {hasMore && (
            <Button variant="outline" asChild>
              <a
                href={`/blog?page=${page + 1}${category ? `&category=${category}` : ''}`}
              >
                Next
              </a>
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const category = params.category;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
        ]}
      />

      <AnnouncementBanner location="Blog" />

      {/* Header */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
            <p className="text-xl text-muted-foreground">
              Insights, updates, and tips for managing your family documents
              with AI-powered search.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-6 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <a
                key={cat.label}
                href={cat.value ? `/blog?category=${cat.value}` : '/blog'}
              >
                <Badge
                  variant={
                    (category === cat.value) || (!category && !cat.value)
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer hover:bg-primary/10 transition-colors px-4 py-1.5"
                >
                  {cat.label}
                </Badge>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Suspense fallback={<BlogSkeleton />}>
            <BlogList page={page} category={category} />
          </Suspense>
        </div>
      </section>
    </>
  );
}

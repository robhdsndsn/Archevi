import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export function BlogSkeleton() {
  return (
    <div>
      {/* Category Filter Skeleton */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-9 w-20 animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>

      {/* Posts Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="flex flex-col">
            <div className="aspect-video animate-pulse rounded-t-lg bg-muted" />
            <CardHeader className="flex-grow">
              <div className="mb-2">
                <div className="h-5 w-16 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-6 w-full animate-pulse rounded bg-muted" />
              <div className="mt-2 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              </div>
            </CardHeader>
            <CardFooter className="flex justify-between">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function BlogPostSkeleton() {
  return (
    <article className="mx-auto max-w-3xl py-8">
      {/* Breadcrumb */}
      <div className="mb-6 h-4 w-32 animate-pulse rounded bg-muted" />

      {/* Header */}
      <header className="mb-8">
        <div className="mb-4 h-5 w-20 animate-pulse rounded bg-muted" />
        <div className="mb-4 h-10 w-full animate-pulse rounded bg-muted" />
        <div className="flex gap-4">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      </header>

      {/* Featured Image */}
      <div className="mb-8 aspect-video animate-pulse rounded-lg bg-muted" />

      {/* Content */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-4 w-full animate-pulse rounded bg-muted"
            style={{ width: `${Math.random() * 30 + 70}%` }}
          />
        ))}
      </div>
    </article>
  );
}

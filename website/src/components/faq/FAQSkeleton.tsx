export function FAQSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      {/* Search Skeleton */}
      <div className="mb-8 h-10 w-full animate-pulse rounded-md bg-muted" />

      {/* Category Tabs Skeleton */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-9 w-28 animate-pulse rounded-full bg-muted"
          />
        ))}
      </div>

      {/* FAQ Items Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

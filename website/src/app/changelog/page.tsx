import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getChangelog } from '@/lib/strapi-client';
import { RichTextRenderer } from '@/components/blog';
import { AnnouncementBanner } from '@/components/cms';
import { ChangelogJsonLd, BreadcrumbJsonLd } from '@/components/seo';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Sparkles } from 'lucide-react';
import type { Changelog } from '@/lib/types/strapi';

export const metadata: Metadata = {
  title: 'Changelog',
  description:
    'Stay up to date with the latest features, improvements, and fixes in Archevi.',
  openGraph: {
    title: 'Changelog | Archevi',
    description:
      'Stay up to date with the latest features, improvements, and fixes in Archevi.',
  },
};

function ChangelogSkeleton() {
  return (
    <div className="space-y-12">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-l-2 border-muted pl-6 pb-8">
          <div className="flex items-center gap-4 mb-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function ChangelogEntry({ entry }: { entry: Changelog }) {
  return (
    <div className="relative border-l-2 border-primary/20 pl-6 pb-12 last:pb-0 group">
      {/* Timeline dot */}
      <div
        className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-background ${
          entry.is_major
            ? 'bg-primary'
            : 'bg-muted-foreground/30 group-hover:bg-primary/50'
        } transition-colors`}
      />

      {/* Version and date header */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Badge
          variant={entry.is_major ? 'default' : 'secondary'}
          className="text-sm font-mono"
        >
          {entry.version}
        </Badge>
        {entry.is_major && (
          <Badge variant="outline" className="text-xs gap-1">
            <Sparkles className="w-3 h-3" />
            Major Release
          </Badge>
        )}
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {formatDate(entry.release_date)}
        </span>
      </div>

      {/* Content */}
      <div className="bg-card border rounded-lg p-6">
        <RichTextRenderer content={entry.content} />
      </div>
    </div>
  );
}

async function ChangelogList() {
  const { data: entries } = await getChangelog({ limit: 50 });

  if (entries.length === 0) {
    return (
      <div className="text-center py-16 bg-muted/30 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">No releases yet</h3>
        <p className="text-muted-foreground">
          Check back soon for updates on new features and improvements!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry) => (
        <ChangelogEntry key={entry.documentId} entry={entry} />
      ))}
    </div>
  );
}

export default async function ChangelogPage() {
  // Fetch changelog entries for JSON-LD structured data
  const { data: entries } = await getChangelog({ limit: 50 });

  return (
    <>
      {/* JSON-LD Structured Data */}
      <ChangelogJsonLd entries={entries} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Changelog', url: '/changelog' },
        ]}
      />

      <AnnouncementBanner location="Changelog" />

      {/* Header */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Changelog</h1>
            <p className="text-xl text-muted-foreground">
              Stay up to date with the latest features, improvements, and bug
              fixes. We ship updates regularly to make Archevi better for you.
            </p>
          </div>
        </div>
      </section>

      {/* Changelog Timeline */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Suspense fallback={<ChangelogSkeleton />}>
              <ChangelogList />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Subscribe CTA */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Want to know when we ship new features? Follow our blog for
            announcements and product updates.
          </p>
          <a
            href="/blog"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Read Our Blog
          </a>
        </div>
      </section>
    </>
  );
}

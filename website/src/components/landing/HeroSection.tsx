import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              New
            </span>
            <span className="text-muted-foreground">
              Multi-model AI selection now available
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Your family&apos;s AI-powered
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {' '}
              knowledge vault
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Store, search, and understand your important documents with natural
            language. Ask questions like &quot;When does my car insurance
            expire?&quot; and get answers with source citations.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#demo">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Trust badges */}
          <p className="mt-6 text-sm text-muted-foreground">
            14-day free trial &bull; No credit card required &bull; PIPEDA
            compliant
          </p>
        </div>

        {/* Hero Image/Dashboard Preview */}
        <div className="mt-16 rounded-xl border bg-gradient-to-b from-muted/50 to-muted p-2 shadow-2xl">
          <div className="aspect-[16/9] overflow-hidden rounded-lg bg-background">
            {/* Dashboard Mockup */}
            <div className="flex h-full">
              {/* Sidebar mockup */}
              <div className="hidden w-48 border-r bg-muted/30 p-3 md:block">
                <div className="mb-4 h-6 w-24 rounded bg-primary/20" />
                <div className="space-y-2">
                  <div className="h-8 rounded bg-primary/10" />
                  <div className="h-8 rounded bg-muted" />
                  <div className="h-8 rounded bg-muted" />
                  <div className="h-8 rounded bg-muted" />
                </div>
              </div>
              {/* Main content mockup */}
              <div className="flex-1 p-4">
                {/* Search bar */}
                <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                  <div className="h-4 w-4 rounded-full bg-primary/40" />
                  <div className="h-4 flex-1 rounded bg-muted" />
                </div>
                {/* Chat/Results area */}
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-4 w-1/2 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-green-500/20" />
                    <div className="flex-1 space-y-2 rounded-lg border bg-muted/30 p-3">
                      <div className="h-4 w-full rounded bg-muted" />
                      <div className="h-4 w-5/6 rounded bg-muted" />
                      <div className="mt-2 flex gap-2">
                        <div className="h-6 w-20 rounded bg-primary/10 text-xs" />
                        <div className="h-6 w-16 rounded bg-primary/10 text-xs" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

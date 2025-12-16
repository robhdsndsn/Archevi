import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="bg-primary py-20 text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Ready to organize your family&apos;s documents?
          </h2>
          <p className="mb-8 text-lg opacity-90">
            Join thousands of families who have transformed their document chaos
            into a searchable knowledge base. Start your free trial today.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              asChild
            >
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="border border-white/50 !text-white hover:bg-white/10 hover:!text-white hover:border-white"
              asChild
            >
              <Link href="/contact">Talk to Sales</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm opacity-75">
            14-day free trial &bull; No credit card required &bull; Cancel
            anytime
          </p>
        </div>
      </div>
    </section>
  );
}

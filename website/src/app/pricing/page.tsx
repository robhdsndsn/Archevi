import type { Metadata } from 'next';
import { PricingSection } from '@/components/pricing/PricingSection';
import { FeatureComparison } from '@/components/pricing/FeatureComparison';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple, transparent pricing for Archevi. Start free and upgrade when you need more storage, family members, or AI queries.',
  openGraph: {
    title: 'Archevi Pricing',
    description: 'Simple, transparent pricing. Start free, upgrade when ready.',
  },
};

const pricingPlans = [
  {
    name: 'Free',
    description: 'Try Archevi risk-free',
    price: 0,
    currency: 'CAD',
    features: ['50 documents', '2 family members', 'AI search included'],
  },
  {
    name: 'Family',
    description: 'For most families',
    price: 9,
    currency: 'CAD',
    features: ['500 documents', '6 family members', 'Priority support'],
  },
  {
    name: 'Family Plus',
    description: 'For larger families',
    price: 19,
    currency: 'CAD',
    features: ['2,000 documents', '15 family members', 'Advanced features'],
  },
  {
    name: 'Family Office',
    description: 'For high-net-worth families and advisors',
    price: 49,
    currency: 'CAD',
    features: ['Unlimited documents', 'Unlimited members', 'Dedicated support'],
  },
];

export default function PricingPage() {
  return (
    <div className="py-16">
      {/* JSON-LD Structured Data */}
      <ProductJsonLd plans={pricingPlans} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Pricing', url: '/pricing' },
        ]}
      />
      {/* Header */}
      <div className="container mx-auto mb-16 px-4 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Start free, upgrade when you need more. All plans include a 14-day
          free trial with no credit card required.
        </p>
      </div>

      {/* Pricing Cards */}
      <PricingSection />

      {/* Feature Comparison */}
      <FeatureComparison />

      {/* FAQ Section */}
      <PricingFAQ />

      {/* Enterprise CTA */}
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center md:p-12">
          <h2 className="mb-4 text-2xl font-bold md:text-3xl">
            Need a custom solution?
          </h2>
          <p className="mb-6 text-muted-foreground">
            For larger organizations, family offices, or enterprises with
            specific compliance requirements, we offer custom plans with
            dedicated infrastructure, SLAs, and priority support.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
}

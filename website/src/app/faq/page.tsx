import type { Metadata } from 'next';
import { getFAQsByCategory, getFAQs } from '@/lib/strapi-client';
import { FAQList } from './FAQList';
import { AnnouncementBanner } from '@/components/cms';
import { FAQPageJsonLd, BreadcrumbJsonLd } from '@/components/seo';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about Archevi - your family document management solution.',
  openGraph: {
    title: 'FAQ | Archevi',
    description:
      'Frequently asked questions about Archevi - your family document management solution.',
  },
};

export default async function FAQPage() {
  const faqsByCategory = await getFAQsByCategory();
  // Get all FAQs for JSON-LD structured data
  const { data: allFaqs } = await getFAQs();

  return (
    <>
      {/* JSON-LD Structured Data */}
      <FAQPageJsonLd faqs={allFaqs} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'FAQ', url: '/faq' },
        ]}
      />

      <AnnouncementBanner location="FAQ" />

      {/* Header */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground">
              Find answers to common questions about Archevi
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <FAQList faqsByCategory={faqsByCategory} />
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            We are here to help. Reach out to our support team.
          </p>
          <a
            href="mailto:support@archevi.ca"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </section>
    </>
  );
}

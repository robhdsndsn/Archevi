import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  PricingPreview,
  CTASection,
} from '@/components/landing';
import { AnnouncementBanner } from '@/components/cms';
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
  SoftwareApplicationJsonLd,
} from '@/components/seo';

export default function Home() {
  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <SoftwareApplicationJsonLd />

      {/* Home-specific announcements (in addition to global "Everywhere" ones) */}
      <AnnouncementBanner location="Home" />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingPreview />
      <CTASection />
    </>
  );
}

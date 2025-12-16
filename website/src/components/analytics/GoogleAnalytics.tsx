'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google Analytics 4 integration component
 * Only loads in production when GA_MEASUREMENT_ID is set
 */
export function GoogleAnalytics() {
  // Don't render in development or if no measurement ID
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

/**
 * Track custom events in Google Analytics
 * Usage: trackEvent('signup', 'click', 'hero_cta')
 */
export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
    window.gtag?.('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

/**
 * Track page views (for SPA navigation)
 * Next.js handles this automatically, but useful for custom tracking
 */
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
    window.gtag?.('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

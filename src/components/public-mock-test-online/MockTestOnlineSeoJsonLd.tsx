import type { MockTestOnlineSeoConfig } from '@/lib/public-mock-test-online/seo/types';

type MockTestOnlineSeoJsonLdProps = {
  seo: MockTestOnlineSeoConfig;
};

/** JSON-LD FAQ + EducationEvent — chỉ trên trang register khi bật trong CRM Settings. */
export function MockTestOnlineSeoJsonLd({ seo }: MockTestOnlineSeoJsonLdProps) {
  const graphs: Record<string, unknown>[] = [];

  if (seo.schema.enableFaqPage && seo.faq.length > 0) {
    graphs.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: seo.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  if (seo.schema.enableEducationEvent) {
    graphs.push({
      '@context': 'https://schema.org',
      '@type': 'EducationEvent',
      name: seo.schema.eventName,
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      organizer: {
        '@type': 'Organization',
        name: seo.schema.organizerName,
      },
      location: {
        '@type': 'VirtualLocation',
        url: seo.landing.canonicalUrl,
      },
    });
  }

  if (graphs.length === 0) return null;

  const payload =
    graphs.length === 1
      ? graphs[0]
      : {
          '@context': 'https://schema.org',
          '@graph': graphs.map((g) => {
            const { '@context': _ctx, ...rest } = g;
            return rest;
          }),
        };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

import type { ProductGroup } from "@/lib/types";
import { SITE_URL } from "@/lib/site";
import { STORES } from "@/lib/stores";

/** Structured data for search engines (schema.org JSON-LD). */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // "<" is escaped so product titles can't close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** schema.org Product with one Offer per store (an AggregateOffer across stores). */
export function productSchema(p: ProductGroup, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title,
    brand: { "@type": "Brand", name: p.brand },
    image: p.images.length ? p.images.slice(0, 5) : p.image ? [p.image] : undefined,
    url: `${SITE_URL}${url}`,
    ...(p.rating && p.ratingCount
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.ratingCount, bestRating: 5 } }
      : {}),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: p.currency,
      lowPrice: p.bestPrice,
      highPrice: p.highestPrice,
      offerCount: p.offers.length,
      offers: p.offers.map((o) => ({
        "@type": "Offer",
        price: o.price,
        priceCurrency: o.currency,
        url: o.url,
        availability: "https://schema.org/InStock",
        seller: { "@type": "Organization", name: STORES[o.store]?.name ?? o.store },
      })),
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE_URL}${it.path}` })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

/** schema.org SportsEvent for a football match. */
export function sportsEventSchema(m: import("@/lib/football/types").Match, path: string) {
  const status =
    m.state === "post" ? "https://schema.org/EventCompleted" : m.state === "in" ? "https://schema.org/EventScheduled" : "https://schema.org/EventScheduled";
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `${m.home.name} vs ${m.away.name}`,
    sport: "Soccer",
    startDate: m.date,
    eventStatus: status,
    url: `${SITE_URL}${path}`,
    homeTeam: { "@type": "SportsTeam", name: m.home.name, ...(m.home.logo ? { logo: m.home.logo } : {}) },
    awayTeam: { "@type": "SportsTeam", name: m.away.name, ...(m.away.logo ? { logo: m.away.logo } : {}) },
    competitor: [
      { "@type": "SportsTeam", name: m.home.name },
      { "@type": "SportsTeam", name: m.away.name },
    ],
    ...(m.venue ? { location: { "@type": "Place", name: m.venue } } : {}),
    superEvent: { "@type": "SportsEvent", name: m.league.name },
  };
}

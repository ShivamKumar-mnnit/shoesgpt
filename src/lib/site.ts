import { BRANDS, REGIONS, SPORTS, REGION_IDS, liveStoresIn } from "./stores";
import type { Region } from "./types";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://shoesgpt.in").replace(/\/$/, "");
export const SITE_NAME = "shoesGPT";

/** Year the site launched, shown in the copyright line. */
export const COPYRIGHT_SINCE = 2026;

/** Contact details shown in the footer and given to search engines. */
export const CONTACT = {
  email: "mickeyth59@gmail.com",
  phone: "+91 7017903175",
  /**
   * Social profiles. Add links here when they're ready, e.g.
   * { name: "Instagram", url: "https://instagram.com/shoesgpt" }
   */
  socials: [] as { name: string; url: string }[],
};

/** hreflang code per country page. */
// The site is written in English, so pages are English for each country's shoppers.
export const HREFLANG: Record<Region, string> = {
  in: "en-IN",
  us: "en-US",
  uk: "en-GB",
  de: "en-DE",
  fr: "en-FR",
  it: "en-IT",
  es: "en-ES",
  nl: "en-NL",
  ca: "en-CA",
  au: "en-AU",
  jp: "en-JP",
  ae: "en-AE",
  sg: "en-SG",
  mx: "en-MX",
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export type LandingKind = "brands" | "sports";

export interface Landing {
  region: Region;
  kind: LandingKind;
  slug: string;
  /** Display name, e.g. "Nike" or "Running". */
  name: string;
  /** Query sent to the stores. */
  q: string;
}

export function findLanding(region: string, kind: string, slug: string): Landing | null {
  if (!(region in REGIONS)) return null;
  const r = region as Region;
  if (kind === "brands") {
    const name = BRANDS[r].find((b) => slugify(b) === slug);
    return name ? { region: r, kind, slug, name, q: `${name} ${REGIONS[r].shoes}` } : null;
  }
  if (kind === "sports") {
    const s = SPORTS[r].find((x) => x.id === slug);
    return s ? { region: r, kind, slug, name: s.label, q: s.q } : null;
  }
  return null;
}

export const landingPath = (l: Pick<Landing, "region" | "kind" | "slug">) => `/${l.region}/${l.kind}/${l.slug}`;

/** Every brand and sport page, in every country. Used for static generation and the sitemap. */
export function allLandings(): Landing[] {
  return REGION_IDS.flatMap((r) => [
    ...BRANDS[r].map((b) => ({ region: r, kind: "brands" as const, slug: slugify(b), name: b, q: `${b} ${REGIONS[r].shoes}` })),
    ...SPORTS[r].map((s) => ({ region: r, kind: "sports" as const, slug: s.id, name: s.label, q: s.q })),
  ]);
}

/** Same page in the other countries that have it (for hreflang links). */
export function alternatesFor(kind: LandingKind, slug: string): Partial<Record<Region, string>> {
  const out: Partial<Record<Region, string>> = {};
  for (const r of REGION_IDS) if (findLanding(r, kind, slug)) out[r] = landingPath({ region: r, kind, slug });
  return out;
}

export function landingTitle(l: Landing): string {
  const country = REGIONS[l.region].name;
  return l.kind === "brands"
    ? `${l.name} Shoes Price Comparison in ${country}: Cheapest Prices Today`
    : `Best ${l.name} Shoes Prices in ${country}: Compare Stores`;
}

/** Live stores relevant to a page: marketplaces, plus a brand's own store only on that brand's page. */
export function liveStoresFor(l: Landing) {
  return liveStoresIn(l.region).filter((s) => !s.brand || (l.kind === "brands" && slugify(s.brand) === l.slug));
}

export function landingDescription(l: Landing): string {
  const stores = liveStoresFor(l).map((s) => s.name);
  const list = `${stores.slice(0, -1).join(", ")} and ${stores[stores.length - 1]}`;
  return l.kind === "brands"
    ? `Compare ${l.name} shoe prices across ${list}. See the same pair side by side, sorted cheapest first, and buy where it costs least in ${REGIONS[l.region].name}.`
    : `Find the cheapest ${l.name.toLowerCase()} shoes in ${REGIONS[l.region].name}. Live prices from ${list}, sorted from lowest to highest for every pair.`;
}

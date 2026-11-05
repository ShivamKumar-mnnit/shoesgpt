import type { MetadataRoute } from "next";
import { HREFLANG, SITE_URL, allLandings, alternatesFor, landingPath } from "@/lib/site";
import type { Region } from "@/lib/types";
import { LEAGUES } from "@/lib/football/leagues";
import { STAR_BOOTS } from "@/lib/football/boots";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shoes`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/football`, changeFrequency: "always", priority: 1 },
    { url: `${SITE_URL}/football/boots`, changeFrequency: "weekly", priority: 0.8 },
    ...LEAGUES.map((l) => ({ url: `${SITE_URL}/football/${l.slug}`, changeFrequency: "hourly" as const, priority: 0.9 })),
    ...STAR_BOOTS.map((p) => ({ url: `${SITE_URL}/football/boots/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
  for (const l of allLandings()) {
    const alts = alternatesFor(l.kind, l.slug);
    pages.push({
      url: `${SITE_URL}${landingPath(l)}`,
      changeFrequency: "daily",
      priority: l.kind === "brands" ? 0.9 : 0.8,
      alternates: {
        languages: Object.fromEntries(Object.entries(alts).map(([r, p]) => [HREFLANG[r as Region], `${SITE_URL}${p}`])),
      },
    });
  }
  return pages;
}

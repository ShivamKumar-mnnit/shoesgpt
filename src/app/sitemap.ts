import type { MetadataRoute } from "next";
import { HREFLANG, SITE_URL, allLandings, alternatesFor, landingPath } from "@/lib/site";
import type { Region } from "@/lib/types";
import { LEAGUES } from "@/lib/football/leagues";
import { STAR_BOOTS } from "@/lib/football/boots";
import { getLiveMatches, getTeams } from "@/lib/football/data";
import { teamHref } from "@/lib/football/espn";

/** Leagues whose club pages are listed in the sitemap. */
const TEAM_LEAGUES = ["premier-league", "laliga", "bundesliga", "serie-a", "ligue-1", "indian-super-league", "mls"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  // Today's matches (live, upcoming and just finished) and club pages.
  const [matches, ...teamLists] = await Promise.all([
    getLiveMatches().catch(() => []),
    ...TEAM_LEAGUES.map((slug) => getTeams(LEAGUES.find((l) => l.slug === slug)!.id)),
  ]);
  for (const mt of matches) {
    pages.push({ url: `${SITE_URL}/football/match/${mt.league.slug}/${mt.id}`, lastModified: mt.date, changeFrequency: "always", priority: mt.state === "in" ? 1 : 0.7 });
  }
  teamLists.forEach((teams, i) => {
    for (const t of teams) pages.push({ url: `${SITE_URL}${teamHref(TEAM_LEAGUES[i], t)}`, changeFrequency: "daily", priority: 0.8 });
  });
  return pages;
}

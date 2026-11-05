import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MatchList } from "@/components/football/match-list";
import { TeamLogo } from "@/components/football/common";
import { Faq, LeagueNav, StarBootsGrid } from "@/components/football/sections";
import { JsonLd, breadcrumbSchema, faqSchema, sportsEventSchema } from "@/components/seo";
import { getLeagueMatches, getStandings } from "@/lib/football/data";
import { LEAGUES, leagueBySlug, type League } from "@/lib/football/leagues";

type Params = { league: string };

export function generateStaticParams(): Params[] {
  return LEAGUES.map((l) => ({ league: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const l = leagueBySlug((await params).league);
  if (!l) return {};
  const title = `${l.name} Live Scores, Fixtures, Results & Table`;
  const description = `${l.name} live scores today, fixtures, results and the latest table. Lineups and stats for every match, plus the boots the players wear and where to buy them cheapest.`;
  return {
    title,
    description,
    alternates: { canonical: `/football/${l.slug}` },
    openGraph: { title, description, url: `/football/${l.slug}`, images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
  };
}

export default async function LeaguePage({ params }: { params: Promise<Params> }) {
  const l = leagueBySlug((await params).league);
  if (!l) notFound();
  const faqs = [
    { q: `Where can I watch ${l.name} live scores?`, a: `This page shows every ${l.name} score as it happens, updated every 30 seconds, plus fixtures and results for the current matchday.` },
    { q: `Who is top of the ${l.name} table?`, a: `See the live table below. It updates after every match.` },
  ];
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-10">
      <JsonLd
        data={[
          faqSchema(faqs),
          breadcrumbSchema([
            { name: "Football", path: "/football" },
            { name: l.name, path: `/football/${l.slug}` },
          ]),
        ]}
      />
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">⚽ {l.country}</p>
      <h1 className="text-5xl font-black leading-[0.92] tracking-tight md:text-7xl">
        {l.name}
        <span className="block text-2xl font-bold tracking-tight text-muted md:text-3xl">Live scores, fixtures, results & table</span>
      </h1>
      <div className="mt-8">
        <LeagueNav active={l.slug} />
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-4 text-2xl font-black tracking-tight">Matches</h2>
          <Suspense fallback={<div className="skeleton h-64 rounded-3xl" />}>
            <Matches league={l} />
          </Suspense>
        </div>
        <div>
          <h2 className="mb-4 text-2xl font-black tracking-tight">Table</h2>
          <Suspense fallback={<div className="skeleton h-96 rounded-3xl" />}>
            <Table league={l} />
          </Suspense>
        </div>
      </div>
      <StarBootsGrid title="Boots worn by the stars" />
      <Faq faqs={faqs} />
    </div>
  );
}

async function Matches({ league }: { league: League }) {
  const matches = await getLeagueMatches(league.id);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${league.name} matches`,
          itemListElement: matches.map((m, i) => ({ "@type": "ListItem", position: i + 1, item: sportsEventSchema(m, `/football/match/${league.slug}/${m.id}`) })),
        }}
      />
      <MatchList initial={matches} leagueId={league.id} emptyText={`No ${league.name} matches this matchday.`} />
    </>
  );
}

async function Table({ league }: { league: League }) {
  const rows = await getStandings(league.id);
  if (!rows.length) return <p className="rounded-3xl border border-dashed border-line p-8 text-center text-sm text-muted">No table for this competition right now.</p>;
  return (
    <div className="overflow-hidden rounded-[24px] bg-white">
      <table className="w-full text-sm">
        <thead className="bg-paper-2 text-xs uppercase tracking-wider text-muted">
          <tr>
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-2 py-2 text-left">Team</th>
            <th className="px-2 py-2">P</th>
            <th className="hidden px-2 py-2 sm:table-cell">W</th>
            <th className="hidden px-2 py-2 sm:table-cell">D</th>
            <th className="hidden px-2 py-2 sm:table-cell">L</th>
            <th className="px-2 py-2">GD</th>
            <th className="px-3 py-2">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team} className="border-t border-line/60">
              <td className="px-3 py-2 font-mono text-xs text-muted">{r.rank}</td>
              <td className="px-2 py-2">
                <span className="flex items-center gap-2 font-semibold">
                  <TeamLogo src={r.logo} alt={r.team} className="size-5 text-[8px]" />
                  <span className="truncate">{r.team}</span>
                </span>
              </td>
              <td className="px-2 py-2 text-center">{r.played}</td>
              <td className="hidden px-2 py-2 text-center sm:table-cell">{r.won}</td>
              <td className="hidden px-2 py-2 text-center sm:table-cell">{r.drawn}</td>
              <td className="hidden px-2 py-2 text-center sm:table-cell">{r.lost}</td>
              <td className="px-2 py-2 text-center">{r.gd}</td>
              <td className="px-3 py-2 text-center font-black">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

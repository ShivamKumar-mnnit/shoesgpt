import type { Metadata } from "next";
import { Suspense } from "react";
import { MatchList } from "@/components/football/match-list";
import { Faq, LeagueNav, StarBootsGrid } from "@/components/football/sections";
import { JsonLd, faqSchema, sportsEventSchema } from "@/components/seo";
import { getLiveMatches } from "@/lib/football/data";
import { LEAGUES } from "@/lib/football/leagues";

export const metadata: Metadata = {
  title: "Live Football Scores Today: Results, Lineups, Stats & Players' Boots",
  description:
    "Live football scores today from the Champions League, Premier League, LaLiga, Serie A, Bundesliga, ISL, MLS and more. Lineups, stats, commentary, and the boots the stars wear, with the cheapest place to buy them.",
  alternates: { canonical: "/football" },
  openGraph: { title: "Live Football Scores Today | shoesGPT", url: "/football", images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
};

const FAQS = [
  {
    q: "Where can I see live football scores today?",
    a: `This page shows live scores and today's fixtures from ${LEAGUES.length} competitions including the Champions League, Premier League, LaLiga, Serie A, Bundesliga, Ligue 1, Indian Super League and MLS. Scores update every 30 seconds.`,
  },
  {
    q: "Can I see lineups and match stats?",
    a: "Yes. Open any match for the lineups, formations, possession, shots, cards, substitutions and live commentary.",
  },
  {
    q: "How do I find the boots a player is wearing?",
    a: "Open a match and go to the Boots tab. For star players we show the boots they're known for, today's price at each store in your country, and where it's cheapest.",
  },
];

export default function FootballPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-10">
      <JsonLd data={faqSchema(FAQS)} />
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">⚽ Football</p>
      <h1 className="text-5xl font-black leading-[0.92] tracking-tight md:text-7xl">
        Live football scores
        <span className="block text-2xl font-bold tracking-tight text-muted md:text-3xl">Today’s results, lineups, stats and the stars’ boots</span>
      </h1>
      <div className="mt-8">
        <LeagueNav />
      </div>
      <div className="mt-10">
        <Suspense fallback={<ListFallback />}>
          <Matches />
        </Suspense>
      </div>
      <StarBootsGrid />
      <Faq faqs={FAQS} />
    </div>
  );
}

async function Matches() {
  const matches = await getLiveMatches();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Live football scores today",
          itemListElement: matches.slice(0, 30).map((m, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: sportsEventSchema(m, `/football/match/${m.league.slug}/${m.id}`),
          })),
        }}
      />
      <MatchList initial={matches} emptyText="No matches in the last day or the next day and a half. Check a competition below for upcoming fixtures." />
    </>
  );
}

function ListFallback() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton h-14 rounded-2xl" />
      ))}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MatchLive } from "@/components/football/match-live";
import { LeagueNav } from "@/components/football/sections";
import { JsonLd, breadcrumbSchema, sportsEventSchema } from "@/components/seo";
import { getMatch } from "@/lib/football/data";
import { liveAndToday } from "@/lib/football/espn";
import { leagueBySlug } from "@/lib/football/leagues";
import { bootsLabel, starBySlug } from "@/lib/football/boots";
import type { MatchDetail } from "@/lib/football/types";

type Params = { league: string; id: string };

/** Pre-build today's matches; any other match renders on its first visit. */
export async function generateStaticParams(): Promise<Params[]> {
  try {
    const ms = await liveAndToday();
    if (ms.length) return ms.slice(0, 20).map((m) => ({ league: m.league.slug, id: m.id }));
  } catch {}
  return [{ league: "premier-league", id: "0" }];
}

async function load(params: Promise<Params>) {
  const { league, id } = await params;
  const l = leagueBySlug(league);
  if (!l) return null;
  return getMatch(l.id, id).catch(() => null);
}

const scoreText = (m: MatchDetail) => (m.state === "pre" ? "vs" : `${m.home.score}-${m.away.score}`);

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const m = await load(params);
  if (!m) return { title: "Match not found", robots: { index: false } };
  const path = `/football/match/${m.league.slug}/${m.id}`;
  const vs = `${m.home.name} vs ${m.away.name}`;
  const title =
    m.state === "pre"
      ? `${vs}: Lineups, Preview & Kick-off Time (${m.league.name})`
      : m.state === "in"
        ? `${vs} Live Score ${scoreText(m)}: Lineups & Stats`
        : `${m.home.name} ${scoreText(m)} ${m.away.name}: Result, Stats & Lineups`;
  const stars = m.stars.map((s) => starBySlug(s.slug)?.name).filter(Boolean);
  const description = `${vs} in the ${m.league.name}: live score, goals, lineups, stats and commentary.${
    stars.length ? ` See the boots ${stars.slice(0, 3).join(", ")} wear and where to buy them cheapest.` : ""
  }`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function MatchPage({ params }: { params: Promise<Params> }) {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-28 md:px-10">
      <Suspense fallback={<div className="skeleton h-[480px] rounded-[36px]" />}>
        <MatchBody params={params} />
      </Suspense>
      <div className="mt-16">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.15em] text-muted">More competitions</h2>
        <LeagueNav />
      </div>
    </div>
  );
}

async function MatchBody({ params }: { params: Promise<Params> }) {
  const m = await load(params);
  if (!m) notFound();
  const path = `/football/match/${m.league.slug}/${m.id}`;
  const stars = m.stars.map((s) => ({ ...s, star: starBySlug(s.slug)! })).filter((s) => s.star);
  return (
    <>
      <JsonLd
        data={[
          sportsEventSchema(m, path),
          breadcrumbSchema([
            { name: "Football", path: "/football" },
            { name: m.league.name, path: `/football/${m.league.slug}` },
            { name: `${m.home.name} vs ${m.away.name}`, path },
          ]),
        ]}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/football" className="hover:text-ink">Football</Link> /{" "}
        <Link href={`/football/${m.league.slug}`} className="hover:text-ink">{m.league.name}</Link> /{" "}
        <span className="text-ink">{m.home.name} vs {m.away.name}</span>
      </nav>
      <h1 className="mb-8 text-3xl font-black tracking-tight md:text-5xl">
        {m.home.name} vs {m.away.name}
        <span className="block text-lg font-bold text-muted md:text-xl">
          {m.state === "in" ? "Live score" : m.state === "post" ? "Result" : "Preview"}, lineups, stats & players’ boots
        </span>
      </h1>
      <div className="rounded-[36px] bg-paper-2/60 p-5 md:p-8">
        <MatchLive initial={m} />
      </div>
      {stars.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-black tracking-tight">Boots on the pitch</h2>
          <p className="mt-2 text-ink-2">
            {stars.map((s, i) => (
              <span key={s.slug}>
                {i > 0 && (i === stars.length - 1 ? " and " : ", ")}
                <Link href={`/football/boots/${s.slug}`} className="font-semibold underline-offset-4 hover:underline">
                  {s.star.name}
                </Link>{" "}
                ({bootsLabel(s.star)})
              </span>
            ))}{" "}
            {stars.length === 1 ? "is" : "are"} in this match. Open the Boots tab above for today’s prices, cheapest store first.
          </p>
        </section>
      )}
    </>
  );
}

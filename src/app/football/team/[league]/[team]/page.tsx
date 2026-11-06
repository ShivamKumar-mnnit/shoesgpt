import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { KickOff, MatchStatus, TeamLogo } from "@/components/football/common";
import { Faq, LeagueNav } from "@/components/football/sections";
import { JsonLd, breadcrumbSchema, faqSchema, sportsEventSchema } from "@/components/seo";
import { getTeam, getTeams } from "@/lib/football/data";
import { teamIdFromSlug } from "@/lib/football/espn";
import { leagueBySlug } from "@/lib/football/leagues";
import { STAR_BOOTS, bootsLabel } from "@/lib/football/boots";
import { SITE_URL } from "@/lib/site";
import type { Match } from "@/lib/football/types";

type Params = { league: string; team: string };

/** Clubs in the biggest leagues are built ahead; any other team renders on its first visit. */
export async function generateStaticParams(): Promise<Params[]> {
  const out: Params[] = [];
  for (const slug of ["premier-league", "laliga"]) {
    const l = leagueBySlug(slug)!;
    for (const t of await getTeams(l.id)) out.push({ league: slug, team: t.slug });
  }
  return out.length ? out : [{ league: "premier-league", team: "arsenal-359" }];
}

async function load(params: Promise<Params>) {
  const { league, team } = await params;
  const l = leagueBySlug(league);
  const id = teamIdFromSlug(team);
  if (!l || !id) return null;
  const data = await getTeam(l.id, id).catch(() => null);
  return data ? { ...data, league: l } : null;
}

/** Stars from this club whose boots we know. */
function clubStars(team: string) {
  const t = team.toLowerCase();
  return STAR_BOOTS.filter((p) =>
    p.club
      .toLowerCase()
      .split("/")
      .map((s) => s.trim())
      .some((c) => c && (t.includes(c) || c.includes(t))),
  );
}

const opponent = (m: Match, teamId: string) => (m.home.id === teamId ? m.away.name : m.home.name);

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const d = await load(params);
  if (!d) return { title: "Team not found", robots: { index: false } };
  const path = `/football/team/${d.league.slug}/${d.team.slug}`;
  const next = d.live[0] ?? d.fixtures[0];
  const title = `${d.team.name} Live Score Today, Fixtures & Results`;
  const description = `${d.team.name} live score, today's match, upcoming fixtures and latest results${
    next ? `. Next: vs ${opponent(next, d.team.id)}` : ""
  }. Lineups, stats and the boots ${d.team.name} players wear.`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, images: d.team.logo ? [{ url: d.team.logo }] : [{ url: "/opengraph-image" }] },
  };
}

export default function TeamPage({ params }: { params: Promise<Params> }) {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-28 md:px-10">
      <Suspense fallback={<div className="skeleton h-[600px] rounded-[36px]" />}>
        <TeamBody params={params} />
      </Suspense>
      <div className="mt-16">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.15em] text-muted">Competitions</h2>
        <LeagueNav />
      </div>
    </div>
  );
}

async function TeamBody({ params }: { params: Promise<Params> }) {
  const d = await load(params);
  if (!d) notFound();
  const path = `/football/team/${d.league.slug}/${d.team.slug}`;
  const stars = clubStars(d.team.name);
  const next = d.fixtures[0];
  const last = d.results[0];
  const faqs = [
    ...(next
      ? [
          {
            q: `When is ${d.team.name}'s next match?`,
            a: `${d.team.name} play ${opponent(next, d.team.id)}${next.league.name ? ` in the ${next.league.name}` : ""} on ${new Date(next.date)
              .toUTCString()
              .slice(0, 22)} UTC.`,
          },
        ]
      : []),
    ...(last
      ? [
          {
            q: `What was ${d.team.name}'s last result?`,
            a: `${last.home.name} ${last.home.score}-${last.away.score} ${last.away.name}${last.league.name ? ` (${last.league.name})` : ""}.`,
          },
        ]
      : []),
    ...(stars.length
      ? [{ q: `What boots do ${d.team.name} players wear?`, a: `${stars.map((s) => `${s.name}: ${bootsLabel(s)}`).join("; ")}.` }]
      : []),
  ];

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            name: d.team.name,
            sport: "Soccer",
            url: `${SITE_URL}${path}`,
            ...(d.team.logo ? { logo: d.team.logo } : {}),
            ...(stars.length ? { athlete: stars.map((s) => ({ "@type": "Person", name: s.name })) } : {}),
          },
          ...[...d.live, ...d.fixtures.slice(0, 5)]
            .filter((m) => m.league.slug)
            .map((m) => sportsEventSchema(m, `/football/match/${m.league.slug}/${m.id}`)),
          breadcrumbSchema([
            { name: "Football", path: "/football" },
            { name: d.league.name, path: `/football/${d.league.slug}` },
            { name: d.team.name, path },
          ]),
          ...(faqs.length ? [faqSchema(faqs)] : []),
        ]}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/football" className="hover:text-ink">
          Football
        </Link>{" "}
        /{" "}
        <Link href={`/football/${d.league.slug}`} className="hover:text-ink">
          {d.league.name}
        </Link>{" "}
        / <span className="text-ink">{d.team.name}</span>
      </nav>
      <div className="flex items-center gap-5">
        <TeamLogo src={d.team.logo} alt={d.team.name} className="size-20 text-2xl md:size-24" />
        <h1 className="text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
          {d.team.name}
          <span className="block text-xl font-bold tracking-tight text-muted md:text-2xl">Live score, fixtures & results</span>
        </h1>
      </div>

      {d.live.length > 0 && <Block title="Live now" matches={d.live} highlight />}
      <Block title="Upcoming fixtures" matches={d.fixtures} empty="No upcoming fixtures announced yet." />
      <Block title="Latest results" matches={d.results} empty="No results yet this season." />

      {stars.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-black tracking-tight">Boots {d.team.name} stars wear</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {stars.map((s) => (
              <li key={s.slug}>
                <Link href={`/football/boots/${s.slug}`} className="flex items-center justify-between gap-3 rounded-[20px] bg-white p-4 transition hover:shadow-lg">
                  <span className="font-bold">{s.name}</span>
                  <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold">{bootsLabel(s)} · prices →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {faqs.length > 0 && <Faq faqs={faqs} />}
    </>
  );
}

function Block({ title, matches, empty, highlight }: { title: string; matches: Match[]; empty?: string; highlight?: boolean }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-2xl font-black tracking-tight">{title}</h2>
      {matches.length ? (
        <ul className="overflow-hidden rounded-[24px] bg-white">
          {matches.map((m) => {
            const row = (
              <div className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 ${highlight ? "bg-red-50" : ""}`}>
                <span className="flex min-w-0 items-center justify-end gap-2 text-right font-semibold">
                  <span className="truncate">{m.home.name}</span>
                  <TeamLogo src={m.home.logo} alt={m.home.name} className="size-6 text-[9px]" />
                </span>
                <span className="min-w-[60px] rounded-lg bg-paper px-2 py-1 text-center font-black tabular-nums">
                  {m.state === "pre" ? "vs" : `${m.home.score} - ${m.away.score}`}
                </span>
                <span className="flex min-w-0 items-center gap-2 font-semibold">
                  <TeamLogo src={m.away.logo} alt={m.away.name} className="size-6 text-[9px]" />
                  <span className="truncate">{m.away.name}</span>
                </span>
                <span className="col-span-3 text-center text-xs text-muted">
                  {m.league.name} · {m.state === "pre" ? <KickOff iso={m.date} withDay /> : <MatchStatus m={m} />}
                </span>
              </div>
            );
            return (
              <li key={m.id} className="border-b border-line/60 last:border-0">
                {m.league.slug ? (
                  <Link href={`/football/match/${m.league.slug}/${m.id}`} className="block transition hover:bg-paper">
                    {row}
                  </Link>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-3xl border border-dashed border-line p-6 text-center text-sm text-muted">{empty}</p>
      )}
    </section>
  );
}

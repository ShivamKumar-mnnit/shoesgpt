import { LEAGUES, leagueById } from "./leagues";
import { starByName } from "./boots";
import type { LineupPlayer, Match, MatchDetail, MatchEvent, MatchState, TeamSide } from "./types";

/**
 * Football data from ESPN's public JSON (no key needed).
 * It's unofficial, so treat it as a starting point: for a big launch, switch to a
 * licensed feed (API-Football, Sportmonks, Opta) behind these same functions.
 */
const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";

/* Small in-memory cache, so thousands of visitors don't each hit the provider. */
const cache = new Map<string, { at: number; ttl: number; data: Promise<unknown> }>();

function cachedJson<T>(url: string, ttlMs: number): Promise<T> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < hit.ttl) return hit.data as Promise<T>;
  const data = fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) }).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<T>;
  });
  cache.set(url, { at: Date.now(), ttl: ttlMs, data });
  data.catch(() => cache.delete(url));
  if (cache.size > 400) cache.delete(cache.keys().next().value!);
  return data;
}

/* ---------------- raw shapes (only the fields we use) ---------------- */

interface RawCompetitor {
  homeAway: "home" | "away";
  score?: string;
  form?: string;
  team: { id: string; displayName: string; shortDisplayName?: string; abbreviation?: string; logo?: string; logos?: { href: string }[]; color?: string };
}
interface RawEvent {
  id: string;
  date: string;
  status: { displayClock?: string; type: { state: MatchState; shortDetail?: string; detail?: string } };
  competitions: { competitors: RawCompetitor[]; venue?: { fullName?: string } }[];
}

function side(c: RawCompetitor | undefined, state: MatchState): TeamSide {
  const t = c?.team;
  return {
    id: t?.id ?? "",
    name: t?.displayName ?? "TBD",
    short: t?.shortDisplayName ?? t?.displayName ?? "TBD",
    abbr: t?.abbreviation ?? t?.displayName?.slice(0, 3).toUpperCase() ?? "TBD",
    logo: t?.logo ?? t?.logos?.[0]?.href ?? null,
    color: t?.color ? `#${t.color}` : null,
    score: state === "pre" || c?.score == null ? null : Number(c.score),
    form: c?.form,
  };
}

function toMatch(e: RawEvent, leagueId: string): Match {
  const league = leagueById(leagueId)!;
  const comp = e.competitions[0];
  const state = e.status.type.state;
  return {
    id: e.id,
    league: { id: league.id, slug: league.slug, name: league.name },
    date: e.date,
    state,
    status: state === "pre" ? "" : (e.status.type.shortDetail ?? e.status.displayClock ?? ""),
    home: side(comp.competitors.find((c) => c.homeAway === "home"), state),
    away: side(comp.competitors.find((c) => c.homeAway === "away"), state),
    venue: comp.venue?.fullName,
  };
}

/* ---------------- scoreboards ---------------- */

export async function leagueMatches(leagueId: string): Promise<Match[]> {
  const j = await cachedJson<{ events?: RawEvent[] }>(`${BASE}/${leagueId}/scoreboard`, 30_000);
  return (j.events ?? []).map((e) => toMatch(e, leagueId));
}

/** Live now first, then upcoming (soonest first), then just finished. Covers about the last day and next day and a half. */
export async function liveAndToday(): Promise<Match[]> {
  const all = (await Promise.all(LEAGUES.map((l) => leagueMatches(l.id).catch(() => [])))).flat();
  const now = Date.now();
  const recent = all.filter((m) => {
    const t = new Date(m.date).getTime();
    return m.state === "in" || (t > now - 30 * 3600_000 && t < now + 36 * 3600_000);
  });
  const rank = { in: 0, pre: 1, post: 2 } as const;
  return recent.sort((a, b) => {
    if (a.state !== b.state) return rank[a.state] - rank[b.state];
    const d = new Date(a.date).getTime() - new Date(b.date).getTime();
    return a.state === "post" ? -d : d;
  });
}

/* ---------------- one match ---------------- */

interface RawSummary {
  header?: { competitions?: { competitors: RawCompetitor[]; status?: RawEvent["status"]; date?: string }[] };
  gameInfo?: { venue?: { fullName?: string } };
  boxscore?: { teams?: { team: { id: string }; statistics?: { label: string; displayValue: string }[] }[] };
  rosters?: {
    homeAway: "home" | "away";
    formation?: string;
    roster?: {
      starter?: boolean;
      subbedIn?: boolean;
      subbedOut?: boolean;
      jersey?: string;
      athlete: { displayName: string };
      position?: { abbreviation?: string; displayName?: string };
    }[];
  }[];
  keyEvents?: {
    type: { type: string; text: string };
    text?: string;
    shortText?: string;
    clock?: { displayValue?: string };
    team?: { id: string };
  }[];
  commentary?: { time?: { displayValue?: string }; text: string }[];
}

const KIND: Record<string, MatchEvent["kind"]> = {
  goal: "goal",
  "penalty---scored": "goal",
  "own-goal": "goal",
  "yellow-card": "yellow",
  "red-card": "red",
  substitution: "sub",
  kickoff: "period",
  halftime: "period",
  "start-2nd-half": "period",
  "end-regular-time": "period",
};

/** Stats shown in the match panel, in this order. */
const STAT_ORDER = ["Possession", "SHOTS", "ON GOAL", "Corner Kicks", "Fouls", "Offsides", "Saves", "Yellow Cards", "Red Cards"];

export async function matchDetail(leagueId: string, id: string): Promise<MatchDetail | null> {
  if (!leagueById(leagueId) || !/^\d+$/.test(id)) return null;
  const s = await cachedJson<RawSummary>(`${BASE}/${leagueId}/summary?event=${id}`, 20_000);
  const comp = s.header?.competitions?.[0];
  if (!comp) return null;
  const base = toMatch(
    { id, date: comp.date ?? "", status: comp.status ?? { type: { state: "pre" } }, competitions: [{ competitors: comp.competitors, venue: s.gameInfo?.venue }] },
    leagueId,
  );
  const sideOf = (teamId?: string) => (teamId === base.home.id ? "home" : teamId === base.away.id ? "away" : null);

  const statsBy = (teamId: string) => s.boxscore?.teams?.find((t) => t.team.id === teamId)?.statistics ?? [];
  const hs = statsBy(base.home.id);
  const as = statsBy(base.away.id);
  const stats = STAT_ORDER.flatMap((label) => {
    const h = hs.find((x) => x.label.toLowerCase() === label.toLowerCase());
    const a = as.find((x) => x.label.toLowerCase() === label.toLowerCase());
    if (!h || !a) return [];
    const nice = label === "SHOTS" ? "Shots" : label === "ON GOAL" ? "Shots on target" : label;
    return [{ label: nice, home: h.displayValue, away: a.displayValue }];
  });

  const lineup = (ha: "home" | "away") => {
    const r = s.rosters?.find((x) => x.homeAway === ha);
    const players: LineupPlayer[] = (r?.roster ?? []).map((p) => ({
      name: p.athlete.displayName,
      jersey: p.jersey ?? "",
      position: p.position?.abbreviation ?? p.position?.displayName ?? "",
      starter: !!p.starter,
      subbedIn: !!p.subbedIn,
      subbedOut: !!p.subbedOut,
      star: starByName(p.athlete.displayName)?.slug,
    }));
    return { players, formation: r?.formation };
  };
  const home = lineup("home");
  const away = lineup("away");

  const events: MatchEvent[] = (s.keyEvents ?? [])
    .filter((k) => KIND[k.type.type])
    .map((k) => ({
      minute: k.clock?.displayValue ?? "",
      kind: KIND[k.type.type],
      side: sideOf(k.team?.id),
      text: k.text ?? k.shortText ?? k.type.text,
    }));

  const stars = [
    ...home.players.filter((p) => p.star).map((p) => ({ slug: p.star!, side: "home" as const })),
    ...away.players.filter((p) => p.star).map((p) => ({ slug: p.star!, side: "away" as const })),
  ];

  return {
    ...base,
    events,
    stats,
    lineups: { home: home.players, away: away.players, homeFormation: home.formation, awayFormation: away.formation },
    commentary: (s.commentary ?? [])
      .slice(-40)
      .reverse()
      .map((c) => ({ minute: c.time?.displayValue ?? "", text: c.text })),
    stars,
  };
}

/* ---------------- league table ---------------- */

export interface TableRow {
  rank: number;
  team: string;
  logo: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gd: string;
  points: number;
}

export async function standings(leagueId: string): Promise<TableRow[]> {
  const j = await cachedJson<{
    children?: { standings?: { entries?: { team: { displayName: string; logos?: { href: string }[] }; stats: { name: string; displayValue: string; value?: number }[] }[] } }[];
  }>(`https://site.api.espn.com/apis/v2/sports/soccer/${leagueId}/standings`, 30 * 60_000);
  const entries = j.children?.[0]?.standings?.entries ?? [];
  const stat = (e: (typeof entries)[0], n: string) => e.stats.find((s) => s.name === n);
  return entries
    .map((e) => ({
      rank: Number(stat(e, "rank")?.displayValue) || 0,
      team: e.team.displayName,
      logo: e.team.logos?.[0]?.href ?? null,
      played: Number(stat(e, "gamesPlayed")?.displayValue) || 0,
      won: Number(stat(e, "wins")?.displayValue) || 0,
      drawn: Number(stat(e, "ties")?.displayValue) || 0,
      lost: Number(stat(e, "losses")?.displayValue) || 0,
      gd: stat(e, "pointDifferential")?.displayValue ?? "0",
      points: Number(stat(e, "points")?.displayValue) || 0,
    }))
    .sort((a, b) => a.rank - b.rank);
}

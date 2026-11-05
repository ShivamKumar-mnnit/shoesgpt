"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { Match } from "@/lib/football/types";
import { MatchStatus, TeamLogo, matchHref, useLiveMatches } from "./common";

/** Matches grouped by competition. Pass `leagueId` to show one league only. Updates live. */
export function MatchList({ initial, leagueId, emptyText }: { initial: Match[]; leagueId?: string; emptyText?: string }) {
  const live = useLiveMatches(initial);
  // The live feed covers about the last day and next day and a half; a league page also shows its full matchday.
  const all = leagueId ? mergeLeague(initial, live ?? [], leagueId) : (live ?? initial);

  const groups = new Map<string, Match[]>();
  for (const m of all) groups.set(m.league.name, [...(groups.get(m.league.name) ?? []), m]);

  if (!all.length) return <p className="rounded-3xl border border-dashed border-line p-10 text-center text-muted">{emptyText ?? "No matches right now."}</p>;

  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([name, ms]) => (
        <section key={name}>
          {!leagueId && (
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-muted">
              <Link href={`/football/${ms[0].league.slug}`} className="hover:text-ink">
                {name}
              </Link>
              {ms.some((m) => m.state === "in") && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">LIVE</span>}
            </h2>
          )}
          <ul className="overflow-hidden rounded-[24px] bg-white">
            {ms.map((m, i) => (
              <motion.li key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
                <Link
                  href={matchHref(m)}
                  className={clsx("grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 border-b border-line/60 px-4 py-3 transition last:border-0 hover:bg-paper md:px-6", m.state === "in" && "bg-red-50/60")}
                >
                  <span className="flex min-w-0 items-center justify-end gap-2 text-right font-semibold">
                    <span className="truncate">{m.home.name}</span>
                    <TeamLogo src={m.home.logo} alt={m.home.name} className="size-7 text-[10px]" />
                  </span>
                  <span className={clsx("min-w-[64px] rounded-lg px-2 py-1 text-center font-black tabular-nums", m.state === "in" ? "bg-red-500 text-white" : "bg-paper")}>
                    {m.state === "pre" ? "vs" : `${m.home.score} - ${m.away.score}`}
                  </span>
                  <span className="flex min-w-0 items-center gap-2 font-semibold">
                    <TeamLogo src={m.away.logo} alt={m.away.name} className="size-7 text-[10px]" />
                    <span className="truncate">{m.away.name}</span>
                  </span>
                  <MatchStatus m={m} className="w-28 text-right text-xs" />
                </Link>
              </motion.li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** League page: keep the full matchday from the server, with live scores swapped in. */
function mergeLeague(initial: Match[], live: Match[], leagueId: string) {
  const fresh = new Map(live.filter((m) => m.league.id === leagueId).map((m) => [m.id, m]));
  return initial.map((m) => fresh.get(m.id) ?? m);
}

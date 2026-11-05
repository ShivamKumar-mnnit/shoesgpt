"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import { STAR_BOOTS, bootsLabel } from "@/lib/football/boots";
import { EASE, MaskText } from "../ui";
import { MatchStatus, TeamLogo, matchHref, useLiveMatches } from "./common";

/** Homepage block: live matches right now + the stars' boots. */
export function FootballTeaser() {
  const matches = useLiveMatches();
  const top = (matches ?? []).slice(0, 6);
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-10">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">⚽ Football × boots</p>
          <h2 className="text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
            <MaskText text="Live scores. Then shop the boots." />
          </h2>
          <p className="mt-4 max-w-xl text-muted">Follow every match live, open it for lineups and stats, and see what the stars are wearing, with today’s cheapest price.</p>
        </div>
        <Link href="/football" className="group inline-flex items-center gap-2 self-start rounded-full border-2 border-ink px-5 py-2.5 font-semibold transition hover:bg-ink hover:text-paper">
          All live scores <ArrowUpRight className="size-4 transition group-hover:rotate-45" />
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {!matches && Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-[24px]" />)}
        {matches && !top.length && <p className="col-span-full rounded-3xl border border-dashed border-line p-8 text-center text-muted">No matches right now.</p>}
        {top.map((m, i) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, ease: EASE }}>
            <Link href={matchHref(m)} className={clsx("block rounded-[24px] p-4 transition hover:-translate-y-1 hover:shadow-xl", m.state === "in" ? "bg-ink text-paper" : "bg-white")}>
              <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider opacity-70">
                <span className="truncate">{m.league.name}</span>
                <MatchStatus m={m} className="normal-case" />
              </div>
              {[m.home, m.away].map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-0.5">
                  <TeamLogo src={t.logo} alt={t.name} className="size-6 text-[9px]" />
                  <span className="flex-1 truncate font-semibold">{t.name}</span>
                  <span className="font-black tabular-nums">{t.score ?? ""}</span>
                </div>
              ))}
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="no-scrollbar -mx-5 mt-8 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
        {STAR_BOOTS.slice(0, 10).map((p) => (
          <Link key={p.slug} href={`/football/boots/${p.slug}`} className="shrink-0 rounded-full border border-line bg-white px-4 py-2 text-sm transition hover:border-ink">
            <b>{p.name}</b> <span className="text-muted">· {bootsLabel(p)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

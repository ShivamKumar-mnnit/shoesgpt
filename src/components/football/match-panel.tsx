"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Crown, Footprints, RefreshCw } from "lucide-react";
import clsx from "clsx";
import type { MatchDetail, MatchEvent } from "@/lib/football/types";
import { bootsLabel, starBySlug, type StarBoots } from "@/lib/football/boots";
import { SPORTS, STORES } from "@/lib/stores";
import { money, shoeHref, useSearch } from "@/lib/client";
import type { Region } from "@/lib/types";
import { useRegion } from "../providers";
import { ShoeImg, StoreBadge, EASE } from "../ui";
import { MatchStatus, TeamLogo, matchHref } from "./common";

type Tab = "overview" | "lineups" | "boots" | "commentary";

export function MatchPanel({ match: m, compact = false }: { match: MatchDetail; compact?: boolean }) {
  const [tab, setTab] = useState<Tab>(m.stars.length ? "boots" : "overview");
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "lineups", label: "Lineups" },
    { id: "boots", label: `Boots${m.stars.length ? ` (${m.stars.length})` : ""}` },
    { id: "commentary", label: "Commentary" },
  ];

  return (
    <div>
      <Scoreboard m={m} />

      <div className="no-scrollbar mt-6 flex gap-1 overflow-x-auto rounded-full bg-paper-2 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx("relative flex-1 shrink-0 rounded-full px-4 py-2 text-sm font-semibold", tab === t.id ? "text-paper" : "text-ink-2")}
          >
            {tab === t.id && <motion.span layoutId={compact ? "tab-pill-c" : "tab-pill"} className="absolute inset-0 rounded-full bg-ink" />}
            <span className="relative flex items-center justify-center gap-1.5">
              {t.id === "boots" && <Footprints className="size-3.5" />}
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="mt-6">
          {tab === "overview" && <Overview m={m} />}
          {tab === "lineups" && <Lineups m={m} onBoots={() => setTab("boots")} />}
          {tab === "boots" && <BootsTab m={m} />}
          {tab === "commentary" && <Commentary m={m} />}
        </motion.div>
      </AnimatePresence>

      {compact && (
        <Link href={matchHref(m)} className="mt-6 flex items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-semibold text-paper transition hover:bg-accent">
          Full match page <ArrowUpRight className="size-4" />
        </Link>
      )}
    </div>
  );
}

function Scoreboard({ m }: { m: MatchDetail }) {
  const team = (t: MatchDetail["home"]) => (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      <TeamLogo src={t.logo} alt={t.name} className="size-14 text-xl md:size-16" />
      <span className="line-clamp-2 text-sm font-bold md:text-base">{t.name}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-3">
      {team(m.home)}
      <div className="flex shrink-0 flex-col items-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{m.league.name}</span>
        <motion.span key={`${m.home.score}-${m.away.score}`} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="my-1 text-4xl font-black tabular-nums md:text-5xl">
          {m.home.score ?? "–"} <span className="text-muted">:</span> {m.away.score ?? "–"}
        </motion.span>
        <MatchStatus m={m} className="text-sm" />
      </div>
      {team(m.away)}
    </div>
  );
}

const EVENT_ICON: Record<MatchEvent["kind"], string> = { goal: "⚽", yellow: "🟨", red: "🟥", sub: "🔁", period: "⏱", other: "•" };

function Overview({ m }: { m: MatchDetail }) {
  const events = m.events.filter((e) => e.kind !== "period" || /half|time/i.test(e.text));
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.15em] text-muted">Key moments</h3>
        {events.length ? (
          <ol className="space-y-2">
            {events.map((e, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: e.side === "away" ? 10 : -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={clsx("flex items-start gap-3 rounded-2xl px-3 py-2 text-sm", e.kind === "goal" ? "bg-lime" : "bg-white", e.side === "away" && "flex-row-reverse text-right")}
              >
                <span className="w-10 shrink-0 font-mono text-xs font-bold text-muted">{e.minute}</span>
                <span>{EVENT_ICON[e.kind]}</span>
                <span className="flex-1">{e.text}</span>
              </motion.li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted">{m.state === "pre" ? "The match hasn't started yet." : "No key moments yet."}</p>
        )}
      </div>
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.15em] text-muted">Match stats</h3>
        {m.stats.length ? (
          <div className="space-y-4">
            {m.stats.map((s) => {
              const h = parseFloat(s.home) || 0;
              const a = parseFloat(s.away) || 0;
              const hp = h + a ? (h / (h + a)) * 100 : 50;
              return (
                <div key={s.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <b>{s.home}{s.label === "Possession" ? "%" : ""}</b>
                    <span className="text-muted">{s.label}</span>
                    <b>{s.away}{s.label === "Possession" ? "%" : ""}</b>
                  </div>
                  <div className="flex h-2 gap-1 overflow-hidden rounded-full">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${hp}%` }} transition={{ duration: 0.8, ease: EASE }} className="rounded-full" style={{ background: m.home.color ?? "#121212" }} />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${100 - hp}%` }} transition={{ duration: 0.8, ease: EASE }} className="rounded-full bg-accent" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">Stats appear once the match kicks off.</p>
        )}
        {m.venue && <p className="mt-6 text-sm text-muted">Venue: {m.venue}</p>}
      </div>
    </div>
  );
}

function Lineups({ m, onBoots }: { m: MatchDetail; onBoots: () => void }) {
  const col = (side: "home" | "away") => {
    const t = m[side];
    const players = m.lineups[side];
    const formation = side === "home" ? m.lineups.homeFormation : m.lineups.awayFormation;
    const starters = players.filter((p) => p.starter);
    const bench = players.filter((p) => !p.starter);
    const row = (p: (typeof players)[0]) => (
      <li key={`${p.jersey}-${p.name}`} className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-sm">
        <span className="w-6 font-mono text-xs text-muted">{p.jersey}</span>
        <span className="flex-1 truncate">
          {p.name}
          {p.subbedOut && <span className="ml-1 text-xs text-red-500">↓</span>}
          {p.subbedIn && <span className="ml-1 text-xs text-green-600">↑</span>}
        </span>
        <span className="text-[10px] font-semibold text-muted">{p.position}</span>
        {p.star && (
          <button onClick={onBoots} className="flex items-center gap-1 rounded-full bg-lime px-2 py-0.5 text-[10px] font-black">
            <Footprints className="size-3" /> Boots
          </button>
        )}
      </li>
    );
    return (
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-bold">
          <TeamLogo src={t.logo} alt={t.name} className="size-6" /> {t.name}
          {formation && <span className="ml-auto text-xs text-muted">{formation}</span>}
        </h3>
        {players.length ? (
          <>
            <ul className="space-y-1">{starters.map(row)}</ul>
            {bench.length > 0 && (
              <>
                <p className="mb-1 mt-4 text-xs font-bold uppercase tracking-wider text-muted">Bench</p>
                <ul className="space-y-1 opacity-80">{bench.map(row)}</ul>
              </>
            )}
          </>
        ) : (
          <p className="text-sm text-muted">Lineups are usually out about an hour before kick-off.</p>
        )}
      </div>
    );
  };
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {col("home")}
      {col("away")}
    </div>
  );
}

function Commentary({ m }: { m: MatchDetail }) {
  if (!m.commentary.length) return <p className="text-sm text-muted">Live commentary starts at kick-off.</p>;
  return (
    <ol className="max-h-[420px] space-y-2 overflow-y-auto pr-2">
      {m.commentary.map((c, i) => (
        <li key={i} className="flex gap-3 rounded-2xl bg-white px-3 py-2 text-sm">
          <span className="w-10 shrink-0 font-mono text-xs font-bold text-muted">{c.minute}</span>
          <span>{c.text}</span>
        </li>
      ))}
    </ol>
  );
}

/* ---------------- Boots ---------------- */

/** Search phrase for a pair of boots in the shopper's country ("Nike Mercurial soccer cleats" in the US). */
export function bootsQuery(star: StarBoots, region: Region) {
  const football = SPORTS[region].find((s) => s.id === "football")?.q ?? "football boots";
  return `${star.model ?? star.brand} ${football}`;
}

function BootsTab({ m }: { m: MatchDetail }) {
  const { region } = useRegion();
  const football = SPORTS[region].find((s) => s.id === "football")?.q ?? "football boots";
  return (
    <div className="space-y-6">
      {m.stars.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {m.stars.map((s) => {
            const star = starBySlug(s.slug);
            return star ? <StarBootsCard key={s.slug} star={star} team={m[s.side].name} /> : null;
          })}
        </div>
      ) : (
        <p className="rounded-2xl bg-white p-4 text-sm text-muted">
          None of the players in this match are on our star boots list yet. Here are the most popular football boots instead.
        </p>
      )}
      <GenericBoots q={football} />
      <p className="text-xs text-muted">
        Boots are based on each player’s boot deal and signature line. Players sometimes switch models or colourways from match to match.
      </p>
    </div>
  );
}

/** One star player: the boots he wears and today's cheapest price, store by store. */
export function StarBootsCard({ star, team }: { star: StarBoots; team?: string }) {
  const { region } = useRegion();
  const { data, loading } = useSearch(bootsQuery(star, region), "relevance", 3);
  const products = data?.products ?? [];
  const cheapest = [...products].sort((a, b) => a.bestPrice - b.bestPrice)[0];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[28px] bg-white">
      <div className="flex items-center justify-between gap-3 bg-ink p-4 text-paper">
        <div className="min-w-0">
          <p className="truncate text-lg font-black">{star.name}</p>
          <p className="truncate text-xs text-paper/60">{team ?? star.club}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-lime">Usually wears</p>
          <p className="text-sm font-bold">{bootsLabel(star)}</p>
        </div>
      </div>
      <div className="space-y-2 p-3">
        {loading && <div className="skeleton h-20 rounded-2xl" />}
        {!loading && !products.length && (
          <p className="flex items-center gap-2 p-3 text-sm text-muted">
            <RefreshCw className="size-4" /> No live prices in your country right now.
          </p>
        )}
        {products.map((p) => (
          <Link key={p.key} href={shoeHref(p)} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-paper">
            <ShoeImg src={p.image} alt={p.title} className="size-16 shrink-0 rounded-xl bg-paper" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-semibold">{p.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <StoreBadge store={p.offers[0].store} className="!px-2 !py-0.5 !text-[10px]" />
                {p.offers.length > 1 && <span className="text-[11px] text-muted">+{p.offers.length - 1} more stores</span>}
              </div>
            </div>
            <div className="text-right">
              {p === cheapest && products.length > 1 && (
                <span className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-lime px-1.5 text-[10px] font-black">
                  <Crown className="size-3" /> Cheapest
                </span>
              )}
              <p className="font-black">{money(p.bestPrice, p.currency)}</p>
            </div>
          </Link>
        ))}
        <Link href={`/football/boots/${star.slug}`} className="block rounded-full border border-line py-2 text-center text-xs font-semibold hover:border-ink">
          {star.name}’s boots: all prices →
        </Link>
      </div>
    </motion.div>
  );
}

function GenericBoots({ q }: { q: string }) {
  const { data, loading } = useSearch(q, "popular", 4);
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.15em] text-muted">Popular football boots near you</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton aspect-[3/4] rounded-2xl" />)}
        {data?.products.map((p) => (
          <Link key={p.key} href={shoeHref(p)} className="group rounded-2xl bg-white p-2">
            <ShoeImg src={p.image} alt="" className="aspect-square rounded-xl bg-paper transition group-hover:scale-[1.03]" />
            <p className="mt-2 line-clamp-1 text-xs font-semibold">{p.title}</p>
            <p className="text-sm font-black">
              {money(p.bestPrice, p.currency)}{" "}
              <span className="text-[10px] font-medium text-muted">at {STORES[p.offers[0].store]?.name}</span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

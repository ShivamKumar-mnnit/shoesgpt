"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import clsx from "clsx";
import type { Match } from "@/lib/football/types";
import { EASE } from "../ui";
import { LiveDot, TeamLogo, matchHref, useLiveMatches, useMatch } from "./common";
import { MatchPanel } from "./match-panel";

/** Thin live-score bar at the very top of every page. Click a match to expand it. */
export function LiveTicker({ initial }: { initial?: Match[] }) {
  const matches = useLiveMatches(initial);
  const [open, setOpen] = useState<Match | null>(null);
  const list = matches?.slice(0, 30) ?? [];
  const liveCount = list.filter((m) => m.state === "in").length;
  // Scroll by itself when there are enough matches to fill the bar.
  const scrolling = list.length > 6;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className="relative flex h-10 items-center overflow-hidden bg-ink text-paper">
        <Link href="/football" className="z-10 flex h-full shrink-0 items-center gap-2 bg-ink pl-4 pr-3 text-[11px] font-black uppercase tracking-[0.15em] hover:text-lime md:pl-6">
          {liveCount ? <LiveDot /> : <span className="size-2 rounded-full bg-lime" />}
          {liveCount ? `${liveCount} live` : "Scores"}
        </Link>
        <div className="relative h-full flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_24px,black_calc(100%-24px),transparent)]">
          {!matches && (
            <div className="flex h-full items-center gap-2 px-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} className="h-5 w-36 animate-pulse rounded-full bg-white/10" />
              ))}
            </div>
          )}
          {matches && !list.length && <p className="flex h-full items-center px-4 text-xs text-paper/60">No matches right now. Check back on match day.</p>}
          <div
            className={clsx("flex h-full w-max items-center gap-1 px-2", scrolling && "animate-marquee hover:[animation-play-state:paused]")}
            style={{ ["--marquee-duration" as string]: `${Math.max(list.length * 5, 30)}s` }}
          >
            {(scrolling ? [...list, ...list] : list).map((m, i) => (
              <a
                key={`${m.id}-${i}`}
                href={matchHref(m)}
                // A plain click opens the panel here; Ctrl/Cmd/middle-click still opens the match page.
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  setOpen(m);
                }}
                className={clsx(
                  "flex h-7 shrink-0 items-center gap-2 rounded-full px-3 text-xs transition hover:bg-white/15",
                  open?.id === m.id && "bg-white/15",
                )}
                title={`${m.home.name} vs ${m.away.name} · ${m.league.name}`}
              >
                <TeamLogo src={m.home.logo} alt={m.home.name} className="size-4 text-[8px]" />
                <span className="font-semibold">{m.home.abbr}</span>
                <span className={clsx("rounded px-1.5 font-black tabular-nums", m.state === "in" ? "bg-red-500 text-white" : "bg-white/10")}>
                  {m.state === "pre" ? "vs" : `${m.home.score} - ${m.away.score}`}
                </span>
                <span className="font-semibold">{m.away.abbr}</span>
                <TeamLogo src={m.away.logo} alt={m.away.name} className="size-4 text-[8px]" />
                <span className={clsx("text-[10px]", m.state === "in" ? "font-bold text-red-400" : "text-paper/50")} suppressHydrationWarning>
                  {m.state === "pre" ? new Date(m.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : m.status}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>{open && <MatchDrawer match={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </>
  );
}

function MatchDrawer({ match, onClose }: { match: Match; onClose: () => void }) {
  const { match: detail, loading } = useMatch(match.league.id, match.id);
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 top-10 z-[54] bg-ink/40 backdrop-blur-sm" />
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -30, opacity: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="fixed inset-x-0 top-10 z-[55] mx-auto max-h-[calc(100vh-3rem)] max-w-5xl overflow-y-auto rounded-b-[32px] bg-paper p-5 shadow-2xl md:p-8"
        role="dialog"
        aria-label={`${match.home.name} vs ${match.away.name}`}
      >
        <button onClick={onClose} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white shadow" aria-label="Close">
          <X className="size-4" />
        </button>
        {loading || !detail ? (
          <div className="space-y-4 py-6">
            <div className="skeleton mx-auto h-16 w-2/3 rounded-2xl" />
            <div className="skeleton h-10 rounded-full" />
            <div className="skeleton h-64 rounded-3xl" />
          </div>
        ) : (
          <MatchPanel match={detail} compact />
        )}
        <button onClick={onClose} className="mx-auto mt-4 flex items-center gap-1 text-xs text-muted hover:text-ink">
          <ChevronDown className="size-3 rotate-180" /> Close
        </button>
      </motion.div>
    </>
  );
}

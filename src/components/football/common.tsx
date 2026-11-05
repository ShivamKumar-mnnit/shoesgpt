"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import type { Match, MatchDetail } from "@/lib/football/types";

/** Live matches, refreshed every 30 seconds while the page is open. */
export function useLiveMatches(initial?: Match[]) {
  const [matches, setMatches] = useState<Match[] | null>(initial ?? null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/football/live")
        .then((r) => r.json())
        .then((j: { matches?: Match[] }) => alive && j.matches && setMatches(j.matches))
        .catch(() => {});
    if (!initial) load();
    const t = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [initial]);
  return matches;
}

/** One match in detail; refreshes every 20 seconds while it's live. */
export function useMatch(league: string | null, id: string | null, initial?: MatchDetail | null) {
  const [data, setData] = useState<MatchDetail | null>(initial ?? null);
  const [loadedFor, setLoadedFor] = useState<string | null>(initial ? `${league}/${id}` : null);
  const key = league && id ? `${league}/${id}` : null;
  const live = data?.state === "in";

  useEffect(() => {
    if (!league || !id) return;
    let alive = true;
    const load = () =>
      fetch(`/api/football/match?league=${encodeURIComponent(league)}&id=${encodeURIComponent(id)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((j: MatchDetail | null) => {
          if (!alive) return;
          setData(j);
          setLoadedFor(`${league}/${id}`);
        })
        .catch(() => {});
    if (loadedFor !== `${league}/${id}`) load();
    const t = live ? setInterval(load, 20_000) : undefined;
    return () => {
      alive = false;
      if (t) clearInterval(t);
    };
  }, [league, id, live, loadedFor]);

  return { match: loadedFor === key ? data : null, loading: !!key && loadedFor !== key };
}

export const matchHref = (m: Pick<Match, "id" | "league">) => `/football/match/${m.league.slug}/${m.id}`;

export function TeamLogo({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken)
    return (
      <span className={clsx("grid shrink-0 place-items-center rounded-full bg-paper-2 text-[0.5em] font-black", className)}>
        {alt.slice(0, 2).toUpperCase()}
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" onError={() => setBroken(true)} className={clsx("shrink-0 object-contain", className)} />;
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={clsx("relative flex size-2", className)}>
      <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-red-500 opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-red-500" />
    </span>
  );
}

/** Kick-off time in the visitor's own time zone. */
export function KickOff({ iso, withDay = false }: { iso: string; withDay?: boolean }) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const today = new Date().toDateString() === d.toDateString();
  const day = today ? "Today" : d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
  return <span suppressHydrationWarning>{withDay ? `${day}, ${time}` : time}</span>;
}

/** "45'", "HT", "FT" or the kick-off time. */
export function MatchStatus({ m, className }: { m: Match; className?: string }) {
  if (m.state === "in")
    return (
      <span className={clsx("inline-flex items-center gap-1.5 font-bold text-red-500", className)}>
        <LiveDot /> {m.status}
      </span>
    );
  if (m.state === "post") return <span className={clsx("font-semibold text-muted", className)}>{m.status || "FT"}</span>;
  return (
    <span className={clsx("font-semibold text-muted", className)}>
      <KickOff iso={m.date} withDay />
    </span>
  );
}

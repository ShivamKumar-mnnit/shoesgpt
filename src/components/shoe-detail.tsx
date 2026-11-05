"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowUpRight, Check, Crown, ExternalLink, Heart, Plus, RefreshCw, TrendingDown } from "lucide-react";
import clsx from "clsx";
import { compact, money, toSaved, useCompare } from "@/lib/client";
import { isRegion, REGIONS, STORES } from "@/lib/stores";
import type { CompareResponse, Currency, ProductGroup } from "@/lib/types";
import { useRegion, useStore } from "./providers";
import { ShoeCard } from "./shoe-card";
import { EASE, Flag, ShoeImg, Sparkle, Stars, StoreBadge } from "./ui";

export function ShoeDetail({ initial }: { initial?: CompareResponse | null }) {
  const sp = useSearchParams();
  const title = sp.get("title");
  const brand = sp.get("brand");
  const current = useRegion().region;
  const param = sp.get("region");
  // Links carry the country the shoe was found in; otherwise use the shopper's country.
  const region = isRegion(param) ? param : current;
  const { data, loading, error, reload } = useCompare(title && brand ? { title, brand, region } : null, initial);

  if (!title || !brand) {
    return <Empty text="Pick a shoe to compare." />;
  }

  const p = data?.product;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-28 md:px-10">
      <nav className="mb-8 text-sm text-muted">
        <Link href="/" className="hover:text-ink">Home</Link> /{" "}
        <Link href={`/shoes?q=${encodeURIComponent(brand + " shoes")}`} className="hover:text-ink">{brand}</Link> /{" "}
        <span className="text-ink">{title}</span>
        <span className="ml-3 rounded-full bg-white px-2 py-0.5 text-xs">
          <Flag region={region} /> {REGIONS[region].name} · {REGIONS[region].currency}
        </span>
      </nav>

      {loading && !data ? (
        <DetailSkeleton />
      ) : error ? (
        <Empty text={`Couldn’t reach the stores (${error}).`} action={<button onClick={reload} className="underline">Try again</button>} />
      ) : p ? (
        <>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <Gallery p={p} />
            <Summary p={p} />
          </div>
          <PriceLadder p={p} fetchedAt={data!.fetchedAt} onRefresh={reload} loading={loading} sources={data!.sources} />
        </>
      ) : (
        <Empty text={`We couldn’t find “${title}” on the live stores right now.`} />
      )}

      {data && data.checkAlso.length > 0 && (
        <section className="mt-12">
          <h3 className="mb-1 text-lg font-bold">Also check on</h3>
          <p className="mb-4 text-sm text-muted">
            These stores don’t share prices with us yet, so we link straight to their search for this shoe.
          </p>
          <div className="flex flex-wrap gap-2">
            {data.checkAlso.map((c, i) => (
              <motion.a
                key={c.store}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pl-1.5 pr-4 text-sm font-semibold transition hover:border-ink"
              >
                <StoreBadge store={c.store} />
                Check price <ExternalLink className="size-3.5 transition group-hover:translate-x-0.5" />
              </motion.a>
            ))}
          </div>
        </section>
      )}

      {data && data.similar.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 text-4xl font-black tracking-tight md:text-5xl">More from {brand}</h2>
          <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
            {data.similar.slice(0, 8).map((s, i) => (
              <ShoeCard key={s.key} p={s} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Gallery({ p }: { p: ProductGroup }) {
  const [i, setI] = useState(0);
  const imgs = p.images.length ? p.images : [p.image];
  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="relative aspect-square overflow-hidden rounded-[36px] bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute inset-0"
          >
            <ShoeImg src={imgs[i] ?? null} alt={p.title} className="h-full w-full" />
          </motion.div>
        </AnimatePresence>
        {p.discount > 0 && (
          <span className="absolute left-5 top-5 rounded-full bg-lime px-3 py-1.5 text-sm font-black">-{p.discount}% off</span>
        )}
      </div>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {imgs.map((src, n) => (
          <button
            key={n}
            onClick={() => setI(n)}
            className={clsx("shrink-0 overflow-hidden rounded-2xl border-2 transition", n === i ? "border-ink" : "border-transparent opacity-70 hover:opacity-100")}
          >
            <ShoeImg src={src} alt="" className="size-20 bg-white" />
          </button>
        ))}
      </div>
    </div>
  );
}

function CountUp({ value, currency }: { value: number; currency: Currency }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => money(currency === "INR" ? Math.round(v) : Math.round(v * 100) / 100, currency));
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.2, ease: EASE });
    return () => c.stop();
  }, [mv, value]);
  return <motion.span>{text}</motion.span>;
}

function Summary({ p }: { p: ProductGroup }) {
  const { toggleCompare, inCompare, toggleLike, isLiked } = useStore();
  const saving = p.highestPrice - p.bestPrice;
  const cheapest = p.offers[0];
  return (
    <div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm font-bold uppercase tracking-[0.2em] text-accent">
        {p.brand}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
        className={clsx("mt-2 font-black leading-[0.95] tracking-tight", p.title.length > 45 ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl")}
      >
        {p.title}
      </motion.h1>
      {p.rating && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Stars value={p.rating} /> <b className="text-ink">{p.rating}</b>
          {p.ratingCount ? `· ${compact(p.ratingCount)} ratings` : ""}
        </p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.7, ease: EASE }}
        className="relative mt-8 overflow-hidden rounded-[32px] bg-ink p-7 text-paper"
      >
        <Sparkle className="absolute -right-6 -top-6 size-28 animate-spin-slow text-white/5" />
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime">
          <Crown className="size-4" /> Cheapest right now
        </p>
        <p className="mt-3 text-6xl font-black tracking-tighter">
          <CountUp value={p.bestPrice} currency={p.currency} />
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-paper/70">
          on <StoreBadge store={cheapest.store} />
          {p.mrp > p.bestPrice && <span className="line-through">{money(p.mrp, p.currency)}</span>}
        </div>
        {saving > 0 && (
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm">
            <TrendingDown className="size-4 text-lime" /> You save <b className="text-lime">{money(Math.round(saving * 100) / 100, p.currency)}</b> vs the costliest store
          </p>
        )}
        <a
          href={cheapest.url}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          className="group mt-6 flex items-center justify-between rounded-full bg-lime py-2 pl-6 pr-2 font-bold text-ink transition hover:bg-white"
        >
          Buy on {STORES[cheapest.store].name}
          <span className="grid size-10 place-items-center rounded-full bg-ink text-paper transition duration-500 group-hover:rotate-45">
            <ArrowUpRight className="size-5" />
          </span>
        </a>
      </motion.div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => toggleCompare(toSaved(p))}
          className={clsx(
            "flex flex-1 items-center justify-center gap-2 rounded-full border-2 py-3 font-semibold transition",
            inCompare(p.key) ? "border-ink bg-ink text-paper" : "border-ink hover:bg-ink hover:text-paper",
          )}
        >
          {inCompare(p.key) ? <Check className="size-4" /> : <Plus className="size-4" />}
          {inCompare(p.key) ? "In compare" : "Add to compare"}
        </button>
        <button
          onClick={() => toggleLike(toSaved(p))}
          className="grid size-[52px] place-items-center rounded-full border-2 border-ink transition hover:scale-105"
          aria-label="Like"
        >
          <Heart className={clsx("size-5", isLiked(p.key) && "fill-accent text-accent")} />
        </button>
      </div>
    </div>
  );
}

function PriceLadder({
  p,
  fetchedAt,
  onRefresh,
  loading,
  sources,
}: {
  p: ProductGroup;
  fetchedAt: string;
  onRefresh: () => void;
  loading: boolean;
  sources: { store: string; ok: boolean; ms: number }[];
}) {
  return (
    <section className="mt-16">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">Prices, cheapest first</h2>
          <p className="mt-2 text-sm text-muted" suppressHydrationWarning>
            Fetched live from {sources.filter((s) => s.ok).map((s) => `${STORES[s.store]?.name ?? s.store} (${s.ms}ms)`).join(", ")} at{" "}
            {new Date(fetchedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold hover:border-ink">
          <RefreshCw className={clsx("size-4", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      <ol className="space-y-3">
        {p.offers.map((o, i) => {
          const diff = o.price - p.bestPrice;
          const width = p.highestPrice === p.bestPrice ? 100 : 55 + 45 * ((p.highestPrice - o.price) / (p.highestPrice - p.bestPrice));
          return (
            <motion.li
              key={o.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.6, ease: EASE }}
              className={clsx(
                "relative grid grid-cols-[auto_1fr_auto] items-center gap-4 overflow-hidden rounded-[28px] p-4 md:grid-cols-[auto_auto_1fr_auto_auto] md:p-5",
                i === 0 ? "bg-lime" : "bg-white",
              )}
            >
              <span className="text-3xl font-black tabular-nums text-ink/20">{String(i + 1).padStart(2, "0")}</span>
              <ShoeImg src={o.image} alt="" className="hidden size-16 rounded-2xl bg-white md:block" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StoreBadge store={o.store} />
                  {i === 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase text-lime">
                      <Crown className="size-3" /> Cheapest
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-ink-2">{o.title}</p>
                <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ delay: 0.4 + i * 0.1, duration: 0.9, ease: EASE }}
                    className={clsx("h-full rounded-full", i === 0 ? "bg-ink" : "bg-accent")}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black tracking-tight">{money(o.price, o.currency)}</p>
                <p className="text-xs text-muted">
                  {diff > 0 ? <span className="text-accent">+{money(Math.round(diff * 100) / 100, o.currency)}</span> : o.discount > 0 ? `${o.discount}% off ${money(o.mrp, o.currency)}` : o.currency === "INR" ? "MRP" : "List price"}
                </p>
              </div>
              <a
                href={o.url}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="col-span-full flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-accent md:col-span-1"
              >
                Go to store <ArrowUpRight className="size-4" />
              </a>
            </motion.li>
          );
        })}
      </ol>
      {p.offers.length === 1 && (
        <p className="mt-4 text-sm text-muted">Only one live store has this exact model right now. Check the stores below too.</p>
      )}
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
      <div className="skeleton aspect-square rounded-[36px]" />
      <div className="space-y-4">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-12 w-full rounded-xl" />
        <div className="skeleton h-12 w-2/3 rounded-xl" />
        <div className="skeleton mt-8 h-64 rounded-[32px]" />
        <p className="flex items-center gap-2 text-sm text-muted">
          <RefreshCw className="size-4 animate-spin" /> Checking prices on every store…
        </p>
      </div>
    </div>
  );
}

function Empty({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl rounded-[32px] border border-dashed border-line p-12 text-center">
      <Sparkle className="mx-auto mb-4 size-8 text-accent" />
      <p className="text-lg font-semibold">{text}</p>
      {action && <div className="mt-4">{action}</div>}
      <Link href="/shoes" className="mt-6 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper">
        Browse shoes
      </Link>
    </div>
  );
}

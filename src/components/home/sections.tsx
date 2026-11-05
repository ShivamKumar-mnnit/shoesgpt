"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  Dumbbell,
  Footprints,
  Mountain,
  Trophy,
  Volleyball,
  Zap,
  Search,
  Scale,
  MousePointerClick,
  BadgePercent,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { BRANDS, REGIONS, REGION_IDS, SPORTS, storesIn } from "@/lib/stores";
import { compact, money, shoeHref, useSearch } from "@/lib/client";
import { useRegion } from "../providers";
import { landingPath, slugify } from "@/lib/site";
import { ShoeGrid } from "../shoe-card";
import { EASE, Flag, MaskText, Reveal, SectionHeading, ShoeImg, Sparkle, Stars, StoreBadge } from "../ui";

/* ---------------- Brand marquee ---------------- */

export function BrandMarquee() {
  const { region } = useRegion();
  const row = [...BRANDS[region], ...BRANDS[region]];
  return (
    <div className="relative -rotate-2 overflow-hidden border-y-2 border-ink bg-ink py-5 text-paper">
      <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap [--marquee-duration:35s] hover:[animation-play-state:paused]">
        {row.map((b, i) => (
          <Link key={i} href={landingPath({ region, kind: "brands", slug: slugify(b) })} className="flex items-center gap-10 text-3xl font-black uppercase tracking-tight transition hover:text-lime md:text-5xl">
            {b}
            <Sparkle className="size-6 text-accent" />
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Most liked ---------------- */

export function MostLiked() {
  const { info } = useRegion();
  const { data, loading, error } = useSearch(info.shoes, "popular", 8);
  return (
    <section id="trending" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
      <SectionHeading
        kicker="Most liked right now"
        title="The pairs everyone’s rating"
        sub="Ranked by the number of shopper ratings across stores, fetched live."
        right={<SeeAll q="shoes" />}
      />
      <ShoeGrid products={data?.products} loading={loading} error={error} />
    </section>
  );
}

function SeeAll({ q, href, label = "See all" }: { q?: string; href?: string; label?: string }) {
  return (
    <Link href={href ?? `/shoes?q=${encodeURIComponent(q ?? "")}`} className="group inline-flex items-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 font-semibold transition hover:bg-ink hover:text-paper">
      {label} <ArrowUpRight className="size-4 transition group-hover:rotate-45" />
    </Link>
  );
}

/* ---------------- Shop by sport ---------------- */

/** Icon and background colour for each sport tab (the sports themselves differ per country). */
const SPORT_LOOK: Record<string, { icon: typeof Zap; tone: string }> = {
  running: { icon: Zap, tone: "#d7f75b" },
  basketball: { icon: Trophy, tone: "#ffb199" },
  football: { icon: Volleyball, tone: "#a9d8ff" },
  training: { icon: Dumbbell, tone: "#f7d36b" },
  walking: { icon: Footprints, tone: "#e3c6ff" },
  hiking: { icon: Mountain, tone: "#c6e8c4" },
  cricket: { icon: Trophy, tone: "#ffd6e0" },
  tennis: { icon: Volleyball, tone: "#fff1a8" },
  golf: { icon: Trophy, tone: "#c6e8c4" },
  trail: { icon: Mountain, tone: "#ffd6e0" },
};

export function SportsSection() {
  const { region } = useRegion();
  const sports = SPORTS[region].map((s) => ({ ...s, ...(SPORT_LOOK[s.id] ?? SPORT_LOOK.running) }));
  const [activeId, setActiveId] = useState(sports[0].id);
  const active = sports.find((s) => s.id === activeId) ?? sports[0];
  const { data, loading, error } = useSearch(active.q, "relevance", 8);

  return (
    <section id="sports" className="relative overflow-hidden py-24 md:py-32">
      <motion.div
        animate={{ backgroundColor: active.tone }}
        transition={{ duration: 0.7 }}
        className="absolute inset-x-3 inset-y-0 -z-10 rounded-[48px] md:inset-x-6"
      />
      <div className="mx-auto max-w-7xl px-5 md:px-10">
        <SectionHeading kicker="Shop by sport" title="Built for how you move" right={<SeeAll href={landingPath({ region, kind: "sports", slug: active.id })} label={`All ${active.label.toLowerCase()} shoes`} />} />

        <div className="no-scrollbar -mx-5 mb-10 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
          {sports.map((s) => {
            const Icon = s.icon;
            const on = s.id === active.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={clsx("relative flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors", on ? "text-paper" : "bg-white/60 hover:bg-white")}
              >
                {on && <motion.span layoutId="sport-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <Icon className="relative z-10 size-4" />
                <span className="relative z-10">{s.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={active.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: EASE }}>
            <ShoeGrid products={data?.products} loading={loading} error={error} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ---------------- Deals: horizontal scroll driven by vertical scroll ---------------- */

export function DealsSection() {
  const { data, loading } = useSearch("men sneakers", "discount", 10);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-62%"]);
  const products = data?.products ?? [];

  return (
    <section id="deals" ref={ref} className="relative h-[300vh] bg-ink text-paper">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="mx-auto mb-10 w-full max-w-7xl px-5 md:px-10">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-lime">
            <BadgePercent className="size-4" /> Steal deals
          </p>
          <h2 className="text-5xl font-black leading-[0.9] tracking-tight md:text-8xl">
            <MaskText text="Biggest drops," />
            <br />
            <span className="text-accent">
              <MaskText text="live today." delay={0.1} />
            </span>
          </h2>
        </div>
        <motion.div style={{ x }} className="flex gap-5 pl-5 md:pl-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))]">
          {(loading ? Array.from({ length: 6 }) : products).map((p, i) =>
            p ? (
              <DealCard key={(p as (typeof products)[0]).key} p={p as (typeof products)[0]} i={i} />
            ) : (
              <div key={i} className="h-[420px] w-[300px] shrink-0 rounded-[32px] bg-white/10" />
            ),
          )}
          <Link href="/shoes?q=men%20sneakers&sort=discount" className="grid h-[420px] w-[300px] shrink-0 place-items-center rounded-[32px] border-2 border-dashed border-white/30 text-2xl font-bold transition hover:border-lime hover:text-lime">
            All deals →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function DealCard({ p, i }: { p: NonNullable<ReturnType<typeof useSearch>["data"]>["products"][0]; i: number }) {
  return (
    <Link href={shoeHref(p)} className="group relative h-[420px] w-[300px] shrink-0 overflow-hidden rounded-[32px] bg-paper text-ink">
      <ShoeImg src={p.image} alt={p.title} className="absolute inset-0 mix-blend-multiply transition duration-700 group-hover:scale-110" />
      <div className="absolute left-4 top-4 rounded-2xl bg-accent px-3 py-2 text-white">
        <p className="text-3xl font-black leading-none">{p.discount}%</p>
        <p className="text-[10px] font-bold uppercase">off</p>
      </div>
      <span className="absolute right-4 top-4 font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
      <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/90 p-4 backdrop-blur transition duration-500 group-hover:-translate-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{p.brand}</p>
        <p className="line-clamp-1 font-semibold">{p.title}</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-lg font-black">
            {money(p.bestPrice, p.currency)} <span className="text-xs font-medium text-muted line-through">{money(p.mrp, p.currency)}</span>
          </p>
          <StoreBadge store={p.offers[0].store} className="!px-2 !py-0.5 !text-[10px]" />
        </div>
      </div>
    </Link>
  );
}

/* ---------------- User recommended ---------------- */

export function UserRecommended() {
  const { data, loading } = useSearch("sneakers", "rating", 6);
  const products = data?.products ?? [];
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
      <SectionHeading
        kicker="User recommended"
        title="Shoppers can’t stop rating these"
        sub="Top-rated pairs, weighted by how many people rated them, so a handful of 5-star reviews doesn’t win."
        right={<SeeAll q="casual shoes" />}
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {(loading ? Array.from({ length: 6 }) : products).map((p, i) => {
          if (!p) return <div key={i} className="skeleton h-56 rounded-[32px]" />;
          const g = p as (typeof products)[0];
          return (
            <Reveal key={g.key} delay={(i % 3) * 0.1}>
              <Link
                href={shoeHref(g)}
                className={clsx(
                  "group flex h-full gap-4 rounded-[32px] p-4 transition duration-500 hover:-translate-y-1",
                  i === 0 ? "bg-ink text-paper" : "bg-white",
                )}
              >
                <ShoeImg src={g.image} alt={g.title} className="aspect-[3/4] w-32 shrink-0 rounded-2xl bg-paper" />
                <div className="flex min-w-0 flex-col py-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tighter">{g.rating?.toFixed(1)}</span>
                    <Stars value={g.rating ?? 0} />
                  </div>
                  <p className={clsx("mt-1 flex items-center gap-1 text-xs", i === 0 ? "text-paper/60" : "text-muted")}>
                    <Users className="size-3.5" /> {g.ratingCount ? compact(g.ratingCount) : "–"} shoppers rated
                  </p>
                  <p className="mt-auto line-clamp-2 pt-3 text-sm font-semibold">{g.title}</p>
                  <p className="mt-1 text-sm">
                    from <b>{money(g.bestPrice, g.currency)}</b>
                  </p>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Brands ---------------- */

const BRAND_TONES = ["#ffb199", "#d7f75b", "#a9d8ff", "#f7d36b", "#e3c6ff", "#c6e8c4"];

export function BrandsSection() {
  const { region } = useRegion();
  return (
    <section id="brands" className="mx-auto max-w-7xl px-5 py-24 md:px-10 md:py-32">
      <SectionHeading kicker="Shop by brand" title="Every big name, one price list" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {BRANDS[region].map((b, i) => (
          <Reveal key={b} delay={(i % 4) * 0.06} y={24}>
            <Link
              href={landingPath({ region, kind: "brands", slug: slugify(b) })}
              className="group relative flex h-36 items-end overflow-hidden rounded-[28px] border border-line bg-white p-5 md:h-44"
            >
              <span
                className="absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-out group-hover:scale-y-100"
                style={{ background: BRAND_TONES[i % BRAND_TONES.length] }}
              />
              <span className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-ink/20 transition duration-500 group-hover:rotate-45 group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                <ArrowUpRight className="size-4" />
              </span>
              <span className="relative text-2xl font-black uppercase tracking-tight md:text-3xl">{b}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */

const STEPS = [
  { icon: Search, title: "Search once", text: "Type a shoe, brand or sport. We query the stores live." },
  { icon: Scale, title: "Same shoe, side by side", text: "We match identical models across stores and sort prices from cheapest to costliest." },
  { icon: MousePointerClick, title: "Buy where it’s cheapest", text: "One click takes you to that store’s page. No cart, no markup." },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-10">
      <div className="grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <Reveal key={s.title} delay={i * 0.12}>
              <div className="group relative h-full overflow-hidden rounded-[32px] border border-line bg-white/60 p-8">
                <span className="absolute -right-4 -top-10 text-[10rem] font-black leading-none text-ink/[0.04] transition duration-700 group-hover:text-accent/15">
                  {i + 1}
                </span>
                <span className="grid size-14 place-items-center rounded-2xl bg-ink text-paper transition duration-500 group-hover:rotate-12 group-hover:bg-accent">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-8 text-2xl font-black tracking-tight">{s.title}</h3>
                <p className="mt-2 text-muted">{s.text}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Big CTA ---------------- */

export function BigCta() {
  const { region, setRegion } = useRegion();
  const { data } = useSearch("sneakers", "popular", 16);
  const shoes = (data?.products ?? []).filter((p) => p.image);
  const rowA = shoes.filter((_, i) => i % 2 === 0);
  const rowB = shoes.filter((_, i) => i % 2 === 1);
  const storeCount = REGION_IDS.reduce((n, r) => n + storesIn(r).length, 0);

  return (
    <section className="px-3 pb-6 md:px-6">
      <div className="relative overflow-hidden rounded-[48px] bg-accent py-20 text-white md:py-28">
        <Sparkle className="absolute left-10 top-10 size-10 animate-spin-slow text-lime" />
        <Sparkle className="absolute bottom-12 right-14 size-14 animate-spin-slow text-ink" />

        <div className="relative z-10 px-6 text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-ink">
            {REGION_IDS.length} countries · {storeCount}+ stores · one price list
          </p>
          <h2 className="mx-auto max-w-4xl text-5xl font-black leading-[0.9] tracking-tight md:text-8xl">
            <MaskText text="Stop overpaying for shoes." />
          </h2>
          <Reveal delay={0.2} y={16}>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/85">
              The same pair can cost very different amounts from one store to the next. We check them all and show you the
              cheapest first.
            </p>
          </Reveal>
        </div>

        {/* Live shoes from the shopper's country, sliding both ways */}
        <div className="relative my-14 -rotate-2 space-y-4">
          {[rowA, rowB].map((row, r) =>
            row.length ? (
              <div key={r} className="flex overflow-hidden">
                <div
                  className="flex w-max animate-marquee gap-4 pr-4 hover:[animation-play-state:paused]"
                  style={{ ["--marquee-duration" as string]: `${45 + r * 10}s`, animationDirection: r ? "reverse" : "normal" }}
                >
                  {[...row, ...row].map((p, i) => (
                    <Link
                      key={`${p.key}-${i}`}
                      href={shoeHref(p)}
                      className="group flex w-64 shrink-0 items-center gap-3 rounded-3xl bg-white p-2 pr-4 text-ink shadow-lg transition hover:-translate-y-1"
                    >
                      <ShoeImg src={p.image} alt={p.title} className="size-16 shrink-0 rounded-2xl bg-paper" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold uppercase tracking-wider text-muted">{p.brand}</span>
                        <span className="block truncate text-sm font-semibold">{p.title}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-sm font-black">
                          {money(p.bestPrice, p.currency)}
                          {p.discount > 0 && <span className="rounded-full bg-lime px-1.5 text-[10px]">-{p.discount}%</span>}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div key={r} className="mx-auto flex max-w-5xl gap-4 overflow-hidden px-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 w-64 shrink-0 rounded-3xl bg-white/20" />
                ))}
              </div>
            ),
          )}
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 px-6">
          <Reveal delay={0.1} y={16}>
            <Link href="/shoes" className="inline-flex items-center gap-3 rounded-full bg-ink py-2 pl-7 pr-2 text-lg font-semibold transition hover:scale-105">
              Compare now
              <span className="grid size-11 place-items-center rounded-full bg-lime text-ink">
                <ArrowUpRight className="size-5" />
              </span>
            </Link>
          </Reveal>
          <Reveal delay={0.2} y={16} className="w-full">
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-ink">Shopping from somewhere else?</p>
            <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
              {REGION_IDS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={clsx(
                    "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition",
                    r === region ? "bg-ink text-paper" : "bg-white/15 hover:bg-white/30",
                  )}
                >
                  <Flag region={r} /> {REGIONS[r].name}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

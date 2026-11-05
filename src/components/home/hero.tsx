"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowDown, ArrowUpRight, ShoppingCart, Store, Crown } from "lucide-react";
import { EASE, Flag, ShoeImg, Sparkle, StoreBadge } from "../ui";
import { money, shoeHref, useSearch } from "@/lib/client";
import { liveStoresIn, storesIn } from "@/lib/stores";
import { useRegion } from "../providers";

const TONES = ["#ffb199", "#d7f75b", "#a9d8ff", "#f7d36b", "#e3c6ff"];
const ROTATE_MS = 5500;

export function Hero() {
  const { data, loading } = useSearch("sneakers", "popular", 5);
  const { region, info } = useRegion();
  const regionStores = storesIn(region);
  const products = data?.products ?? [];
  const [i, setI] = useState(0);
  const current = products[i % Math.max(products.length, 1)];
  const tone = TONES[i % TONES.length];

  useEffect(() => {
    if (products.length < 2) return;
    const t = setTimeout(() => setI((n) => (n + 1) % products.length), ROTATE_MS);
    return () => clearTimeout(t);
  }, [i, products.length]);

  // Scroll parallax
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const textY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const stageY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Mouse parallax for the stage
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 18 });
  const sy = useSpring(my, { stiffness: 80, damping: 18 });
  const shoeX = useTransform(sx, (v) => v * 30);
  const shoeY = useTransform(sy, (v) => v * 20);
  const shoeR = useTransform(sx, (v) => v * 6);
  const bgX = useTransform(sx, (v) => v * -40);

  const totalFetched = data?.sources.reduce((a, s) => a + s.count, 0) ?? 0;
  const liveStores = data?.sources.filter((s) => s.ok).length ?? 0;

  return (
    <section
      ref={ref}
      onMouseMove={(e) => {
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
      }}
      className="relative min-h-[100svh] overflow-hidden px-5 pb-12 pt-24 md:px-10 lg:pt-28"
    >
      {/* Decorative stars, like the reference header */}
      <Sparkle className="absolute left-[3%] top-[45%] hidden size-6 lg:block animate-spin-slow text-accent" />
      <Sparkle className="absolute right-[42%] top-40 hidden size-4 animate-spin-slow text-ink lg:block" />
      <Sparkle className="absolute bottom-24 left-[46%] hidden size-8 animate-float text-lime lg:block" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        {/* Left: copy */}
        <motion.div style={{ y: textY, ["opacity" as string]: fade }} className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs font-medium backdrop-blur"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            Live prices from {regionStores.length} stores in <Flag region={region} /> {info.name}
          </motion.div>

          <h1 className="whitespace-nowrap text-[clamp(2.6rem,6.3vw,6.2rem)] font-black leading-[0.9] tracking-[-0.045em]">
            {[
              <>Find your</>,
              <>
                <span className="text-outline">perfect</span> pair
                <Sparkle className="ml-3 inline-block size-[0.55em] -translate-y-[0.1em] animate-spin-slow text-accent" />
              </>,
              <>
                pay the{" "}
                <span className="relative inline-block">
                  least!
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.9, delay: 1.1, ease: EASE }}
                    className="absolute bottom-[0.08em] left-0 -z-10 h-[0.32em] w-full origin-left bg-lime"
                  />
                </span>
              </>,
            ].map((line, idx) => (
              <span key={idx} className="block overflow-hidden pb-[0.06em]">
                <motion.span
                  className="block"
                  initial={{ y: "105%", rotate: 4 }}
                  animate={{ y: 0, rotate: 0 }}
                  transition={{ duration: 1, delay: 0.15 + idx * 0.12, ease: EASE }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: EASE }}
            className="mt-7 max-w-md text-lg text-ink-2"
          >
            Shoe price comparison across {liveStoresIn(region).map((s) => s.name).join(", ")} and more. We line up
            every price for the same pair, cheapest first.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.75, ease: EASE }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <a
              href="#trending"
              className="group flex items-center gap-3 rounded-full bg-ink py-2 pl-6 pr-2 text-base font-semibold text-paper transition hover:bg-accent"
            >
              Start comparing
              <span className="grid size-10 place-items-center rounded-full bg-paper text-ink transition-transform duration-500 group-hover:rotate-[360deg]">
                <ArrowDown className="size-4 animate-bounce" />
              </span>
            </a>
            <Link href="/shoes" className="group flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
              Explore all shoes <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Stat block */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9, ease: EASE }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Stat icon={<ShoppingCart className="size-5" />} value={loading ? "…" : `${totalFetched}+`} label="shoes fetched just now" />
            <Stat icon={<Store className="size-5" />} value={`${regionStores.length}`} label={`stores · ${liveStores || "–"} live right now`} />
          </motion.div>
        </motion.div>

        {/* Right: live shoe stage */}
        <motion.div style={{ y: stageY }} className="relative mx-auto aspect-square w-full max-w-[600px]">
          {/* Giant brand word behind */}
          <motion.div style={{ x: bgX }} className="pointer-events-none absolute inset-0 grid place-items-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={current?.brand ?? "x"}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.6, ease: EASE }}
                className="text-outline whitespace-nowrap text-[clamp(5rem,14vw,11rem)] font-black uppercase leading-none tracking-tighter opacity-30"
              >
                {current?.brand ?? "shoes"}
              </motion.span>
            </AnimatePresence>
          </motion.div>

          {/* Coloured disc */}
          <motion.div
            animate={{ backgroundColor: tone }}
            transition={{ duration: 0.9 }}
            className="absolute inset-[9%] rounded-full"
          />

          {/* Rotating text ring */}
          <svg viewBox="0 0 200 200" className="absolute inset-0 animate-spin-slow">
            <defs>
              <path id="ring" d="M100,100 m-92,0 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0" />
            </defs>
            <text className="fill-ink text-[8.6px] font-bold uppercase tracking-[0.42em]">
              <textPath href="#ring">Best price · Every store · Live compare · No fake deals ·</textPath>
            </text>
          </svg>

          {/* Shoe */}
          <motion.div style={{ x: shoeX, y: shoeY, rotate: shoeR }} className="absolute inset-[14%]">
            <AnimatePresence mode="popLayout">
              {current ? (
                <motion.div
                  key={current.key}
                  initial={{ opacity: 0, x: 120, rotate: 25, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, rotate: -8, scale: 1 }}
                  exit={{ opacity: 0, x: -120, rotate: -35, scale: 0.8 }}
                  transition={{ duration: 0.9, ease: EASE }}
                  className="h-full w-full animate-float"
                >
                  <Link href={shoeHref(current)}>
                    <ShoeImg src={current.image} alt={current.title} className="h-full w-full rounded-full mix-blend-multiply" />
                  </Link>
                </motion.div>
              ) : (
                <div className="skeleton h-full w-full rounded-full opacity-60" />
              )}
            </AnimatePresence>
          </motion.div>

          {/* Floating price chips from each store */}
          <AnimatePresence mode="wait">
            {current && (
              <motion.div key={current.key} className="pointer-events-none absolute inset-0">
                {current.offers.slice(0, 3).map((o, n) => {
                  const pos = [
                    "left-[-2%] top-[18%]",
                    "right-[-4%] top-[42%]",
                    "left-[4%] bottom-[14%]",
                  ][n];
                  return (
                    <motion.div
                      key={o.id}
                      initial={{ opacity: 0, scale: 0.6, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.6, delay: 0.35 + n * 0.15, ease: EASE }}
                      className={`absolute ${pos}`}
                    >
                      <div
                        className={`flex animate-float items-center gap-2 rounded-2xl px-3 py-2 shadow-xl ${n === 0 ? "bg-ink text-paper" : "bg-white"}`}
                        style={{ animationDelay: `${n * 0.8}s` }}
                      >
                        {n === 0 && <Crown className="size-4 text-lime" />}
                        <StoreBadge store={o.store} className="!px-2 !py-0.5 !text-[10px]" />
                        <span className="text-sm font-black">{money(o.price, o.currency)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current shoe caption */}
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={current.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="absolute -bottom-2 right-0 max-w-[60%] rounded-2xl border border-line bg-paper/90 p-3 backdrop-blur"
              >
                <p className="truncate text-xs font-semibold">{current.title}</p>
                <p className="text-xs text-muted">
                  Best: <b className="text-ink">{money(current.bestPrice, current.currency)}</b>
                  {current.discount > 0 && <span className="ml-1 text-accent">({current.discount}% off)</span>}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Thumbnails + autoplay progress */}
      <div className="mx-auto mt-6 flex max-w-7xl justify-center gap-3 lg:justify-end">
        {products.map((p, n) => (
          <button
            key={p.key}
            onClick={() => setI(n)}
            className="group relative size-14 overflow-hidden rounded-2xl bg-white ring-2 ring-transparent transition data-[on=true]:ring-ink"
            data-on={n === i % products.length}
            aria-label={p.title}
          >
            <ShoeImg src={p.image} alt="" className="h-full w-full mix-blend-multiply transition group-hover:scale-110" />
            {n === i % products.length && (
              <motion.span
                key={i}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: ROTATE_MS / 1000, ease: "linear" }}
                className="absolute inset-x-0 bottom-0 h-1 origin-left bg-accent"
              />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/60 py-2.5 pl-2.5 pr-5 backdrop-blur">
      <span className="grid size-11 place-items-center rounded-xl bg-ink text-paper">{icon}</span>
      <div>
        <p className="text-2xl font-black leading-none tracking-tight">{value}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
      <ArrowDown className="ml-1 size-4 text-muted" />
    </div>
  );
}

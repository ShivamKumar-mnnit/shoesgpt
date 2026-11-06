"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Check, Heart, Plus, ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import type { ProductGroup } from "@/lib/types";
import { compact, money, shoeHref, toSaved } from "@/lib/client";
import { useStore } from "./providers";
import { EASE, ShoeImg, Stars, StoreBadge } from "./ui";

/** `reveal={false}` on server-rendered pages: cards are visible right away instead of fading in. */
export function ShoeCard({ p, index = 0, tone, reveal = true }: { p: ProductGroup; index?: number; tone?: string; reveal?: boolean }) {
  const { toggleCompare, inCompare, toggleLike, isLiked } = useStore();
  const liked = isLiked(p.key);
  const comparing = inCompare(p.key);

  // Gentle 3D tilt that follows the cursor.
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 200, damping: 20 });

  return (
    <motion.article
      initial={reveal ? { opacity: 0, y: 40 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.08, ease: EASE }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
      }}
      onMouseLeave={() => {
        mx.set(0.5);
        my.set(0.5);
      }}
      className="group relative flex flex-col rounded-[28px] bg-white p-3 shadow-[0_1px_0_rgba(0,0,0,.04)] transition-shadow duration-500 hover:shadow-[0_30px_60px_-25px_rgba(0,0,0,.35)]"
    >
      <Link href={shoeHref(p)} className="relative block overflow-hidden rounded-[22px]" style={{ background: tone ?? "#f6f4ef" }}>
        <ShoeImg
          src={p.image}
          alt={p.title}
          className="aspect-square mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-3"
        />
        {p.discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-lime px-2.5 py-1 text-[11px] font-black">-{p.discount}%</span>
        )}
        <span className="absolute inset-x-3 bottom-3 flex translate-y-4 items-center justify-between rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-paper opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          Compare {p.offers.length} price{p.offers.length > 1 ? "s" : ""} <ArrowUpRight className="size-4" />
        </span>
      </Link>

      <button
        onClick={() => toggleLike(toSaved(p))}
        aria-label={liked ? "Unlike" : "Like"}
        className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-white/90 backdrop-blur transition hover:scale-110"
      >
        <motion.span key={String(liked)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
          <Heart className={clsx("size-4", liked ? "fill-accent text-accent" : "text-ink")} />
        </motion.span>
      </button>

      <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted">{p.brand}</span>
          {p.rating && (
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <Stars value={p.rating} className="!text-[10px] !tracking-[1px]" /> {p.rating}
              {p.ratingCount ? ` (${compact(p.ratingCount)})` : ""}
            </span>
          )}
        </div>
        <Link href={shoeHref(p)} className="line-clamp-2 text-[15px] font-semibold leading-snug hover:underline">
          {p.title}
        </Link>

        <div className="mt-3 flex flex-wrap gap-1">
          {p.offers.map((o) => (
            <StoreBadge key={o.id} store={o.store} className="!px-2 !py-0.5 !text-[10px]" />
          ))}
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Best price</p>
            <p className="text-xl font-black tracking-tight">
              {money(p.bestPrice, p.currency)}
              {p.mrp > p.bestPrice && <span className="ml-1.5 text-xs font-medium text-muted line-through">{money(p.mrp, p.currency)}</span>}
            </p>
          </div>
          <button
            onClick={() => toggleCompare(toSaved(p))}
            className={clsx(
              "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              comparing ? "border-ink bg-ink text-paper" : "border-line hover:border-ink",
            )}
          >
            {comparing ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
            {comparing ? "Added" : "Compare"}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export function ShoeCardSkeleton() {
  return (
    <div className="rounded-[28px] bg-white p-3">
      <div className="skeleton aspect-square rounded-[22px]" />
      <div className="space-y-2 px-2 pb-2 pt-4">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton mt-4 h-6 w-24 rounded" />
      </div>
    </div>
  );
}

export function ShoeGrid({
  products,
  loading,
  error,
  count = 8,
  className,
}: {
  products?: ProductGroup[];
  loading: boolean;
  error?: string | null;
  count?: number;
  className?: string;
}) {
  if (error) return <p className="rounded-3xl border border-dashed border-line p-10 text-center text-muted">Couldn’t reach the stores right now ({error}). Try again in a moment.</p>;
  return (
    <div className={clsx("grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4", className)}>
      {loading || !products
        ? Array.from({ length: count }).map((_, i) => <ShoeCardSkeleton key={i} />)
        : products.slice(0, count).map((p, i) => <ShoeCard key={p.key} p={p} index={i} />)}
      {!loading && products && !products.length && (
        <p className="col-span-full p-10 text-center text-muted">No live results found.</p>
      )}
    </div>
  );
}

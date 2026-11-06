"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import { money, useSearch } from "@/lib/client";
import { useRegion } from "./providers";
import { liveStoresIn, STORES } from "@/lib/stores";
import type { SortKey, StoreId } from "@/lib/types";
import { ShoeGrid } from "./shoe-card";
import { MaskText } from "./ui";

const SORTS: { id: SortKey; label: string }[] = [
  { id: "relevance", label: "Most stores" },
  { id: "price_asc", label: "Price: low → high" },
  { id: "price_desc", label: "Price: high → low" },
  { id: "discount", label: "Biggest discount" },
  { id: "popular", label: "Most rated" },
  { id: "rating", label: "Top rated" },
];

const QUICK = ["Sneakers", "Running shoes", "Nike", "Adidas", "Puma", "Red Tape", "Bacca Bucci", "Skechers", "Formal shoes", "Sports shoes"];

export function Browse() {
  const sp = useSearchParams();
  const router = useRouter();
  const q = sp.get("q") || "sneakers";
  const sort = (sp.get("sort") as SortKey) || "relevance";
  const [text, setText] = useState(q);
  const [stores, setStores] = useState<StoreId[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [prevQ, setPrevQ] = useState(q);
  if (prevQ !== q) {
    // A new search came in from the URL (e.g. the navbar search).
    setPrevQ(q);
    setText(q);
    setMaxPrice(null);
  }

  const { data, loading, error } = useSearch(q, sort, 48);
  const { region, info } = useRegion();
  const step = info.currency === "INR" ? 250 : 5;

  const setParam = (next: { q?: string; sort?: SortKey }) => {
    const params = new URLSearchParams(sp.toString());
    if (next.q !== undefined) params.set("q", next.q);
    if (next.sort) params.set("sort", next.sort);
    router.replace(`/shoes?${params.toString()}`, { scroll: false });
  };

  const ceiling = useMemo(() => Math.ceil(Math.max(step, ...(data?.products.map((p) => p.bestPrice) ?? [0])) / step) * step, [data, step]);
  const filtered = useMemo(
    () =>
      data?.products.filter(
        (p) => (!stores.length || p.offers.some((o) => stores.includes(o.store))) && (maxPrice === null || p.bestPrice <= maxPrice),
      ),
    [data, stores, maxPrice],
  );

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-10">
      <h1 className="text-5xl font-black capitalize leading-[0.9] tracking-tight md:text-8xl">
        <MaskText key={q} text={q} />
      </h1>
      <p className="mt-4 text-muted">
        {loading ? "Checking stores…" : `${filtered?.length ?? 0} shoes · live from ${data?.sources.filter((s) => s.ok).map((s) => STORES[s.store]?.name ?? s.store).join(", ") || "stores"}`}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) setParam({ q: text.trim() });
        }}
        className="mt-8 flex items-center gap-3 rounded-full border-2 border-ink bg-white p-1.5 pl-5"
      >
        <Search className="size-5 text-muted" />
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Search shoes, brands, sports…" className="min-w-0 flex-1 bg-transparent py-2 text-lg outline-none" />
        <button className="shrink-0 rounded-full bg-ink px-4 py-3 font-semibold text-paper transition hover:bg-accent sm:px-6">Search</button>
      </form>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto">
        {QUICK.map((s) => (
          <button
            key={s}
            onClick={() => {
              setText(s);
              setParam({ q: s });
            }}
            className={clsx("shrink-0 rounded-full border px-4 py-1.5 text-sm transition", q.toLowerCase() === s.toLowerCase() ? "border-ink bg-ink text-paper" : "border-line hover:border-ink")}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-[28px] bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="mr-1 size-4 text-muted" />
          {liveStoresIn(region).map((s) => {
            const on = stores.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => setStores((v) => (on ? v.filter((x) => x !== s.id) : [...v, s.id]))}
                className="rounded-full border px-3 py-1.5 text-xs font-bold transition"
                style={on ? { background: s.color, borderColor: s.color, color: "white" } : { borderColor: "var(--color-line)" }}
              >
                {s.name}
              </button>
            );
          })}
          <label className="ml-2 flex items-center gap-2 text-xs text-muted">
            Max {money(maxPrice ?? ceiling, info.currency)}
            <input
              type="range"
              min={0}
              max={ceiling}
              step={step}
              value={maxPrice ?? ceiling}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="accent-[var(--color-accent)]"
            />
          </label>
        </div>
        <div className="no-scrollbar relative flex gap-1 overflow-x-auto rounded-full bg-paper p-1">
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setParam({ sort: s.id })}
              className={clsx("relative shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold", sort === s.id ? "text-paper" : "text-ink-2")}
            >
              {sort === s.id && <motion.span layoutId="sort-pill" className="absolute inset-0 rounded-full bg-ink" />}
              <span className="relative">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <ShoeGrid className="mt-8" products={filtered} loading={loading} error={error} count={48} />
    </div>
  );
}

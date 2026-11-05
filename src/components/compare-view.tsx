"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Crown, Plus, Search, Trash2, X } from "lucide-react";
import clsx from "clsx";
import { compact, money, shoeHref, toSaved, useSearch, type SavedShoe } from "@/lib/client";
import type { CompareResponse, ProductGroup } from "@/lib/types";
import { MAX_COMPARE, useStore } from "./providers";
import { STORES } from "@/lib/stores";
import { EASE, MaskText, ShoeImg, Sparkle, Stars, StoreBadge } from "./ui";

/** Fetch live prices for every shoe in the compare list. */
function useLive(list: SavedShoe[]) {
  // A key missing from `live` means its prices are still loading.
  const [live, setLive] = useState<Record<string, ProductGroup | null | "loading">>({});
  const requested = useRef(new Set<string>());

  useEffect(() => {
    for (const s of list) {
      if (requested.current.has(s.key)) continue; // only fetch shoes we haven't fetched yet
      requested.current.add(s.key);
      fetch(`/api/compare?title=${encodeURIComponent(s.title)}&brand=${encodeURIComponent(s.brand)}&region=${s.region ?? "in"}`)
        .then((r) => r.json() as Promise<CompareResponse>)
        .then((d) => setLive((v) => ({ ...v, [s.key]: d.product })))
        .catch(() => setLive((v) => ({ ...v, [s.key]: null })));
    }
  }, [list]);

  return live;
}

export function CompareView() {
  const { compare, removeCompare, clearCompare } = useStore();
  const live = useLive(compare);
  const [picker, setPicker] = useState(false);

  const groups = compare.map((s) => {
    const l = live[s.key];
    return { saved: s, p: l && l !== "loading" ? l : null, loading: l === "loading" || l === undefined };
  });
  const ready = groups.filter((g) => g.p).map((g) => g.p!);

  const best = {
    price: Math.min(...ready.map((p) => p.bestPrice)),
    discount: Math.max(...ready.map((p) => p.discount)),
    rating: Math.max(...ready.map((p) => p.rating ?? 0)),
    stores: Math.max(...ready.map((p) => p.offers.length)),
  };

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-10">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-5xl font-black leading-[0.9] tracking-tight md:text-8xl">
          <MaskText text="Head to head" />
        </h1>
        {compare.length > 0 && (
          <button onClick={clearCompare} className="flex items-center gap-2 text-sm text-muted hover:text-ink">
            <Trash2 className="size-4" /> Clear all
          </button>
        )}
      </div>

      {compare.length === 0 ? (
        <div className="rounded-[36px] border border-dashed border-line p-14 text-center">
          <Sparkle className="mx-auto mb-4 size-10 animate-spin-slow text-accent" />
          <p className="text-2xl font-bold">Nothing to compare yet</p>
          <p className="mt-2 text-muted">Add up to {MAX_COMPARE} shoes and we’ll put their live prices side by side.</p>
          <button onClick={() => setPicker(true)} className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-paper">
            <Plus className="size-4" /> Add a shoe
          </button>
        </div>
      ) : (
        <div className="no-scrollbar -mx-5 overflow-x-auto px-5">
          <div className="grid min-w-[720px] gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(compare.length + 1, MAX_COMPARE)}, minmax(0,1fr))` }}>
            <AnimatePresence mode="popLayout">
              {groups.map(({ saved, p, loading }, i) => (
                <motion.div
                  key={saved.key}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
                  className="flex flex-col rounded-[32px] bg-white p-4"
                >
                  <div className="relative">
                    <ShoeImg src={p?.image ?? saved.image} alt={saved.title} className="aspect-square rounded-[24px] bg-paper" />
                    <button onClick={() => removeCompare(saved.key)} className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-white shadow" aria-label="Remove">
                      <X className="size-4" />
                    </button>
                  </div>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">{saved.brand}</p>
                  <Link href={shoeHref(saved)} className="line-clamp-2 min-h-[2.6em] font-semibold leading-snug hover:underline">
                    {saved.title}
                  </Link>

                  {loading ? (
                    <div className="mt-4 space-y-2">
                      <div className="skeleton h-14 rounded-2xl" />
                      <div className="skeleton h-10 rounded-2xl" />
                      <div className="skeleton h-10 rounded-2xl" />
                    </div>
                  ) : !p ? (
                    <p className="mt-4 rounded-2xl bg-paper p-4 text-sm text-muted">Not found on live stores right now. Last seen at {money(saved.bestPrice, saved.currency ?? "INR")}.</p>
                  ) : (
                    <>
                      <Row label="Best price" win={ready.length > 1 && p.bestPrice === best.price}>
                        <span className="text-2xl font-black">{money(p.bestPrice, p.currency)}</span>
                      </Row>
                      <Row label="Cheapest at">
                        <StoreBadge store={p.offers[0].store} />
                      </Row>
                      <Row label="Discount" win={ready.length > 1 && p.discount === best.discount && p.discount > 0}>
                        {p.discount}% off {money(p.mrp, p.currency)}
                      </Row>
                      <Row label="Rating" win={ready.length > 1 && !!p.rating && p.rating === best.rating}>
                        {p.rating ? (
                          <span className="flex items-center gap-1.5">
                            <Stars value={p.rating} /> {p.rating} <span className="text-xs text-muted">({compact(p.ratingCount ?? 0)})</span>
                          </span>
                        ) : (
                          <span className="text-muted">–</span>
                        )}
                      </Row>
                      <Row label="Stores" win={ready.length > 1 && p.offers.length === best.stores}>
                        {p.offers.length} live
                      </Row>

                      <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">All prices ↑</p>
                      <ul className="space-y-1.5">
                        {p.offers.map((o, n) => (
                          <li key={o.id}>
                            <a
                              href={o.url}
                              target="_blank"
                              rel="noopener noreferrer nofollow sponsored"
                              className={clsx("group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition", n === 0 ? "bg-lime" : "bg-paper hover:bg-paper-2")}
                            >
                              <span className="flex items-center gap-1.5 font-semibold">
                                {n === 0 && <Crown className="size-3.5" />}
                                {STORES[o.store]?.name ?? o.store}
                              </span>
                              <span className="flex items-center gap-1 font-bold">
                                {money(o.price, o.currency)} <ArrowUpRight className="size-3.5 opacity-40 group-hover:opacity-100" />
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                      <a
                        href={p.offers[0].url}
                        target="_blank"
                        rel="noopener noreferrer nofollow sponsored"
                        className="mt-5 flex items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-semibold text-paper transition hover:bg-accent"
                      >
                        Buy cheapest <ArrowUpRight className="size-4" />
                      </a>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {compare.length < MAX_COMPARE && (
              <motion.button
                layout
                onClick={() => setPicker(true)}
                className="group flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-[32px] border-2 border-dashed border-line text-muted transition hover:border-ink hover:text-ink"
              >
                <span className="grid size-16 place-items-center rounded-full border-2 border-current transition duration-500 group-hover:rotate-90">
                  <Plus className="size-6" />
                </span>
                Add a shoe
              </motion.button>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>{picker && <Picker onClose={() => setPicker(false)} />}</AnimatePresence>
    </div>
  );
}

function Row({ label, win, children }: { label: string; win?: boolean; children: React.ReactNode }) {
  return (
    <div className={clsx("mt-2 flex min-h-12 items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm", win ? "bg-ink text-paper" : "bg-paper")}>
      <span className={clsx("text-xs", win ? "text-lime" : "text-muted")}>
        {win && "★ "}
        {label}
      </span>
      <span className="text-right font-semibold">{children}</span>
    </div>
  );
}

function Picker({ onClose }: { onClose: () => void }) {
  const { toggleCompare, inCompare } = useStore();
  const [text, setText] = useState("");
  const [q, setQ] = useState("sneakers");
  const { data, loading } = useSearch(q, "relevance", 12);

  useEffect(() => {
    const t = setTimeout(() => text.trim().length > 1 && setQ(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-ink/40 px-4 pt-[10vh] backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto max-w-3xl overflow-hidden rounded-[32px] bg-paper"
      >
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Search className="size-5 text-muted" />
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Find a shoe to add…" className="flex-1 bg-transparent text-lg outline-none" />
          {loading && <span className="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />}
          <button onClick={onClose} aria-label="Close"><X className="size-5" /></button>
        </div>
        <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto p-4 md:grid-cols-3">
          {data?.products.map((p) => {
            const on = inCompare(p.key);
            return (
              <button key={p.key} onClick={() => toggleCompare(toSaved(p))} className={clsx("rounded-2xl bg-white p-2 text-left ring-2 transition", on ? "ring-ink" : "ring-transparent hover:ring-line")}>
                <ShoeImg src={p.image} alt={p.title} className="aspect-square rounded-xl" />
                <p className="mt-2 line-clamp-1 text-sm font-semibold">{p.title}</p>
                <p className="text-xs text-muted">from {money(p.bestPrice, p.currency)} {on && "· added ✓"}</p>
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

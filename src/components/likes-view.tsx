"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X } from "lucide-react";
import { money, shoeHref } from "@/lib/client";
import { useStore } from "./providers";
import { EASE, MaskText, ShoeImg } from "./ui";

export function LikesView() {
  const { likes, toggleLike } = useStore();
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-10">
      <h1 className="mb-10 text-5xl font-black leading-[0.9] tracking-tight md:text-8xl">
        <MaskText text="Your liked pairs" />
      </h1>
      {likes.length === 0 ? (
        <div className="rounded-[36px] border border-dashed border-line p-14 text-center">
          <Heart className="mx-auto mb-4 size-10 text-accent" />
          <p className="text-2xl font-bold">No likes yet</p>
          <p className="mt-2 text-muted">Tap the heart on any shoe to save it here.</p>
          <Link href="/shoes" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 font-semibold text-paper">Browse shoes</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <AnimatePresence>
            {likes.map((s, i) => (
              <motion.div
                key={s.key}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
                className="group relative rounded-[28px] bg-white p-3"
              >
                <Link href={shoeHref(s)}>
                  <ShoeImg src={s.image} alt={s.title} className="aspect-square rounded-[22px] bg-paper transition duration-700 group-hover:scale-[1.03]" />
                  <p className="mt-3 px-1 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">{s.brand}</p>
                  <p className="line-clamp-2 px-1 font-semibold">{s.title}</p>
                  <p className="px-1 pt-2 text-sm">Last seen from <b>{money(s.bestPrice, s.currency ?? "INR")}</b></p>
                </Link>
                <button onClick={() => toggleLike(s)} className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-white shadow" aria-label="Remove">
                  <X className="size-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

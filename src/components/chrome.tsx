"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Mail, Phone, X } from "lucide-react";
import { useStore, MAX_COMPARE } from "./providers";
import { EASE, Flag, ShoeImg } from "./ui";
import { Logo } from "./navbar";
import { REGIONS, REGION_IDS, storesIn } from "@/lib/stores";
import { CONTACT, COPYRIGHT_SINCE, SITE_NAME, landingPath } from "@/lib/site";

export function CompareTray() {
  const { compare, removeCompare } = useStore();
  const path = usePathname();
  const show = compare.length > 0 && path !== "/compare";
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-3"
        >
          <div className="flex items-center gap-2 rounded-full bg-ink p-2 pl-4 text-paper shadow-2xl">
            <span className="hidden text-sm font-semibold sm:inline">Compare</span>
            <div className="flex gap-1.5">
              <AnimatePresence>
                {compare.map((c) => (
                  <motion.div key={c.key} layout initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="group relative">
                    <ShoeImg src={c.image} alt={c.title} className="size-11 rounded-full bg-white" />
                    <button
                      onClick={() => removeCompare(c.key)}
                      className="absolute -right-1 -top-1 hidden size-5 place-items-center rounded-full bg-accent group-hover:grid"
                      aria-label={`Remove ${c.title}`}
                    >
                      <X className="size-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {Array.from({ length: MAX_COMPARE - compare.length }).map((_, i) => (
                <div key={i} className="size-11 rounded-full border border-dashed border-white/25" />
              ))}
            </div>
            <Link href="/compare" className="ml-1 flex items-center gap-2 rounded-full bg-lime px-4 py-3 text-sm font-bold text-ink transition hover:bg-white">
              Compare {compare.length} <ArrowRight className="size-4" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toast() {
  const { toast } = useStore();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          className="fixed left-1/2 top-24 z-[80] rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper shadow-xl"
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-7xl px-5 pb-28 pt-16 md:px-10">
      <div className="grid gap-10 border-t border-line pt-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted">
            shoesGPT compares shoe prices across stores in {REGION_IDS.length} countries and sends you to the cheapest one, with live
            football scores and the boots the stars wear. We don’t sell shoes; prices and stock are set by each store and can change at
            any time.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted">Explore</p>
          <ul className="space-y-2 text-sm font-medium">
            <li><Link href="/football" className="hover:text-accent">Live football scores</Link></li>
            <li><Link href="/football/boots" className="hover:text-accent">Players’ boots</Link></li>
            <li><Link href="/shoes" className="hover:text-accent">All shoes</Link></li>
            <li><Link href="/#deals" className="hover:text-accent">Deals</Link></li>
            <li><Link href="/compare" className="hover:text-accent">Compare</Link></li>
            <li><Link href="/likes" className="hover:text-accent">Liked shoes</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted">
            {REGION_IDS.length} countries · {REGION_IDS.reduce((n, r) => n + storesIn(r).length, 0)}+ stores
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {REGION_IDS.map((r) => (
              <li key={r}>
                <Link href={landingPath({ region: r, kind: "sports", slug: "running" })} className="hover:text-accent">
                  <Flag region={r} className="mr-1.5" />
                  {REGIONS[r].name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted">Contact</p>
          <ul className="space-y-3 text-sm">
            <li>
              <a href={`mailto:${CONTACT.email}`} className="group flex items-center gap-2 font-medium hover:text-accent">
                <span className="grid size-8 place-items-center rounded-full bg-white transition group-hover:bg-accent group-hover:text-white">
                  <Mail className="size-4" />
                </span>
                {CONTACT.email}
              </a>
            </li>
            <li>
              <a href={`tel:${CONTACT.phone.replace(/s+/g, "")}`} className="group flex items-center gap-2 font-medium hover:text-accent">
                <span className="grid size-8 place-items-center rounded-full bg-white transition group-hover:bg-accent group-hover:text-white">
                  <Phone className="size-4" />
                </span>
                {CONTACT.phone}
              </a>
            </li>
          </ul>
          {CONTACT.socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {CONTACT.socials.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="mt-16 select-none text-center text-[clamp(4rem,17vw,15rem)] font-black leading-none tracking-[-0.06em] text-ink/[0.06]">
        shoesGPT
      </p>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-xs text-muted md:flex-row">
        <p>© {COPYRIGHT_SINCE} {SITE_NAME}. All rights reserved.</p>
        <p className="text-center md:text-right">
          Brand names and logos belong to their owners. Prices and links come from the stores shown.
        </p>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Heart, Menu, Scale, Search, X, ArrowUpRight, ChevronDown, Check } from "lucide-react";
import clsx from "clsx";
import { useRegion, useStore } from "./providers";
import { LiveTicker } from "./football/ticker";
import type { Match } from "@/lib/football/types";
import { EASE, Flag, ShoeImg, Sparkle } from "./ui";
import { money, shoeHref, useSearch } from "@/lib/client";
import { REGIONS, REGION_IDS, liveStoresIn } from "@/lib/stores";
import type { Region } from "@/lib/types";

const LINKS = [
  { href: "/football", label: "Live scores" },
  { href: "/shoes", label: "Explore" },
  { href: "/#sports", label: "Sports" },
  { href: "/#deals", label: "Deals" },
  { href: "/#brands", label: "Brands" },
  { href: "/compare", label: "Compare" },
];

export function Logo() {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-1.5 text-lg tracking-tight sm:text-xl">
      <Sparkle className="size-4 text-accent transition-transform duration-700 group-hover:rotate-180" />
      <span className="font-medium">shoes</span>
      <span className="-ml-1 font-black">GPT</span>
    </Link>
  );
}

/** `matches`: today's matches from the server, so the score bar is in the page HTML from the start. */
export function Navbar({ matches }: { matches?: Match[] }) {
  const { compare, likes } = useStore();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 300);
    setScrolled(y > 20);
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[56]">
        <LiveTicker initial={matches} />
      </div>
      <motion.header
        animate={{ y: hidden && !menu ? "-110%" : 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="fixed inset-x-0 top-10 z-50 px-3 pt-3 md:px-6"
      >
        <nav
          className={clsx(
            "mx-auto flex max-w-7xl items-center justify-between gap-2 rounded-full px-3 py-2.5 sm:px-4 transition-all duration-500 md:px-6",
            scrolled ? "border border-line/70 bg-paper/75 shadow-[0_8px_30px_-12px_rgba(0,0,0,.15)] backdrop-blur-xl" : "bg-transparent",
          )}
        >
          <Logo />

          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group relative block px-4 py-2 text-sm font-medium">
                  <span className="relative z-10">{l.label}</span>
                  <span className="absolute inset-0 scale-75 rounded-full bg-ink/5 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <RegionSwitch />
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-full border border-line bg-white/60 p-2.5 text-sm text-muted md:py-2 md:pl-3 md:pr-2 transition hover:border-ink/30"
              aria-label="Search shoes"
            >
              <Search className="size-4" />
              <span className="hidden md:inline">Search shoes</span>
              <kbd className="hidden rounded-md bg-paper-2 px-1.5 py-0.5 font-mono text-[10px] md:inline">Ctrl K</kbd>
            </button>
            <Link href="/likes" className="relative hidden size-10 place-items-center sm:grid rounded-full transition hover:bg-ink/5" aria-label="Liked shoes">
              <Heart className="size-[18px]" />
              <Count n={likes.length} />
            </Link>
            <Link
              href="/compare"
              className="relative flex items-center gap-2 rounded-full bg-ink py-2 pl-2.5 pr-2.5 sm:pl-3 sm:pr-4 text-sm font-semibold text-paper transition hover:bg-accent"
            >
              <Scale className="size-4" />
              <span className="hidden sm:inline">Compare</span>
              <motion.span
                key={compare.length}
                initial={{ scale: 1.6 }}
                animate={{ scale: 1 }}
                className="grid size-5 place-items-center rounded-full bg-lime text-[11px] font-bold text-ink"
              >
                {compare.length}
              </motion.span>
            </Link>
            <button className="grid size-9 place-items-center rounded-full sm:size-10 lg:hidden" onClick={() => setMenu((m) => !m)} aria-label="Menu">
              {menu ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {menu && (
            <motion.ul
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-auto mt-2 max-w-7xl rounded-3xl border border-line bg-paper/95 p-3 backdrop-blur-xl lg:hidden"
            >
              {[...LINKS, { href: "/likes", label: "Liked shoes" }].map((l, i) => (
                <motion.li key={l.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={l.href} onClick={() => setMenu(false)} className="block rounded-2xl px-4 py-3 text-2xl font-bold hover:bg-ink/5">
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </motion.header>

      <AnimatePresence>{searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}</AnimatePresence>
    </>
  );
}

function Count({ n }: { n: number }) {
  if (!n) return null;
  return (
    <motion.span
      key={n}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-white"
    >
      {n}
    </motion.span>
  );
}

const SUGGESTIONS: Partial<Record<Region, string[]>> = {
  in: ["Nike Air Jordan", "Adidas Samba", "Puma running", "Red Tape sneakers", "Bacca Bucci", "Skechers Go Walk", "ASICS Gel", "Campus"],
  us: ["Nike Pegasus", "Hoka Clifton", "New Balance 990", "On Cloud", "Brooks Ghost", "Adidas Samba", "Converse Chuck 70", "Vans Old Skool"],
  de: ["Adidas Samba", "Puma Suede", "Birkenstock", "Nike Air Max", "New Balance 530", "Salomon XT-6", "On Cloudmonster", "Onitsuka Tiger"],
};

const DEFAULT_SUGGESTIONS = ["Nike Air Max", "Adidas Samba", "New Balance 530", "ASICS Gel", "Hoka Clifton", "Converse Chuck", "Puma Suede", "On Cloud"];

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, loading } = useSearch(q.length > 1 ? q : null, "relevance", 6);
  const { region } = useRegion();

  useEffect(() => {
    inputRef.current?.focus();
    const t = setTimeout(() => setQ(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-ink/40 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.35, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-paper shadow-2xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) go(`/shoes?q=${encodeURIComponent(text.trim())}`);
          }}
          className="flex items-center gap-3 border-b border-line px-5 py-4"
        >
          <Search className="size-5 text-muted" />
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search any shoe, brand or sport…"
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted"
          />
          {loading && <span className="size-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />}
          <button type="button" onClick={onClose} className="rounded-md bg-paper-2 px-2 py-1 font-mono text-[10px]">
            ESC
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {!q && (
            <div className="flex flex-wrap gap-2 p-2">
              {(SUGGESTIONS[region] ?? DEFAULT_SUGGESTIONS).map((s) => (
                <button key={s} onClick={() => setText(s)} className="rounded-full border border-line px-3 py-1.5 text-sm hover:border-ink">
                  {s}
                </button>
              ))}
            </div>
          )}
          {data?.products.map((p, i) => (
            <motion.button
              key={p.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => go(shoeHref(p))}
              className="group flex w-full items-center gap-4 rounded-2xl p-2 text-left hover:bg-white"
            >
              <ShoeImg src={p.image} alt={p.title} className="size-16 shrink-0 rounded-xl bg-white" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{p.brand}</p>
                <p className="truncate font-semibold">{p.title}</p>
                <p className="text-xs text-muted">
                  {p.offers.length} store{p.offers.length > 1 ? "s" : ""} · from <b className="text-ink">{money(p.bestPrice, p.currency)}</b>
                </p>
              </div>
              <ArrowUpRight className="size-5 opacity-0 transition group-hover:opacity-100" />
            </motion.button>
          ))}
          {q && data && !data.products.length && <p className="p-6 text-center text-muted">No live results for “{q}”.</p>}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Country picker: changes which stores we search and the currency shown. */
function RegionSwitch() {
  const { region, setRegion, info } = useRegion();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-line bg-white/60 px-2.5 py-2 text-sm font-semibold sm:px-3 transition hover:border-ink/30"
        aria-label="Choose country"
      >
        <Flag region={region} className="text-base" />
        <span className="hidden sm:inline">{info.currency}</span>
        <ChevronDown className={clsx("size-3.5 transition", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="absolute right-0 top-full mt-2 max-h-[70vh] w-72 origin-top-right overflow-y-auto rounded-2xl border border-line bg-paper p-1.5 shadow-xl"
          >
            {REGION_IDS.map((r) => {
              const ri = REGIONS[r];
              return (
                <li key={r}>
                  <button
                    onClick={() => {
                      setRegion(r);
                      setOpen(false);
                    }}
                    className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white", r === region && "bg-white")}
                  >
                    <Flag region={r} className="text-2xl" />
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{ri.name}</span>
                      <span className="block text-[11px] text-muted">
                        {ri.currency} · {liveStoresIn(r).map((s) => s.name).join(", ")}
                      </span>
                    </span>
                    {r === region && <Check className="size-4 text-accent" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

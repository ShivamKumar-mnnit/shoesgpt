"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Lenis from "lenis";
import type { SavedShoe } from "@/lib/client";
import type { Region } from "@/lib/types";
import { isRegion, REGIONS } from "@/lib/stores";

export const MAX_COMPARE = 4;

interface Store {
  compare: SavedShoe[];
  toggleCompare: (s: SavedShoe) => void;
  removeCompare: (key: string) => void;
  clearCompare: () => void;
  inCompare: (key: string) => boolean;
  likes: SavedShoe[];
  toggleLike: (s: SavedShoe) => void;
  isLiked: (key: string) => boolean;
  toast: string | null;
  region: Region;
  setRegion: (r: Region) => void;
}

const Ctx = createContext<Store | null>(null);

export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be inside <Providers>");
  return s;
};

/* A list saved in localStorage, kept in sync across components and browser tabs. */
const EMPTY: SavedShoe[] = [];
const parsed = new Map<string, { raw: string | null; value: SavedShoe[] }>();
const listeners = new Set<() => void>();

function read(key: string): SavedShoe[] {
  const raw = localStorage.getItem(key);
  const hit = parsed.get(key);
  if (hit && hit.raw === raw) return hit.value; // same reference while unchanged
  let value = EMPTY;
  try {
    value = raw ? JSON.parse(raw) : EMPTY;
  } catch {}
  parsed.set(key, { raw, value });
  return value;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function usePersisted(key: string) {
  const value = useSyncExternalStore(subscribe, () => read(key), () => EMPTY);
  const save = (fn: (v: SavedShoe[]) => SavedShoe[]) => {
    localStorage.setItem(key, JSON.stringify(fn(read(key))));
    listeners.forEach((l) => l());
  };
  return [value, save] as const;
}

/* The shopper's country, remembered in the browser. First visit: guessed from timezone/language. */
const REGION_KEY = "shoesgpt:region";

function detectRegion(): Region {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const lang = navigator.language?.toLowerCase() ?? "";
  const byZone: [RegExp, Region][] = [
    [/^Asia\/(Kolkata|Calcutta)/, "in"],
    [/^Europe\/London/, "uk"],
    [/^Europe\/(Berlin|Vienna|Zurich)/, "de"],
    [/^Europe\/(Paris|Brussels|Luxembourg|Monaco)/, "fr"],
    [/^Europe\/(Rome|Vatican|San_Marino)/, "it"],
    [/^(Europe\/Madrid|Atlantic\/Canary)/, "es"],
    [/^Europe\/Amsterdam/, "nl"],
    [/^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina)/, "ca"],
    [/^America\/(Mexico_City|Cancun|Monterrey|Tijuana|Merida|Chihuahua)/, "mx"],
    [/^Australia\//, "au"],
    [/^Asia\/Tokyo/, "jp"],
    [/^Asia\/Dubai/, "ae"],
    [/^Asia\/Singapore/, "sg"],
    [/^America\//, "us"],
    [/^Europe\//, "de"],
  ];
  const hit = byZone.find(([re]) => re.test(tz));
  if (hit) return hit[1];
  if (lang.endsWith("-in")) return "in";
  return "us";
}

function readRegion(): Region {
  const saved = localStorage.getItem(REGION_KEY);
  return isRegion(saved) ? saved : detectRegion();
}

/** Country pages (/us/brands/nike) switch the shopper's country to match, without a toast. */
export function SyncRegion({ region }: { region: Region }) {
  useEffect(() => {
    if (localStorage.getItem(REGION_KEY) !== region) {
      localStorage.setItem(REGION_KEY, region);
      listeners.forEach((l) => l());
    }
  }, [region]);
  return null;
}

export const useRegion = () => {
  const { region, setRegion } = useStore();
  return { region, setRegion, info: REGIONS[region] };
};

export function Providers({ children }: { children: ReactNode }) {
  const [compare, setCompare] = usePersisted("shoesgpt:compare");
  const [likes, setLikes] = usePersisted("shoesgpt:likes");
  const [toast, setToast] = useState<string | null>(null);
  const region = useSyncExternalStore(subscribe, readRegion, () => "in" as Region);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // A shared link like /?region=us switches the country.
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get("region");
    if (isRegion(r) && localStorage.getItem(REGION_KEY) !== r) {
      localStorage.setItem(REGION_KEY, r);
      listeners.forEach((l) => l());
    }
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let id = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      id = requestAnimationFrame(raf);
    };
    id = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);

  const store: Store = {
    region,
    setRegion: (r) => {
      localStorage.setItem(REGION_KEY, r);
      listeners.forEach((l) => l());
      setToast(`Showing prices for ${REGIONS[r].name} (${REGIONS[r].currency})`);
    },
    compare,
    likes,
    toast,
    inCompare: (k) => compare.some((c) => c.key === k),
    isLiked: (k) => likes.some((c) => c.key === k),
    toggleCompare: (s) => {
      if (compare.some((c) => c.key === s.key)) {
        setCompare((v) => v.filter((c) => c.key !== s.key));
      } else if (compare.length >= MAX_COMPARE) {
        setToast(`You can compare up to ${MAX_COMPARE} shoes`);
      } else {
        setCompare((v) => [...v, s]);
        setToast("Added to compare");
      }
    },
    removeCompare: (k) => setCompare((v) => v.filter((c) => c.key !== k)),
    clearCompare: () => setCompare(() => []),
    toggleLike: (s) => setLikes((v) => (v.some((c) => c.key === s.key) ? v.filter((c) => c.key !== s.key) : [s, ...v])),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

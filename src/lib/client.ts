"use client";

import { useEffect, useState, useCallback } from "react";
import type { CompareResponse, ProductGroup, Region, SearchResponse, SortKey } from "./types";
import { useRegion } from "@/components/providers";

import { money } from "./format";
export { money };

export const compact = (n: number) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);

/** Link to the shoe's price-comparison page (keeps the country the shoe was found in). */
export const shoeHref = (p: { title: string; brand: string; region?: Region }) => {
  const region = p.region;
  return `/shoe?title=${encodeURIComponent(p.title)}&brand=${encodeURIComponent(p.brand)}${region ? `&region=${region}` : ""}`;
};

type State<T> = { key: string | null; data: T | null; error: string | null };

function useJson<T>(url: string | null, initial?: T | null) {
  const [nonce, setNonce] = useState(0);
  const key = url ? `${url}#${nonce}` : null;
  // Results are tagged with the request they belong to, so "loading" is simply
  // "the latest result isn't for the current request yet". Old data stays visible meanwhile.
  // Server-rendered pages pass `initial` so the first paint already has the data.
  const [state, setState] = useState<State<T>>({ key: initial && key ? key : null, data: initial ?? null, error: null });

  const have = state.key;
  useEffect(() => {
    if (!url || !key || have === key) return; // already have this result (e.g. from the server)
    const ctrl = new AbortController();
    fetch(url, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `HTTP ${r.status}`);
        return r.json() as Promise<T>;
      })
      .then((data) => setState({ key, data, error: null }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState({ key, data: null, error: e.message });
      });
    return () => ctrl.abort();
  }, [url, key, have]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const loading = !!key && state.key !== key;
  // When the query changes, don't show the previous query's results as if they were current.
  const sameUrl = !!state.key && !!url && state.key.startsWith(`${url}#`);
  return { data: sameUrl ? state.data : null, error: loading ? null : state.error, loading, reload };
}

export function useSearch(q: string | null, sort: SortKey = "relevance", limit = 12) {
  const { region } = useRegion();
  const url = q ? `/api/search?q=${encodeURIComponent(q)}&region=${region}&sort=${sort}&limit=${limit}` : null;
  return useJson<SearchResponse>(url);
}

export function useCompare(p: { title: string; brand: string; region: Region } | null, initial?: CompareResponse | null) {
  const url = p
    ? `/api/compare?title=${encodeURIComponent(p.title)}&brand=${encodeURIComponent(p.brand)}&region=${p.region}`
    : null;
  return useJson<CompareResponse>(url, initial);
}

export type SavedShoe = Pick<ProductGroup, "key" | "title" | "brand" | "image" | "bestPrice" | "currency" | "region">;

export const toSaved = (p: ProductGroup): SavedShoe => ({
  key: p.key,
  title: p.title,
  brand: p.brand,
  image: p.image,
  bestPrice: p.bestPrice,
  currency: p.currency,
  region: p.region,
});

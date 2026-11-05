import type { CompareResponse, LinkOnlyStore, Listing, ProductGroup, Region, SearchResponse, SortKey, SourceStatus, StoreId } from "../types";
import { STORES, liveStoresIn, storesIn } from "../stores";
import { ADAPTERS } from "./adapters";
import { genderFits, groupListings, isFootwear, linkQueryFor, modelTokens, normBrand, queryFor, similarity, SAME_SHOE, toGroup } from "../match";

/** Longest we wait for any one store before showing results without it. */
const STORE_BUDGET_MS = 8_000; // stays under serverless time limits (e.g. Netlify Functions)

/* Small in-memory cache so repeated views don't hit the stores again. */
const TTL = 10 * 60 * 1000;
const cache = new Map<string, { at: number; data: Promise<Listing[]> }>();

function cached(store: StoreId, q: string): Promise<Listing[]> {
  const key = `${store}|${q.toLowerCase().trim()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const data = ADAPTERS[store](q);
  cache.set(key, { at: Date.now(), data });
  // Don't cache failures or empty answers (often a temporary block), so the next visit tries again.
  data.then((l) => !l.length && cache.delete(key)).catch(() => cache.delete(key));
  if (cache.size > 800) cache.delete(cache.keys().next().value!);
  return data;
}

/** Official brand stores (Nike, Skechers…) are only searched when the query is about their brand, or names no brand. */
function storesFor(q: string, region: Region): StoreId[] {
  const lq = q.toLowerCase();
  const live = liveStoresIn(region).filter((s) => ADAPTERS[s.id]);
  const brands = [...new Set(storesIn(region).map((s) => s.brand).filter(Boolean))] as string[];
  const mentioned = brands.filter((b) => lq.includes(b));
  return live.filter((s) => !s.brand || mentioned.length === 0 || mentioned.includes(s.brand)).map((s) => s.id);
}

async function fetchAll(q: string, region: Region, only?: StoreId[]) {
  const ids = (only?.length ? only.filter((id) => STORES[id]?.region === region) : storesFor(q, region)).filter((id) => ADAPTERS[id]);
  const sources: SourceStatus[] = [];
  const results = await Promise.all(
    ids.map(async (store) => {
      const t = Date.now();
      try {
        // A slow store never holds up the page: after the budget it's reported as not answering.
        const listings = await Promise.race([
          cached(store, q),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timed out")), STORE_BUDGET_MS)),
        ]);
        sources.push({ store, ok: true, count: listings.length, ms: Date.now() - t });
        return listings;
      } catch (e) {
        sources.push({ store, ok: false, count: 0, ms: Date.now() - t, error: (e as Error).message });
        return [];
      }
    }),
  );
  return { listings: results.flat().filter((l) => l.price > 0 && isFootwear(l)), sources };
}

/** Rating weighted by how many people rated, so 5.0 from 2 people doesn't win. */
function score(p: { rating?: number; ratingCount?: number }) {
  if (!p.rating) return 0;
  const n = p.ratingCount ?? 0;
  return (p.rating * n + 3.5 * 20) / (n + 20);
}

export async function search(q: string, region: Region, sort: SortKey = "relevance", limit = 24, stores?: StoreId[]): Promise<SearchResponse> {
  const { listings, sources } = await fetchAll(q, region, stores);

  // Stores pad results with unrelated items; keep products that share at least
  // half the meaningful words of the query (generic queries like "running shoes" keep everything).
  const qTokens = modelTokens(q);
  const match = (p: { title: string; brand: string }) => {
    if (!qTokens.length) return 1;
    const words = new Set(modelTokens(`${p.brand} ${p.title}`));
    return qTokens.filter((t) => words.has(t)).length / qTokens.length;
  };

  const by: Record<SortKey, (a: ProductGroup, b: ProductGroup) => number> = {
    // Best query match first, then shoes sold on more stores: they're the most useful to compare.
    relevance: (a, b) => match(b) - match(a) || b.offers.length - a.offers.length,
    popular: (a, b) => (b.ratingCount ?? 0) - (a.ratingCount ?? 0),
    price_asc: (a, b) => a.bestPrice - b.bestPrice,
    price_desc: (a, b) => b.bestPrice - a.bestPrice,
    discount: (a, b) => b.discount - a.discount,
    rating: (a, b) => score(b) - score(a),
  };
  const products = groupListings(listings)
    .filter((p) => p.image && match(p) >= 0.5)
    .sort(by[sort]);
  return { query: q, region, fetchedAt: new Date().toISOString(), products: products.slice(0, limit), sources };
}

/** Find one shoe on every store in the region and return its offers cheapest first. */
export async function compare(title: string, brand: string, region: Region): Promise<CompareResponse> {
  const q = queryFor(title, brand);
  const { listings, sources } = await fetchAll(q, region);
  const ref = { title, brand };
  // Best matches first, then drop any whose gender clashes with a better match
  // (a title without "men"/"women" could otherwise pull in both versions).
  const matches = listings
    .map((l) => ({ l, s: similarity(ref, l) }))
    .filter((x) => x.s >= SAME_SHOE)
    .sort((x, y) => y.s - x.s)
    .reduce<Listing[]>((kept, { l }) => (genderFits(l, kept) ? [...kept, l] : kept), []);
  // Name the result after the closest match to the shoe the shopper clicked.
  const product = matches.length ? toGroup(matches, matches[0]) : null;
  const rest = listings.filter((l) => !matches.includes(l) && normBrand(l.brand) === normBrand(brand));
  const similar = groupListings(rest)
    .filter((g) => g.image)
    .slice(0, 8);

  // Stores where we didn't find a live price: link to their search with a short query.
  const nb = normBrand(brand);
  const found = new Set(product?.offers.map((o) => o.store));
  const lq = linkQueryFor(title, brand);
  const checkAlso: LinkOnlyStore[] = storesIn(region)
    .filter((s) => !found.has(s.id))
    .filter((s) => !s.brand || normBrand(s.brand) === nb)
    .map((s) => ({ store: s.id, name: s.name, url: s.search(lq) }));

  return { query: q, region, fetchedAt: new Date().toISOString(), product, similar, checkAlso, sources };
}

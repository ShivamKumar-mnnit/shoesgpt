import type { Currency, Listing, StoreId } from "../types";
import { ALL_STORES, REGIONS, STORES } from "../stores";

/**
 * Store adapters: each one takes a search query and returns live listings
 * (title, price, list price, images, direct product link) read from the store's
 * own search page.
 *
 * Reading public search pages is fragile: it breaks when a store changes its
 * markup or starts blocking the server. For production, move these to official
 * feeds (Flipkart Affiliate API, Amazon Creators API / PA-API, Walmart Affiliate
 * API, Awin/Rakuten/CJ feeds for Zalando, Zappos, Nike…) behind the same signature.
 */
export type Adapter = (q: string) => Promise<Listing[]>;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

async function getHtml(url: string, extra: Record<string, string> = {}): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
      ...extra,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(9_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const https = (u: string) => u.replace(/^(http:)?\/\//, "https://");
const pct = (price: number, mrp: number) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
const titleCase = (s: string) => s.toLowerCase().replace(/(^|[\s-])[a-z]/g, (c) => c.toUpperCase());
const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

/** "₹1,209.00", "$101.50", "€91.56", "91,56 €" → number */
export function parsePrice(text: string | undefined | null): number {
  if (!text) return 0;
  let t = text.replace(/[^\d.,]/g, "");
  if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, "").replace(",", "."); // German style 1.234,56
  else t = t.replace(/,/g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

function extractJson(html: string, re: RegExp): unknown {
  const m = html.match(re);
  if (!m) throw new Error("product data not found");
  return JSON.parse(m[1]);
}

type ListingInput = Omit<Listing, "id" | "store" | "currency" | "discount" | "images"> & { images?: string[] };

function listing(store: StoreId, pid: string, currency: Currency, l: ListingInput): Listing {
  const images = [...new Set([l.image, ...(l.images ?? [])].filter((s): s is string => !!s))];
  const mrp = Math.max(l.mrp || 0, l.price);
  return {
    ...l,
    id: `${store}:${pid}`,
    store,
    currency,
    mrp,
    discount: pct(l.price, mrp),
    image: images[0] ?? null,
    images: images.slice(0, 6),
  };
}

/* ======================= India ======================= */

interface MyntraProduct {
  productId: number;
  productName: string;
  brand: string;
  price: number;
  mrp: number;
  searchImage?: string;
  images?: { src?: string }[];
  landingPageUrl: string;
  rating?: number;
  ratingCount?: number;
  masterCategory?: { typeName?: string };
}

const myntraImg = (src: string) =>
  https(src).replace("assets.myntassets.com/assets/", "assets.myntassets.com/w_600,q_85,c_limit,fl_progressive/assets/");

const myntra: Adapter = async (q) => {
  const html = await getHtml(STORES.myntra.search(q));
  const data = extractJson(html, /window\.__myx = (\{[\s\S]*?\})<\/script>/) as {
    searchData?: { results?: { products?: MyntraProduct[] } };
  };
  return (data.searchData?.results?.products ?? []).map((p) =>
    listing("myntra", String(p.productId), "INR", {
      title: p.productName,
      brand: p.brand,
      price: p.price,
      mrp: p.mrp,
      image: p.searchImage ? myntraImg(p.searchImage) : null,
      images: (p.images ?? []).map((i) => i.src).filter((s): s is string => !!s).map(myntraImg),
      url: `https://www.myntra.com/${p.landingPageUrl}`,
      rating: p.rating ? Math.round(p.rating * 10) / 10 : undefined,
      ratingCount: p.ratingCount || undefined,
      category: p.masterCategory?.typeName,
    }),
  );
};

interface FlipkartValue {
  id: string;
  baseUrl: string;
  titles?: { title?: string; superTitle?: string; newTitle?: string };
  pricing?: { prices?: { value: number; strikeOff?: boolean }[] };
  media?: { images?: { url: string }[] };
}

const flipkartImg = (u: string) =>
  https(u).replace("{@width}", "600").replace("{@height}", "600").replace("{@quality}", "85");

function collectFlipkart(node: unknown, out: FlipkartValue[], depth = 0) {
  if (!node || typeof node !== "object" || depth > 12) return;
  if (Array.isArray(node)) {
    for (const n of node) collectFlipkart(n, out, depth + 1);
    return;
  }
  const obj = node as Record<string, unknown>;
  const info = obj.productInfo as { value?: FlipkartValue } | undefined;
  if (info?.value?.id && info.value.pricing) {
    out.push(info.value);
    return;
  }
  for (const v of Object.values(obj)) collectFlipkart(v, out, depth + 1);
}

const flipkart: Adapter = async (q) => {
  const html = await getHtml(STORES.flipkart.search(q));
  const state = extractJson(html, /window\.__INITIAL_STATE__ = (\{[\s\S]*?\});<\/script>/) as {
    pageDataV4?: { page?: { data?: unknown } };
  };
  const values: FlipkartValue[] = [];
  collectFlipkart(state.pageDataV4?.page?.data, values);
  const out: Listing[] = [];
  for (const v of values) {
    const prices = v.pricing?.prices ?? [];
    const selling = prices.filter((p) => !p.strikeOff).map((p) => p.value);
    if (!selling.length) continue;
    const price = Math.min(...selling);
    const brand = v.titles?.superTitle ?? "";
    out.push(
      listing("flipkart", v.id, "INR", {
        title: v.titles?.title ?? `${brand} ${v.titles?.newTitle ?? ""}`.trim(),
        brand: titleCase(brand),
        price,
        mrp: Math.max(price, ...prices.filter((p) => p.strikeOff).map((p) => p.value)),
        image: null,
        images: (v.media?.images ?? []).map((i) => flipkartImg(i.url)),
        url: `https://www.flipkart.com${v.baseUrl}`,
      }),
    );
  }
  return out;
};

interface AjioEntity {
  code: string;
  name: string;
  url: string;
  fnlColorVariantData?: { brandName?: string };
  price?: { value?: number };
  wasPriceData?: { value?: number };
  images?: { url?: string; format?: string }[];
  averageRating?: number;
  ratingCount?: string;
  brickNameText?: string;
  verticalNameText?: string;
}

const ajio: Adapter = async (q) => {
  const html = await getHtml(STORES.ajio.search(q));
  const state = extractJson(html, /window\.__PRELOADED_STATE__ = (\{[\s\S]*?\});?\s*<\/script>/) as {
    grid?: { entities?: Record<string, AjioEntity> };
  };
  return Object.values(state.grid?.entities ?? {})
    .filter((e) => e.price?.value && e.url)
    .map((e) => {
      const brand = titleCase(e.fnlColorVariantData?.brandName ?? "");
      return listing("ajio", e.code, "INR", {
        title: `${brand} ${e.name}`,
        brand,
        price: e.price!.value!,
        mrp: e.wasPriceData?.value ?? 0,
        image: null,
        images: (e.images ?? []).filter((i) => i.url && i.format !== "thumbnail").map((i) => https(i.url!)),
        url: `https://www.ajio.com${e.url}`,
        rating: e.averageRating || undefined,
        ratingCount: Number(e.ratingCount) || undefined,
        category: e.brickNameText || e.verticalNameText,
      });
    });
};

const skechersIn: Adapter = async (q) => {
  const html = await getHtml(STORES.skechers_in.search(q));
  const out: Listing[] = [];
  for (const t of html.split('class="product-tile"').slice(1)) {
    const url = t.match(/href="(https:\/\/www\.skechers\.in\/[^"]+\.html)"/)?.[1];
    const name = t.match(/class="product-tile-product-name[^"]*">([^<]+)</)?.[1]?.trim();
    const images = [...t.matchAll(/data-src="(https:\/\/images\.skechers\.com\/[^"]+)"/g)].map((m) => m[1]);
    const prices = [...t.matchAll(/class="value[^"]*" content="([0-9.]+)"/g)].map((m) => Math.round(Number(m[1])));
    if (!url || !name || !prices.length) continue;
    out.push(
      listing("skechers_in", url.match(/\/([^/]+)\.html$/)?.[1] ?? url, "INR", {
        title: `Skechers ${titleCase(name)}`,
        brand: "Skechers",
        price: Math.min(...prices),
        mrp: Math.max(...prices),
        image: null,
        images,
        url,
        category: "Footwear", // apparel is still caught by the title check
      }),
    );
  }
  return out;
};

/* ======================= Amazon (every country with an Amazon store) ======================= */

function amazon(store: StoreId, host: string, currency: Currency): Adapter {
  // Ask for local currency and, where Amazon offers it, English titles (helps matching across stores).
  const tld = host.split(".").pop();
  const headers = {
    "Accept-Language": "en-GB,en;q=0.9",
    Cookie: `i18n-prefs=${currency}; lc-acb${tld}=${tld === "jp" || tld === "mx" ? "en_US" : "en_GB"}`,
  };
  return async (q) => {
    // Amazon sometimes answers with a bot check instead of results; wait a moment and try once more.
    // (It can also answer "202 please wait" with an empty page, so retry whenever there are no results.)
    const RESULTS = 'data-component-type="s-search-result"';
    let html = await getHtml(STORES[store].search(q), headers);
    if (!html.includes(RESULTS)) {
      await new Promise((r) => setTimeout(r, 1000));
      html = await getHtml(STORES[store].search(q), headers);
      if (!html.includes(RESULTS)) throw new Error("no results (Amazon bot check)");
    }
    const parts = html.split('data-component-type="s-search-result"');
    const out: Listing[] = [];
    for (let i = 1; i < parts.length; i++) {
      // The ASIN sits on the same <div>, just before the marker we split on.
      const asin = parts[i - 1].slice(-800).match(/data-asin="([A-Z0-9]{10})"/g)?.pop()?.slice(11, 21);
      const b = parts[i].slice(0, 20000);
      if (!asin) continue;
      const h2s = (b.match(/<h2[\s\S]*?<\/h2>/g) ?? []).map((h) => decode(h.replace(/<[^>]+>/g, " "))).filter(Boolean);
      const name = h2s[h2s.length - 1];
      const brandLine = h2s.length > 1 ? h2s[0] : b.match(/class="a-size-base-plus a-color-base">([^<]+)</)?.[1];
      const price = parsePrice(b.match(/class="a-price"[^>]*>\s*<span class="a-offscreen">([^<]+)/)?.[1]);
      const mrp = parsePrice(b.match(/class="a-price a-text-price"[^>]*>\s*<span class="a-offscreen">([^<]+)/)?.[1]);
      const img = b.match(/<img class="s-image"[^>]*src="([^"]+)"/)?.[1];
      if (!name || !price || !img) continue;
      const brand = decode(brandLine ?? name.split(" ")[0]);
      out.push(
        listing(store, asin, currency, {
          title: name.toLowerCase().startsWith(brand.toLowerCase()) ? name : `${brand} ${name}`,
          brand,
          price,
          mrp,
          image: img.replace(/\._AC_[^.]+\./, "._AC_UL800_."),
          url: `https://${host}/dp/${asin}`,
          rating: Number(b.match(/aria-label="([0-9.]+) out of 5 stars/)?.[1]) || undefined,
          ratingCount: Number(b.match(/aria-label="([0-9,.]+) ratings"/)?.[1]?.replace(/[.,]/g, "")) || undefined,
        }),
      );
    }
    return out;
  };
}

/* ======================= United States ======================= */

interface ZapposItem {
  productId: string;
  styleId?: string;
  productName: string;
  brandName: string;
  price: string;
  originalPrice?: string;
  productUrl?: string;
  productSeoUrl?: string;
  imageMap?: Record<string, string>;
  msaImageId?: string;
  reviewRating?: number;
  reviewCount?: number;
  productType?: string;
  txAttrFacet_Gender?: string[];
}

/** Zappos and 6pm run on the same platform. */
function zapposFamily(store: StoreId, host: string): Adapter {
  return async (q) => {
    const html = await getHtml(STORES[store].search(q), { "Accept-Language": "en-US,en;q=0.9" });
    const state = extractJson(html, /window\.__INITIAL_STATE__ = (\{[\s\S]*?\});?\s*<\/script>/) as {
      products?: { list?: ZapposItem[] };
    };
    const img = (id: string) => `https://m.media-amazon.com/images/I/${id}._AC_SR800,800_.jpg`;
    return (state.products?.list ?? []).map((p) => {
      const ids = [p.imageMap?.MAIN ?? p.msaImageId, p.imageMap?.PAIR, p.imageMap?.RGHT, p.imageMap?.TOPP].filter((x): x is string => !!x);
      const gender = p.txAttrFacet_Gender?.length === 1 ? ` (${p.txAttrFacet_Gender[0]})` : "";
      return listing(store, p.styleId ?? p.productId, "USD", {
        title: `${p.brandName} ${p.productName}${gender}`,
        brand: p.brandName,
        price: parsePrice(p.price),
        mrp: parsePrice(p.originalPrice),
        image: null,
        images: ids.map(img),
        url: `https://${host}${p.productSeoUrl ?? p.productUrl ?? `/product/${p.productId}`}`,
        rating: p.reviewRating || undefined,
        ratingCount: p.reviewCount || undefined,
        category: p.productType,
      });
    });
  };
}

interface WalmartItem {
  __typename?: string;
  usItemId?: string;
  id?: string;
  name?: string;
  brand?: string;
  price?: number;
  image?: string;
  canonicalUrl?: string;
  averageRating?: number;
  numberOfReviews?: number;
  priceInfo?: { priceDetails?: { priceLines?: { lineType: string; values?: { key: string; value: string }[] }[] } };
}

const walmart: Adapter = async (q) => {
  const html = await getHtml(STORES.walmart.search(q), { "Accept-Language": "en-US,en;q=0.9" });
  const data = extractJson(html, /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/) as {
    props?: { pageProps?: { initialData?: { searchResult?: { itemStacks?: { items?: WalmartItem[] }[] } } } };
  };
  const items = (data.props?.pageProps?.initialData?.searchResult?.itemStacks ?? []).flatMap((s) => s.items ?? []);
  return items
    .filter((it) => it.__typename === "Product" && it.name && it.price && it.canonicalUrl)
    .map((it) => {
      const name = decode(it.name!);
      const was = it.priceInfo?.priceDetails?.priceLines?.find((l) => l.lineType === "COMPARISON")?.values?.[0]?.value;
      return listing("walmart", it.usItemId ?? it.id ?? name, "USD", {
        title: it.brand && !name.toLowerCase().startsWith(it.brand.toLowerCase()) ? `${it.brand} ${name}` : name,
        brand: it.brand ?? name.split(" ")[0],
        price: it.price!,
        mrp: parsePrice(was),
        image: it.image ? `${it.image.split("?")[0]}?odnHeight=600&odnWidth=600&odnBg=FFFFFF` : null,
        url: `https://www.walmart.com${it.canonicalUrl!.split("?")[0]}`,
        rating: it.averageRating || undefined,
        ratingCount: it.numberOfReviews || undefined,
      });
    });
};

/* ======================= Nike (US, Germany) ======================= */

interface NikeProduct {
  productCode: string;
  productType?: string;
  copy?: { title?: string; subTitle?: string };
  prices?: { currency?: string; currentPrice?: number; initialPrice?: number };
  pdpUrl?: { url?: string };
  colorwayImages?: { squarishURL?: string; portraitURL?: string };
}

function nike(store: StoreId, currency: Currency): Adapter {
  return async (q) => {
    const html = await getHtml(STORES[store].search(q), { "Accept-Language": "en-US,en;q=0.9" });
    const data = extractJson(html, /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/) as {
      props?: { pageProps?: { initialState?: { Wall?: { productGroupings?: { products?: NikeProduct[] }[] } } } };
    };
    const products = (data.props?.pageProps?.initialState?.Wall?.productGroupings ?? []).flatMap((g) => g.products ?? []);
    return products
      .filter((p) => p.prices?.currentPrice && p.pdpUrl?.url && p.prices.currency === currency)
      .map((p) => {
        const title = p.copy?.title ?? "";
        return listing(store, p.productCode, currency, {
          title: `${/^(nike|jordan)/i.test(title) ? "" : "Nike "}${title} ${p.copy?.subTitle ?? ""}`.trim(),
          brand: "Nike",
          price: p.prices!.currentPrice!,
          mrp: p.prices!.initialPrice ?? 0,
          image: p.colorwayImages?.squarishURL ?? p.colorwayImages?.portraitURL ?? null,
          url: p.pdpUrl!.url!,
          category: p.productType === "FOOTWEAR" ? "Footwear" : p.productType,
        });
      });
  };
}

/* ======================= Zalando (Germany, France, Italy, Spain, Netherlands) ======================= */

const zalando = (store: StoreId, host: string): Adapter => async (q) => {
  // Zalando.de serves an English catalogue when asked; prices are always in euros.
  const html = await getHtml(STORES[store].search(q), { "Accept-Language": "en-GB,en;q=0.9" });
  const domain = host.replace(/^www\./, "").replace(/\./g, "\\.");
  const linkRe = new RegExp(`href="(https://[a-z]+\\.${domain}/[^"]+\\.html)"`);
  const out: Listing[] = [];
  for (const a of html.split("<article").slice(1)) {
    const card = a.slice(0, a.indexOf("</article>"));
    const url = card.match(linkRe)?.[1];
    const h3 = card.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? "";
    const [brand, name] = (h3.match(/<span[^>]*>[^<]*<\/span>/g) ?? []).map((s) => decode(s.replace(/<[^>]+>/g, ""))).filter(Boolean);
    const img = card.match(/<img[^>]*src="(https:\/\/img01\.ztat\.net\/[^"]+)"/)?.[1]?.replace(/&amp;/g, "&");
    const text = card.replace(/<[^>]+>/g, "|");
    const prices = [...text.matchAll(/€\s?([\d.,]+)|([\d.,]+)\s?€/g)].map((m) => parsePrice(m[1] ?? m[2])).filter(Boolean);
    if (!url || !brand || !name || !prices.length) continue;
    out.push(
      listing(store, url.match(/-([a-z0-9]{9}-[a-z0-9]{3})\.html/)?.[1] ?? url, "EUR", {
        // "PEGASUS 42 - Road running shoes - black/white" → drop the colour part.
        title: `${brand} ${name.split(" - ").slice(0, 2).join(" ")}`,
        brand,
        price: prices[0],
        mrp: Math.max(...prices),
        image: img ? img.replace(/imwidth=\d+/, "imwidth=762") : null,
        url: url.replace(/:\/\/[a-z]+\./, "://www."),
      }),
    );
  }
  return out;
};

/** One adapter per live store: hand-written ones, plus Amazon / Nike / Zalando built from the store list. */
export const ADAPTERS: Record<StoreId, Adapter> = {
  myntra,
  flipkart,
  ajio,
  skechers_in: skechersIn,
  zappos: zapposFamily("zappos", "www.zappos.com"),
  sixpm: zapposFamily("sixpm", "www.6pm.com"),
  walmart,
  ...Object.fromEntries(
    ALL_STORES.flatMap((s) => {
      const currency = REGIONS[s.region].currency;
      const e = s.engine;
      if (s.mode !== "live" || !e) return [];
      if (e.type === "amazon") return [[s.id, amazon(s.id, e.host, currency)]];
      if (e.type === "nike") return [[s.id, nike(s.id, currency)]];
      if (e.type === "zalando") return [[s.id, zalando(s.id, e.host)]];
      return [];
    }),
  ),
};

export type Region = "in" | "us" | "uk" | "de" | "fr" | "it" | "es" | "nl" | "ca" | "au" | "jp" | "ae" | "sg" | "mx";
export type Currency = "INR" | "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "AED" | "SGD" | "MXN";

/** Store ids are unique across regions, e.g. "amazon_in", "amazon_de". */
export type StoreId = string;

/** One product as listed on one store. */
export interface Listing {
  id: string; // `${store}:${pid}`
  store: StoreId;
  title: string;
  brand: string;
  price: number;
  mrp: number;
  currency: Currency;
  discount: number; // percent off MRP / list price
  image: string | null;
  images: string[];
  url: string; // direct product page
  rating?: number;
  ratingCount?: number;
  /** Store's own category label, e.g. Myntra's "Footwear". */
  category?: string;
}

/** The same shoe found on one or more stores. Offers are sorted cheapest first. */
export interface ProductGroup {
  key: string;
  title: string;
  brand: string;
  currency: Currency;
  /** Country the prices are from. */
  region: Region;
  image: string | null;
  images: string[];
  offers: Listing[];
  bestPrice: number;
  highestPrice: number;
  mrp: number;
  discount: number;
  rating?: number;
  ratingCount?: number;
}

export interface SourceStatus {
  store: StoreId;
  ok: boolean;
  count: number;
  ms: number;
  error?: string;
}

export interface LinkOnlyStore {
  store: StoreId;
  name: string;
  url: string;
}

export interface SearchResponse {
  query: string;
  region: Region;
  fetchedAt: string;
  products: ProductGroup[];
  sources: SourceStatus[];
}

export interface CompareResponse {
  query: string;
  region: Region;
  fetchedAt: string;
  product: ProductGroup | null;
  similar: ProductGroup[];
  checkAlso: LinkOnlyStore[];
  sources: SourceStatus[];
}

export type SortKey = "relevance" | "popular" | "price_asc" | "price_desc" | "discount" | "rating";

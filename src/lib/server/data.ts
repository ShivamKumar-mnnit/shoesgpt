import { cacheLife } from "next/cache";
import { compare, search } from "./aggregate";
import type { Region, SortKey } from "../types";

/**
 * Cached store data for server-rendered pages (what search engines see).
 * A good result is kept for an hour; an empty one (often a temporary block)
 * only for a minute, so the page fixes itself quickly.
 */
export async function getListing(region: Region, q: string, sort: SortKey = "relevance", limit = 24) {
  "use cache";
  const data = await search(q, region, sort, limit);
  if (data.products.length >= 4) cacheLife("hours");
  else cacheLife("minutes");
  return data;
}

export async function getShoe(title: string, brand: string, region: Region) {
  "use cache";
  const data = await compare(title, brand, region);
  if (data.product) cacheLife("hours");
  else cacheLife("minutes");
  return data;
}

import { NextResponse, type NextRequest } from "next/server";
import { search } from "@/lib/server/aggregate";
import { isRegion } from "@/lib/stores";
import type { SortKey, StoreId } from "@/lib/types";

const SORTS: SortKey[] = ["relevance", "popular", "price_asc", "price_desc", "discount", "rating"];

// GET /api/search?q=running+shoes&region=us&sort=price_asc&limit=24&stores=zappos,walmart
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").trim().slice(0, 120);
  if (!q) return NextResponse.json({ error: "Missing q" }, { status: 400 });
  const region = sp.get("region");
  const sortParam = sp.get("sort") as SortKey | null;
  const sort = sortParam && SORTS.includes(sortParam) ? sortParam : "relevance";
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 24, 1), 60);
  const stores = sp.get("stores")?.split(",").filter(Boolean) as StoreId[] | undefined;

  const data = await search(q, isRegion(region) ? region : "in", sort, limit, stores);
  return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=300" } });
}

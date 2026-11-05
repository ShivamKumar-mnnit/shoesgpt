import { NextResponse, type NextRequest } from "next/server";
import { compare } from "@/lib/server/aggregate";
import { isRegion } from "@/lib/stores";

// GET /api/compare?title=Nike+Air+Zoom+Pegasus+41&brand=Nike&region=in
// Finds the same shoe on every store in the region and returns offers sorted cheapest first.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const title = (sp.get("title") ?? "").trim().slice(0, 200);
  const brand = (sp.get("brand") ?? "").trim().slice(0, 60);
  const region = sp.get("region");
  if (!title || !brand) return NextResponse.json({ error: "Missing title or brand" }, { status: 400 });

  const data = await compare(title, brand, isRegion(region) ? region : "in");
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

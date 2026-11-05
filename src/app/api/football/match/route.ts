import { NextResponse, type NextRequest } from "next/server";
import { matchDetail } from "@/lib/football/espn";

// GET /api/football/match?league=uefa.champions&id=401915534
export async function GET(req: NextRequest) {
  const league = req.nextUrl.searchParams.get("league") ?? "";
  const id = req.nextUrl.searchParams.get("id") ?? "";
  try {
    const match = await matchDetail(league, id);
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
    return NextResponse.json(match, { headers: { "Cache-Control": "public, max-age=15" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

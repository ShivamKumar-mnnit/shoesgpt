import { NextResponse } from "next/server";
import { liveAndToday } from "@/lib/football/espn";

// GET /api/football/live: live matches first, then today's upcoming and just-finished ones.
export async function GET() {
  try {
    const matches = await liveAndToday();
    return NextResponse.json({ matches, fetchedAt: new Date().toISOString() }, { headers: { "Cache-Control": "public, max-age=20" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, matches: [] }, { status: 502 });
  }
}

"use client";

import type { MatchDetail } from "@/lib/football/types";
import { useMatch } from "./common";
import { MatchPanel } from "./match-panel";

/** Match page body: starts with the server's data, then keeps itself updated while the match is live. */
export function MatchLive({ initial }: { initial: MatchDetail }) {
  const { match } = useMatch(initial.league.id, initial.id, initial);
  return <MatchPanel match={match ?? initial} />;
}

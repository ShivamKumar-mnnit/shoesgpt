"use client";

import { starBySlug } from "@/lib/football/boots";
import { StarBootsCard } from "./match-panel";

/** Client wrapper so a server page can show live prices for one star's boots. */
export function StarBootsLive({ slug }: { slug: string }) {
  const star = starBySlug(slug);
  return star ? <StarBootsCard star={star} /> : null;
}

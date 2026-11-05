import type { Metadata } from "next";
import { StarBootsGrid } from "@/components/football/sections";

export const metadata: Metadata = {
  title: "Football Boots Worn by the Stars: Mbappé, Haaland, Messi, Bellingham & More",
  description:
    "See which football boots Mbappé, Haaland, Messi, Yamal, Bellingham, Vinícius, Saka and other stars wear, with today's prices and the cheapest place to buy them.",
  alternates: { canonical: "/football/boots" },
};

export default function BootsIndex() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-16 md:px-10">
      <StarBootsGrid title="Football boots worn by the stars" />
    </div>
  );
}

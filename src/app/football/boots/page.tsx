import type { Metadata } from "next";
import { StarBootsGrid } from "@/components/football/sections";

export const metadata: Metadata = {
  title: "Footballer Shoes: Boots Worn by Mbappé, Haaland, Messi, Ronaldo & More",
  description:
    "Which shoes and boots do footballers wear? See the boots Mbappé, Haaland, Messi, Ronaldo, Yamal, Bellingham, Vinícius and Saka play in, with today's prices and the cheapest place to buy them.",
  alternates: { canonical: "/football/boots" },
};

export default function BootsIndex() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-16 md:px-10">
      <StarBootsGrid title="Footballer shoes: the boots the stars wear" />
    </div>
  );
}

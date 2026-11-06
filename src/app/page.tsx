import { Hero } from "@/components/home/hero";
import { PopularComparisons } from "@/components/home/popular";
import { Suspense } from "react";
import { FootballTeaser } from "@/components/football/teaser";
import { AboutShoesGpt } from "@/components/home/about";
import { getLiveMatches } from "@/lib/football/data";

/** Homepage football block with today's matches in the HTML from the start. */
async function FootballWithScores() {
  const matches = await getLiveMatches().catch(() => undefined);
  return <FootballTeaser initial={matches} />;
}
import {
  BigCta,
  BrandMarquee,
  BrandsSection,
  DealsSection,
  HowItWorks,
  MostLiked,
  SportsSection,
  UserRecommended,
} from "@/components/home/sections";

export default function Home() {
  return (
    <>
      <Hero />
      <BrandMarquee />
      <Suspense fallback={<FootballTeaser />}>
        <FootballWithScores />
      </Suspense>
      <MostLiked />
      <SportsSection />
      <HowItWorks />
      <DealsSection />
      <UserRecommended />
      <BrandsSection />
      <AboutShoesGpt />
      <PopularComparisons />
      <BigCta />
    </>
  );
}

import { Hero } from "@/components/home/hero";
import { PopularComparisons } from "@/components/home/popular";
import { FootballTeaser } from "@/components/football/teaser";
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
      <FootballTeaser />
      <MostLiked />
      <SportsSection />
      <HowItWorks />
      <DealsSection />
      <UserRecommended />
      <BrandsSection />
      <PopularComparisons />
      <BigCta />
    </>
  );
}

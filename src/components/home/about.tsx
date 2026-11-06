import Link from "next/link";
import { LEAGUES } from "@/lib/football/leagues";
import { STAR_BOOTS, bootsLabel } from "@/lib/football/boots";
import { REGION_IDS, storesIn } from "@/lib/stores";

/** Plain-language summary of what the site does, with links into each part. */
export function AboutShoesGpt() {
  const storeCount = REGION_IDS.reduce((n, r) => n + storesIn(r).length, 0);
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-10" aria-labelledby="about-heading">
      <h2 id="about-heading" className="max-w-3xl text-3xl font-black leading-tight tracking-tight md:text-5xl">
        Live football scores, footballers’ boots and shoe price comparison in one place
      </h2>
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-black">Live football scores</h3>
          <p className="mt-2 text-sm leading-6 text-ink-2">
            Follow live scores, today’s fixtures and results from {LEAGUES.length} competitions, including the{" "}
            <Link href="/football/champions-league" className="font-semibold underline-offset-4 hover:underline">Champions League</Link>,{" "}
            <Link href="/football/premier-league" className="font-semibold underline-offset-4 hover:underline">Premier League</Link>,{" "}
            <Link href="/football/laliga" className="font-semibold underline-offset-4 hover:underline">LaLiga</Link> and the{" "}
            <Link href="/football/indian-super-league" className="font-semibold underline-offset-4 hover:underline">Indian Super League</Link>. Every
            match has lineups, stats and live commentary.
          </p>
          <Link href="/football" className="mt-3 inline-block text-sm font-bold text-accent">All live scores →</Link>
        </div>
        <div>
          <h3 className="text-lg font-black">Footballers’ boots</h3>
          <p className="mt-2 text-sm leading-6 text-ink-2">
            See which boots the stars wear:{" "}
            {STAR_BOOTS.slice(0, 5).map((p, i) => (
              <span key={p.slug}>
                {i > 0 && ", "}
                <Link href={`/football/boots/${p.slug}`} className="font-semibold underline-offset-4 hover:underline">
                  {p.name}
                </Link>{" "}
                ({bootsLabel(p)})
              </span>
            ))}{" "}
            and more, with today’s price at every store and the cheapest one first.
          </p>
          <Link href="/football/boots" className="mt-3 inline-block text-sm font-bold text-accent">All players’ boots →</Link>
        </div>
        <div>
          <h3 className="text-lg font-black">Compare shoe prices</h3>
          <p className="mt-2 text-sm leading-6 text-ink-2">
            Compare the same pair of shoes across {storeCount}+ stores in {REGION_IDS.length} countries, including Amazon, Flipkart, Myntra, AJIO,
            Zappos, Walmart, Zalando and Nike. Prices are sorted from cheapest to most expensive, and you buy straight from the store.
          </p>
          <Link href="/shoes" className="mt-3 inline-block text-sm font-bold text-accent">Compare shoes →</Link>
        </div>
      </div>
    </section>
  );
}

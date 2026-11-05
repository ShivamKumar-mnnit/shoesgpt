import Link from "next/link";
import { BRANDS, REGIONS, REGION_IDS, SPORTS, liveStoresIn } from "@/lib/stores";
import { landingPath, slugify } from "@/lib/site";
import { Flag } from "../ui";

/**
 * Server-rendered links to every brand and sport page in every country.
 * Helps shoppers jump straight in, and lets search engines find all pages from the homepage.
 */
export function PopularComparisons() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 md:px-10" aria-labelledby="popular-heading">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Shoe price comparison</p>
      <h2 id="popular-heading" className="max-w-3xl text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
        Popular price comparisons
      </h2>
      <p className="mt-4 max-w-2xl text-muted">
        Pick your country and a brand or sport. Every page lists real shoes with each store’s price, sorted from cheapest to
        most expensive.
      </p>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {REGION_IDS.map((r) => (
          <div key={r} className="rounded-[32px] border border-line bg-white/60 p-6">
            <h3 className="flex items-center gap-2 text-xl font-black">
              <Flag region={r} /> {REGIONS[r].name}
            </h3>
            <p className="mt-1 text-xs text-muted">Live: {liveStoresIn(r).map((s) => s.name).join(", ")}</p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {BRANDS[r].map((b) => (
                <li key={b}>
                  <Link
                    href={landingPath({ region: r, kind: "brands", slug: slugify(b) })}
                    className="inline-block rounded-full border border-line bg-white px-3 py-1.5 text-sm transition hover:border-ink"
                  >
                    {b}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              {SPORTS[r].map((s) => (
                <li key={s.id}>
                  <Link
                    href={landingPath({ region: r, kind: "sports", slug: s.id })}
                    className="inline-block rounded-full bg-ink px-3 py-1.5 text-sm text-paper transition hover:bg-accent"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StarBootsLive } from "@/components/football/star-boots-live";
import { Faq } from "@/components/football/sections";
import { JsonLd, breadcrumbSchema, faqSchema } from "@/components/seo";
import { STAR_BOOTS, bootsLabel, starBySlug } from "@/lib/football/boots";

type Params = { player: string };

export function generateStaticParams(): Params[] {
  return STAR_BOOTS.map((p) => ({ player: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const p = starBySlug((await params).player);
  if (!p) return {};
  const title = `What Boots Does ${p.name} Wear? ${bootsLabel(p)} Price & Where to Buy`;
  const description = `${p.name} plays in ${p.model ? p.model : `${p.brand} boots`}. Compare today's prices across stores in your country and buy them where they're cheapest.`;
  return {
    title,
    description,
    alternates: { canonical: `/football/boots/${p.slug}` },
    openGraph: { title, description, url: `/football/boots/${p.slug}`, images: [{ url: "/opengraph-image", width: 1200, height: 630 }] },
  };
}

export default async function PlayerBoots({ params }: { params: Promise<Params> }) {
  const p = starBySlug((await params).player);
  if (!p) notFound();
  const label = bootsLabel(p);
  const faqs = [
    {
      q: `What boots does ${p.name} wear?`,
      a: p.model
        ? `${p.name} is known for playing in ${p.model} boots from ${p.brand}. He sometimes wears special colourways or limited editions.`
        : `${p.name} wears ${p.brand} boots. The exact model can change through the season.`,
    },
    {
      q: `Where can I buy ${p.name}'s boots cheapest?`,
      a: `We check stores in your country and list ${label} prices from lowest to highest. The cheapest store is shown first.`,
    },
    {
      q: `Are ${label} good for amateur players?`,
      a: `Most boot lines come in several levels, from elite (what pros wear) to academy and club versions that cost much less with the same look. Compare the versions below.`,
    },
  ];
  const others = STAR_BOOTS.filter((x) => x.slug !== p.slug && x.brand === p.brand).slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-28 md:px-10">
      <JsonLd
        data={[
          faqSchema(faqs),
          breadcrumbSchema([
            { name: "Football", path: "/football" },
            { name: "Players' boots", path: "/football/boots" },
            { name: p.name, path: `/football/boots/${p.slug}` },
          ]),
        ]}
      />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/football" className="hover:text-ink">Football</Link> /{" "}
        <Link href="/football/boots" className="hover:text-ink">Players’ boots</Link> / <span className="text-ink">{p.name}</span>
      </nav>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{p.club}</p>
      <h1 className="text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
        What boots does {p.name} wear?
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-ink-2">
        {p.name} {p.model ? <>plays in <b>{p.model}</b> boots from {p.brand}</> : <>wears <b>{p.brand}</b> boots</>}. Here are today’s prices
        in your country, with the cheapest store first.
      </p>
      <div className="mt-10 max-w-2xl">
        <StarBootsLive slug={p.slug} />
      </div>
      {others.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 text-2xl font-black tracking-tight">Other {p.brand} players</h2>
          <ul className="flex flex-wrap gap-2">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/football/boots/${o.slug}`} className="inline-block rounded-full border border-line bg-white px-4 py-2 text-sm hover:border-ink">
                  {o.name}: {bootsLabel(o)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Faq faqs={faqs} />
    </div>
  );
}

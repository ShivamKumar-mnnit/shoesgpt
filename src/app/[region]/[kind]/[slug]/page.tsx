import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShoeCard, ShoeCardSkeleton } from "@/components/shoe-card";
import { SyncRegion } from "@/components/providers";
import { JsonLd, breadcrumbSchema, faqSchema, productSchema } from "@/components/seo";
import { getListing } from "@/lib/server/data";
import { BRANDS, REGIONS, SPORTS, STORES, storesIn } from "@/lib/stores";
import {
  HREFLANG,
  SITE_NAME,
  allLandings,
  alternatesFor,
  findLanding,
  landingDescription,
  landingPath,
  landingTitle,
  liveStoresFor,
  slugify,
  type Landing,
} from "@/lib/site";
import type { ProductGroup } from "@/lib/types";
import { money } from "@/lib/format";

type Params = { region: string; kind: string; slug: string };

/**
 * Built ahead of time: the top 6 brands and top 3 sports in each country.
 * Every other brand/sport page renders on its first visit and is then cached the same way.
 */
export function generateStaticParams(): Params[] {
  const seen = new Map<string, number>();
  return allLandings()
    .filter((l) => {
      const k = `${l.region}/${l.kind}`;
      const n = (seen.get(k) ?? 0) + 1;
      seen.set(k, n);
      return n <= (l.kind === "brands" ? 6 : 3);
    })
    .map(({ region, kind, slug }) => ({ region, kind, slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { region, kind, slug } = await params;
  const l = findLanding(region, kind, slug);
  if (!l) return {};
  const alts = alternatesFor(l.kind, l.slug);
  const path = landingPath(l);
  const title = landingTitle(l);
  const description = landingDescription(l);
  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        ...Object.fromEntries(Object.entries(alts).map(([r, p]) => [HREFLANG[r as Landing["region"]], p])),
        "x-default": alts.in ?? path,
      },
    },
    openGraph: {
      title,
      description,
      url: path,
      type: "website",
      locale: HREFLANG[l.region].replace("-", "_"),
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/opengraph-image"] },
  };
}

const fmt = money;

export default async function LandingPage({ params }: { params: Promise<Params> }) {
  const { region, kind, slug } = await params;
  const l = findLanding(region, kind, slug);
  if (!l) notFound();
  const info = REGIONS[l.region];
  const live = liveStoresFor(l);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: `${l.name} shoes in ${info.name}`, path: landingPath(l) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-32 md:px-10">
      <SyncRegion region={l.region} />
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-ink">Home</Link> / <span>{info.name}</span> /{" "}
        <span className="text-ink">{l.kind === "brands" ? `${l.name} shoes` : `${l.name} shoes`}</span>
      </nav>

      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        {l.kind === "brands" ? "Brand" : "Sport"} · {info.name} · {info.currency}
      </p>
      <h1 className="text-5xl font-black leading-[0.92] tracking-tight md:text-7xl">
        {l.kind === "brands" ? `${l.name} shoes` : `${l.name} shoes`}
        <span className="block text-2xl font-bold tracking-tight text-muted md:text-3xl">
          Compare prices in {info.name}, cheapest first
        </span>
      </h1>
      <p className="mt-6 max-w-3xl text-lg text-ink-2">{landingDescription(l)}</p>

      <Suspense fallback={<GridFallback />}>
        <Products landing={l} />
      </Suspense>

      <MoreLinks landing={l} />

      <section className="mt-20 max-w-3xl">
        <h2 className="text-3xl font-black tracking-tight">How we compare {l.name.toLowerCase()} shoe prices</h2>
        <p className="mt-4 text-ink-2">
          {SITE_NAME} checks {live.map((s) => s.name).join(", ")} for {l.kind === "brands" ? `${l.name} shoes` : `${l.name.toLowerCase()} shoes`},
          matches the same model across stores (same brand, model name, model number and men’s, women’s or kids’ version) and
          lists each store’s price from lowest to highest. You buy directly on the store’s site; we don’t add any fees.
          We also link to {storesIn(l.region).filter((s) => s.mode === "link" && !s.brand).length} more stores such as{" "}
          {storesIn(l.region)
            .filter((s) => s.mode === "link" && !s.brand)
            .slice(0, 4)
            .map((s) => s.name)
            .join(", ")}
          .
        </p>
      </section>
    </div>
  );
}

async function Products({ landing: l }: { landing: Landing }) {
  const data = await getListing(l.region, l.q, "relevance", 24);
  const products = data.products;
  const currency = REGIONS[l.region].currency;
  const cheapest = [...products].sort((a, b) => a.bestPrice - b.bestPrice)[0];
  const multi = products.filter((p) => p.offers.length > 1).length;
  const wins = new Map<string, number>();
  for (const p of products) if (p.offers.length > 1) wins.set(p.offers[0].store, (wins.get(p.offers[0].store) ?? 0) + 1);
  const topStore = [...wins.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const subject = l.kind === "brands" ? `${l.name} shoes` : `${l.name.toLowerCase()} shoes`;

  const faqs = [
    {
      q: `Where is the cheapest place to buy ${subject} in ${REGIONS[l.region].name}?`,
      a: topStore
        ? `In our latest check of ${multi} ${subject} sold by more than one store, ${STORES[topStore]?.name} had the lowest price most often. Prices change daily, so compare each pair before you buy.`
        : `It depends on the pair. Open any shoe to see every store's price, sorted cheapest first.`,
    },
    ...(cheapest
      ? [
          {
            q: `How much do ${subject} cost?`,
            a: `Prices we found today start at ${fmt(cheapest.bestPrice, currency)} (${cheapest.title}). The range depends on the model, discounts and store.`,
          },
        ]
      : []),
    {
      q: "Are these prices live?",
      a: `Yes. We read prices from ${liveStoresFor(l).map((s) => s.name).join(", ")} and refresh them regularly. The store's own page always has the final price.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${subject} prices in ${REGIONS[l.region].name}`,
            itemListElement: products.slice(0, 20).map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              item: productSchema(p, shoePath(p, l.region)),
            })),
          },
          faqSchema(faqs),
        ]}
      />

      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        <Stat label="shoes found" value={String(products.length)} />
        <Stat label="on 2+ stores" value={String(multi)} />
        {cheapest && <Stat label="lowest price" value={fmt(cheapest.bestPrice, currency)} />}
        <Stat label="stores checked" value={String(data.sources.filter((s) => s.ok).length)} />
      </div>

      <h2 className="sr-only">{subject} with prices</h2>
      <div className="mt-8 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
        {products.map((p, i) => (
          <ShoeCard key={p.key} p={p} index={i} reveal={false} />
        ))}
      </div>
      {!products.length && (
        <p className="mt-8 rounded-3xl border border-dashed border-line p-10 text-center text-muted">
          The stores didn’t answer just now. This page refreshes automatically; try again in a minute.
        </p>
      )}

      <section className="mt-20 max-w-3xl">
        <h2 className="text-3xl font-black tracking-tight">Questions about {subject}</h2>
        <dl className="mt-6 space-y-6">
          {faqs.map((f) => (
            <div key={f.q}>
              <dt className="text-lg font-bold">{f.q}</dt>
              <dd className="mt-1 text-ink-2">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

function shoePath(p: ProductGroup, region: string) {
  return `/shoe?title=${encodeURIComponent(p.title)}&brand=${encodeURIComponent(p.brand)}&region=${region}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-line bg-white px-4 py-2">
      <b className="font-black">{value}</b> <span className="text-muted">{label}</span>
    </span>
  );
}

function GridFallback() {
  return (
    <div className="mt-16 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ShoeCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Internal links: other brands and sports in this country, and this page in other countries. */
function MoreLinks({ landing: l }: { landing: Landing }) {
  const alts = alternatesFor(l.kind, l.slug);
  return (
    <section className="mt-20 grid gap-10 md:grid-cols-3">
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-muted">Brands in {REGIONS[l.region].name}</h2>
        <ul className="flex flex-wrap gap-2">
          {BRANDS[l.region].map((b) => (
            <li key={b}>
              <Link href={landingPath({ region: l.region, kind: "brands", slug: slugify(b) })} className="inline-block rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">
                {b} shoes
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-muted">Shop by sport</h2>
        <ul className="flex flex-wrap gap-2">
          {SPORTS[l.region].map((s) => (
            <li key={s.id}>
              <Link href={landingPath({ region: l.region, kind: "sports", slug: s.id })} className="inline-block rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:border-ink">
                {s.label} shoes
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-muted">Other countries</h2>
        <ul className="space-y-2 text-sm">
          {Object.entries(alts)
            .filter(([r]) => r !== l.region)
            .map(([r, path]) => (
              <li key={r}>
                <Link href={path} hrefLang={HREFLANG[r as Landing["region"]]} className="underline-offset-4 hover:underline">
                  {l.name} shoes in {REGIONS[r as Landing["region"]].name} ({REGIONS[r as Landing["region"]].currency})
                </Link>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}

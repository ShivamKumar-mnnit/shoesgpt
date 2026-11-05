import { Suspense } from "react";
import type { Metadata } from "next";
import { ShoeDetail } from "@/components/shoe-detail";
import { JsonLd, breadcrumbSchema, productSchema } from "@/components/seo";
import { getShoe } from "@/lib/server/data";
import { isRegion, REGIONS } from "@/lib/stores";
import type { Region } from "@/lib/types";
import { money } from "@/lib/format";

type SP = Promise<{ [k: string]: string | string[] | undefined }>;

function read(sp: Awaited<SP>) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim().slice(0, 200) || null;
  const title = one(sp.title);
  const brand = one(sp.brand);
  const r = one(sp.region);
  const region: Region = isRegion(r) ? r : "in";
  const path = title && brand ? `/shoe?title=${encodeURIComponent(title)}&brand=${encodeURIComponent(brand)}&region=${region}` : "/shoe";
  return { title, brand, region, path };
}

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { title, brand, region, path } = read(await searchParams);
  if (!title || !brand) return { title: "Compare shoe prices", robots: { index: false, follow: true } };
  const data = await getShoe(title, brand, region);
  const p = data.product;
  const country = REGIONS[region].name;
  if (!p) return { title: `${title} price in ${country}`, robots: { index: false, follow: true }, alternates: { canonical: path } };
  const pageTitle = `${p.title}: compare ${p.offers.length} store${p.offers.length > 1 ? "s" : ""} from ${money(p.bestPrice, p.currency)}`;
  const description = `${p.title} price in ${country}: ${p.offers
    .map((o) => `${money(o.price, o.currency)}`)
    .slice(0, 4)
    .join(", ")}. Lowest price ${money(p.bestPrice, p.currency)}${p.discount ? ` (${p.discount}% off)` : ""}. Compare stores and buy where it's cheapest.`;
  return {
    title: pageTitle,
    description,
    alternates: { canonical: path },
    openGraph: { title: pageTitle, description, url: path, type: "website", images: p.image ? [{ url: p.image }] : undefined },
    twitter: { card: "summary_large_image", title: pageTitle, description, images: p.image ? [p.image] : undefined },
  };
}

export default function ShoePage({ searchParams }: { searchParams: SP }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ShoeServer searchParams={searchParams} />
    </Suspense>
  );
}

/** Renders the comparison on the server so search engines see prices and structured data. */
async function ShoeServer({ searchParams }: { searchParams: SP }) {
  const { title, brand, region, path } = read(await searchParams);
  const data = title && brand ? await getShoe(title, brand, region) : null;
  const p = data?.product;
  return (
    <>
      {p && (
        <JsonLd
          data={[
            productSchema(p, path),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: `${p.brand} shoes`, path: `/shoes?q=${encodeURIComponent(p.brand + " shoes")}` },
              { name: p.title, path },
            ]),
          ]}
        />
      )}
      <ShoeDetail initial={data} />
    </>
  );
}

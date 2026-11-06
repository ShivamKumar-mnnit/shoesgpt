import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { CompareTray, Footer, Toast } from "@/components/chrome";
import { JsonLd } from "@/components/seo";
import { Suspense } from "react";
import { getLiveMatches } from "@/lib/football/data";
import { CONTACT, SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const DESCRIPTION =
  "Live football scores, lineups and stats, plus the boots the stars wear. Compare shoe prices across Amazon, Flipkart, Myntra, AJIO, Zappos, Walmart, Zalando, Nike and more, cheapest first, in 14 countries.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "shoesGPT: Compare Shoe Prices Across Every Store & Buy Cheapest",
    template: "%s | shoesGPT",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "shoe price comparison",
    "compare shoe prices",
    "cheapest shoes online",
    "sneaker price comparison",
    "running shoes price",
    "Nike price comparison",
    "Adidas price comparison",
    "shoes price India",
    "best shoe deals",
    "Schuhe Preisvergleich",
    "live football scores",
    "football scores today",
    "football boots price",
    "what boots does Mbappe wear",
    "football boots comparison",
  ],
  category: "shopping",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    title: "shoesGPT: Compare Shoe Prices Across Every Store",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "shoesGPT: Compare Shoe Prices Across Every Store",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  // Add the codes from Google Search Console / Bing Webmaster Tools when you verify the domain:
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: "#f3f0ea",
};

/** Site-wide structured data: who we are, and a search box Google can show in results. */
const siteSchema = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/shoes?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    email: CONTACT.email,
    telephone: CONTACT.phone,
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: CONTACT.email, telephone: CONTACT.phone },
    ...(CONTACT.socials.length ? { sameAs: CONTACT.socials.map((s) => s.url) } : {}),
  },
];

/** Score bar with today's matches already filled in (cached, refreshed about every 30 seconds). */
async function NavbarWithScores() {
  const matches = await getLiveMatches().catch(() => undefined);
  return <Navbar matches={matches?.slice(0, 30)} />;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="grain min-h-screen">
        <JsonLd data={siteSchema} />
        <Providers>
          <Suspense fallback={<Navbar />}>
            <NavbarWithScores />
          </Suspense>
          {/* Room for the live-score bar fixed at the top */}
          <div className="h-10" aria-hidden />
          <main>{children}</main>
          <Footer />
          <CompareTray />
          <Toast />
        </Providers>
      </body>
    </html>
  );
}

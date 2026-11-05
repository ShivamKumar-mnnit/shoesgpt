# shoesGPT

Compare shoe prices across Indian stores and jump to the cheapest one. Built with Next.js 16, Tailwind CSS 4, Framer Motion and Lenis.

## Run

```bash
npm install
npm run dev   # http://localhost:3000
```

## How live data works

Nothing about products is hardcoded: names, images, prices and links are fetched from the stores at request time.

- **14 countries:** India, USA, UK, Germany, France, Italy, Spain, Netherlands, Canada, Australia, Japan, UAE, Singapore, Mexico, each in its own currency. The navbar picks the country (first visit is guessed from the timezone); links can force one with `?region=fr`.
- **Live stores** (prices, images and direct product links), read by `src/lib/server/adapters.ts`:
  - India: Flipkart, Myntra, Amazon.in, AJIO, Skechers
  - USA: Zappos, 6pm, Walmart, Nike
  - Amazon, Nike and Zalando in the other countries (whichever exist there)
- **Link-only stores** (they block servers or load products in the browser): JD Sports, ASOS, Foot Locker, About You, Courir, The Iconic, Namshi, noon, Mercado Libre, brand sites and more. The shoe page links to their search for that shoe.
- Stores, brands and sports per country: `src/lib/stores.ts`. Adding Amazon, Nike or Zalando in a new country is one line.
- `src/lib/match.ts` decides when listings on different stores are the same shoe (same brand, same model words, same model number).
- `src/lib/server/aggregate.ts` runs adapters in parallel, caches results for 10 minutes, groups and sorts them.
- API: `GET /api/search?q=&region=&sort=&limit=` and `GET /api/compare?title=&brand=&region=` (offers sorted cheapest first).

Reading store pages breaks when a store changes its markup and may go against their terms. For production, move each adapter to an official feed (Flipkart Affiliate API, Amazon Creators API / PA-API, or an affiliate network such as Cuelinks or EarnKaro) behind the same `Adapter` function signature.

## Pages

- `/`: hero, most liked, shop by sport, deals (scroll-driven), user-rated picks, brands
- `/shoes?q=`: search with store filter, price slider and sorting
- `/shoe?title=&brand=`: one shoe, every store's price cheapest first, with "Go to store" links
- `/compare`: up to 4 shoes side by side
- `/likes`: liked shoes (saved in the browser)

## SEO

- Domain: `https://shoesgpt.in` (override with `NEXT_PUBLIC_SITE_URL`).
- Server-rendered landing pages for every brand and sport in every country, e.g. `/in/brands/nike`, `/us/sports/running`, `/fr/brands/adidas`, with live products, FAQ, and schema.org data (Product + AggregateOffer, ItemList, FAQPage, BreadcrumbList). Top pages are built ahead; the rest render on first visit. Data is cached for an hour.
- Shoe pages (`/shoe?title=&brand=&region=`) render on the server with their own title, description and Product data.
- `/sitemap.xml` (all landing pages, with hreflang links between countries), `/robots.txt`, `/manifest.webmanifest`, generated share image and Apple icon.
- Add `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` / `NEXT_PUBLIC_BING_SITE_VERIFICATION` after verifying the domain, then submit the sitemap in Google Search Console and Bing Webmaster Tools.

## Football

- **Live score bar** at the top of every page (`src/components/football/ticker.tsx`): live matches first, refreshes every 30 s. Click a match to open the panel: score, key moments, stats, lineups, commentary, and a **Boots** tab.
- **Boots tab**: star players in the match (from `src/lib/football/boots.ts`) with the boots they're known for and live prices in the shopper's country, cheapest first. There's no data feed for which boots a player wears in a match, so this list is kept by hand. Update it when boot deals change.
- **Pages** (server-rendered for search engines, with SportsEvent / FAQ / Breadcrumb data):
  - `/football`: live scores today across 20 competitions
  - `/football/[league]`: e.g. `/football/premier-league`: matchday scores + table
  - `/football/match/[league]/[id]`: match page with live updates
  - `/football/boots` and `/football/boots/[player]`: e.g. "What boots does Kylian Mbappé wear?"
- **Data**: ESPN's public JSON (`src/lib/football/espn.ts`). It's unofficial and needs no key; for a big launch switch to a licensed feed (API-Football, Sportmonks, Opta) behind the same functions.

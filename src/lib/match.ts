import type { Listing, ProductGroup, Region } from "./types";
import { STORES } from "./stores";

/**
 * Words that describe a shoe but don't identify the model.
 * Removing them lets "Nike Men Air Zoom Pegasus 41 Road Running Shoes" on Myntra
 * match "NIKE AIR ZOOM PEGASUS 41 Running Shoes For Men" on Flipkart.
 */
const NOISE = new Set(
  (
    "men mens man women womens woman unisex boys girls kids for and with the a of by in " +
    "shoe shoes sneaker sneakers running run road sports sport training trainer trainers walking walk " +
    "casual lifestyle gym lace laceup ups up slip slipon on comfort lightweight light weight non marking " +
    "textured colourblocked colorblocked woven mesh solid printed perforated regular premium original " +
    "outdoor indoor everyday daily wear basketball football cricket tennis hiking trekking court " +
    "white black red blue grey gray navy green multicolor multicolour multi pink yellow orange brown tan " +
    "beige cream olive maroon purple silver gold off charcoal khaki teal peach " +
    "size uk us india new pair stylish trendy best " +
    // materials and marketing words: shared by many different models
    "athleisure etpu eva pu tpu phylon rubber sole soles outsole cushioned cushioning breathable abrasion " +
    "durable flexible comfortable comfy anti skid resistant design designer fashion fashionable streetwear " +
    "elevated sporty ultra super lite roadrunning m w little big kid toddler cleats boot boots " +
    // German shop titles (Nike DE, Amazon.de)
    "herren damen kinder jungen maedchen fuer und mit schuh schuhe laufschuh laufschuhe strassenlaufschuh " +
    "strassenlaufschuhe freizeitschuh hallenschuh trailschuh turnschuh sportschuh " +
    // French, Italian, Spanish, Dutch shop titles
    "homme hommes femme femmes enfant enfants chaussure chaussures baskets pour de du des sur la le les route course " +
    "uomo donna bambino bambina scarpa scarpe da per corsa strada " +
    "hombre mujer nino nina zapatilla zapatillas zapato zapatos para carretera tenis " +
    "heren dames kinderen schoen schoenen voor hardloopschoenen hardloopschoen"
  ).split(" "),
);

/** "Straßenlaufschuh" → "strassenlaufschuh", "niño" → "nino", "randonnée" → "randonnee". */
const germanToAscii = (s: string) =>
  s
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
const stripApostrophes = (s: string) => s.replace(/['’]/g, "");

type Gender = "men" | "women" | "kids" | null;

/** Who the shoe is for, read from the title. null = unisex or not stated. */
export function genderOf(title: string): Gender {
  const t = stripApostrophes(germanToAscii(title.toLowerCase()));
  if (/\b(kids?|boys?|girls?|junior|juniors|infants?|toddlers?|baby|kinder|jungen|maedchen|enfants?|bambin[oia]|ninos?|ninas?|kinderen)\b/.test(t)) return "kids";
  const women = /\b(women|womens|woman|ladies|w|damen|femmes?|donna|mujer|dames)\b/.test(t);
  const men = /\b(men|mens|man|m|herren|hommes?|uomo|hombre|heren)\b/.test(t);
  if (women && !men) return "women";
  if (men && !women) return "men";
  return null;
}

/** Brands whose name is more than one word. */
const MULTI_WORD_BRANDS = [
  "new balance",
  "under armour",
  "red tape",
  "bacca bucci",
  "dr martens",
  "onitsuka tiger",
  "the north face",
  "on running",
  "hush puppies",
  "lee cooper",
];

/** "Nike Performance", "NIKE", "adidas Originals" → "nike" / "adidas", so stores agree on the brand. */
export function normBrand(brand: string): string {
  const b = germanToAscii(brand.toLowerCase())
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const multi = MULTI_WORD_BRANDS.find((m) => b.startsWith(m));
  if (multi) return multi === "on running" ? "on" : multi;
  return b.split(" ")[0] ?? b;
}

export function modelTokens(title: string, brand?: string): string[] {
  let t = stripApostrophes(germanToAscii(title.toLowerCase()))
    // Keep hyphenated model names whole: "Zap-Fast" and "Zap-Run" are different shoes.
    .replace(/([a-z0-9])-(?=[a-z0-9])/g, "$1")
    .replace(/[^a-z0-9]+/g, " ");
  if (brand) {
    const parts = germanToAscii(brand.toLowerCase()).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
    for (const part of parts) t = t.replace(new RegExp(`\\b${part}\\b`, "g"), " ");
  }
  return [...new Set(t.split(" ").filter((w) => w.length > 0 && !NOISE.has(w)))];
}

/**
 * Words that turn a shoe into a different version: "Pegasus 42" vs "Pegasus 42 Trail / GTX / EasyOn".
 * If one title has such a word and the other doesn't, they're different products.
 */
const VARIANTS = new Set(
  (
    "trail gtx goretex gore premium prm shield flyease easyon easy plus pro elite max mid high low wide " +
    "slipins ins next nature retro turbo winter waterproof wp spikeless spike golf se ultd unlimited " +
    "acg tr sp lx"
  ).split(" "),
);

/** 0..1 score of how likely two listings are the same shoe model. */
export function similarity(a: { title: string; brand: string }, b: { title: string; brand: string }): number {
  if (normBrand(a.brand) !== normBrand(b.brand)) return 0;
  // A men's shoe is not the same product as the women's or kids' version.
  const ga = genderOf(a.title);
  const gb = genderOf(b.title);
  if (ga && gb && ga !== gb) return 0;
  const ta = modelTokens(a.title, a.brand);
  const tb = modelTokens(b.title, b.brand);
  if (!ta.length || !tb.length) return 0;
  // Model numbers must agree: Pegasus 40 is not Pegasus 41.
  const na = ta.filter((w) => /\d/.test(w)).sort().join(",");
  const nb = tb.filter((w) => /\d/.test(w)).sort().join(",");
  if (na !== nb) return 0;
  const sa = new Set(ta);
  const sb = new Set(tb);
  if (ta.some((w) => VARIANTS.has(w) && !sb.has(w)) || tb.some((w) => VARIANTS.has(w) && !sa.has(w))) return 0;
  const shared = tb.filter((w) => sa.has(w));
  // Sharing only a number ("2.0") isn't enough; at least one model word must match too.
  if (!shared.some((w) => /[a-z]/.test(w))) return 0;
  const inter = shared.length;
  return (inter / Math.min(ta.length, tb.length)) * (inter / Math.max(ta.length, tb.length)) ** 0.5;
}

// 0.7 means a short title must share all its model words, and a longer one most of them.
// (At 0.6, "Puma Color-Block Sneakers" matched a "Puma Color Block Sweatshirt".)
export const SAME_SHOE = 0.7;

const FOOTWEAR =
  /\b(shoes?|sneakers?|boots?|loafers?|sandals?|slippers?|flip[\s-]?flops?|clogs?|mules?|derby|oxfords?|brogues?|moccasins?|trainers?|spikes?|studs?|cleats?|slides?|floaters?|espadrilles?|footwear|\w*schuhe?|stiefel|sandalen|chaussures?|baskets|scarpe|zapatillas?|zapatos?|\w*schoenen|tenis|botas)\b/i;
const NOT_FOOTWEAR =
  /\b(t-?shirts?|tees?|sweatshirts?|shirts?|jackets?|hoodies?|track\s?pants?|joggers?|trousers?|shorts|socks?|caps?|hats?|backpacks?|bags?|jerseys?|tights|leggings|bottles?|tracksuits?|vests?|bras?|gloves?|watch(es)?|wallets?|belts?|shoe\s?(cleaner|polish|laces?|bags?|rack|care|deodori[sz]er|shiner)|insoles?|socken|jacke|hose)\b/i;
// Flipkart product IDs start with a category code: SHO = shoes, KSS = kids' shoes, SND/SLP/SLI = sandals & slippers.
const FLIPKART_FOOTWEAR_IDS = ["SHO", "KSS", "SND", "SLP", "SLI", "FLF"];

/** Stores pad search results with clothing and accessories; keep only actual footwear. */
export function isFootwear(l: { title: string; store: string; url: string; category?: string }): boolean {
  if (NOT_FOOTWEAR.test(l.title)) return false;
  if (l.category) return /footwear|shoe|schuh/i.test(l.category) || FOOTWEAR.test(l.category);
  if (l.store === "flipkart") {
    const code = l.url.match(/[?&]pid=([A-Z]{3})/)?.[1];
    if (code) return FLIPKART_FOOTWEAR_IDS.includes(code);
  }
  return FOOTWEAR.test(l.title);
}

/** True if the listing's gender doesn't clash with anyone already in the group. */
export function genderFits(l: { title: string }, group: { title: string }[]): boolean {
  const g = genderOf(l.title);
  return (
    !g ||
    group.every((m) => {
      const gm = genderOf(m.title);
      return !gm || gm === g;
    })
  );
}

/** Group listings from all stores into "same shoe" groups. */
export function groupListings(listings: Listing[]): ProductGroup[] {
  const groups: Listing[][] = [];
  for (const l of listings) {
    let best = -1;
    let bestScore = SAME_SHOE;
    groups.forEach((g, i) => {
      if (!genderFits(l, g)) return;
      const s = similarity(l, g[0]);
      if (s >= bestScore) {
        bestScore = s;
        best = i;
      }
    });
    if (best >= 0) groups[best].push(l);
    else groups.push([l]);
  }
  return groups.map((g) => toGroup(g));
}

export function toGroup(listings: Listing[], preferredHead?: Listing): ProductGroup {
  // Keep only the cheapest listing per store, then sort cheapest first.
  const perStore = new Map<string, Listing>();
  for (const l of listings) {
    const cur = perStore.get(l.store);
    if (!cur || l.price < cur.price) perStore.set(l.store, l);
  }
  const offers = [...perStore.values()].sort((a, b) => a.price - b.price);
  const rated = listings.filter((l) => l.rating).sort((a, b) => (b.ratingCount ?? 0) - (a.ratingCount ?? 0))[0];
  const images = [...new Set(listings.flatMap((l) => l.images))];
  const head = preferredHead ?? listings.find((l) => l.store === "myntra" || l.store === "zappos" || l.store.startsWith("zalando")) ?? listings[0];
  const mrp = Math.max(...listings.map((l) => l.mrp));
  const bestPrice = offers[0].price;
  return {
    key: offers[0].id,
    title: head.title.replace(/\s+/g, " ").trim(),
    brand: head.brand,
    currency: offers[0].currency,
    region: (STORES[offers[0].store]?.region ?? "in") as Region,
    image: head.image ?? images[0] ?? null,
    images: images.slice(0, 10),
    offers,
    bestPrice,
    highestPrice: offers[offers.length - 1].price,
    mrp,
    discount: mrp > bestPrice ? Math.round(((mrp - bestPrice) / mrp) * 100) : 0,
    rating: rated?.rating,
    ratingCount: rated?.ratingCount,
  };
}

/** A short search query for a product title, e.g. "Nike Air Zoom Pegasus 41". */
export function queryFor(title: string, brand: string): string {
  return `${brand} ${modelTokens(title, brand).slice(0, 5).join(" ")}`.trim();
}

/** Shorter query for stores we only link to, so their search doesn't come back empty. */
export function linkQueryFor(title: string, brand: string): string {
  return `${brand} ${modelTokens(title, brand).slice(0, 3).join(" ")}`.trim();
}

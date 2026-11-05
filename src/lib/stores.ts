import type { Currency, Region, StoreId } from "./types";

export interface RegionInfo {
  id: Region;
  name: string;
  currency: Currency;
  /** Locale for number/currency formatting. */
  locale: string;
  /** Word for "shoes" that the country's stores understand in search. */
  shoes: string;
}

export const REGIONS: Record<Region, RegionInfo> = {
  in: { id: "in", name: "India", currency: "INR", locale: "en-IN", shoes: "shoes" },
  us: { id: "us", name: "United States", currency: "USD", locale: "en-US", shoes: "shoes" },
  uk: { id: "uk", name: "United Kingdom", currency: "GBP", locale: "en-GB", shoes: "shoes" },
  de: { id: "de", name: "Germany", currency: "EUR", locale: "de-DE", shoes: "shoes" },
  fr: { id: "fr", name: "France", currency: "EUR", locale: "fr-FR", shoes: "chaussures" },
  it: { id: "it", name: "Italy", currency: "EUR", locale: "it-IT", shoes: "scarpe" },
  es: { id: "es", name: "Spain", currency: "EUR", locale: "es-ES", shoes: "zapatillas" },
  nl: { id: "nl", name: "Netherlands", currency: "EUR", locale: "nl-NL", shoes: "schoenen" },
  ca: { id: "ca", name: "Canada", currency: "CAD", locale: "en-CA", shoes: "shoes" },
  au: { id: "au", name: "Australia", currency: "AUD", locale: "en-AU", shoes: "shoes" },
  jp: { id: "jp", name: "Japan", currency: "JPY", locale: "ja-JP", shoes: "shoes" },
  ae: { id: "ae", name: "UAE", currency: "AED", locale: "en-AE", shoes: "shoes" },
  sg: { id: "sg", name: "Singapore", currency: "SGD", locale: "en-SG", shoes: "shoes" },
  mx: { id: "mx", name: "Mexico", currency: "MXN", locale: "es-MX", shoes: "tenis" },
};

export const REGION_IDS = Object.keys(REGIONS) as Region[];
export const isRegion = (r: unknown): r is Region => typeof r === "string" && r in REGIONS;

/** How a live store is read (see server/adapters.ts). */
export type Engine =
  | { type: "amazon"; host: string }
  | { type: "nike"; path: string }
  | { type: "zalando"; host: string }
  | { type: "custom" };

export interface StoreInfo {
  id: StoreId;
  name: string;
  region: Region;
  /** Brand colour used for the store badge. */
  color: string;
  /** "live" = prices and images are fetched from the store. "link" = we only link to the store's search. */
  mode: "live" | "link";
  engine?: Engine;
  /** For official brand stores: the brand they sell. */
  brand?: string;
  search: (q: string) => string;
}

const enc = encodeURIComponent;
const plus = (q: string) => enc(q).replace(/%20/g, "+");
const slug = (q: string) =>
  q
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* ---------- building blocks shared by many countries ---------- */

const amazon = (region: Region, host: string, name: string): StoreInfo => ({
  id: `amazon_${region}`,
  name,
  region,
  color: "#ff9900",
  mode: "live",
  engine: { type: "amazon", host },
  search: (q) => `https://${host}/s?k=${plus(q)}`,
});

const nike = (region: Region, path: string): StoreInfo => ({
  id: `nike_${region}`,
  name: "Nike",
  region,
  color: "#111111",
  mode: "live",
  brand: "nike",
  engine: { type: "nike", path },
  search: (q) => `https://www.nike.com${path}/w?q=${enc(q)}`,
});

const zalando = (region: Region, host: string, catalog: string): StoreInfo => ({
  id: `zalando_${region}`,
  name: "Zalando",
  region,
  color: "#ff6900",
  mode: "live",
  engine: { type: "zalando", host },
  search: (q) => `https://${host}/${catalog}/?q=${plus(q)}`,
});

const link = (region: Region, id: string, name: string, color: string, search: (q: string) => string, brand?: string): StoreInfo => ({
  id: `${id}_${region}`,
  name,
  region,
  color,
  mode: "link",
  brand,
  search,
});

const list: StoreInfo[] = [
  /* ---------- India ---------- */
  { id: "flipkart", name: "Flipkart", region: "in", color: "#2874f0", mode: "live", engine: { type: "custom" }, search: (q) => `https://www.flipkart.com/search?q=${enc(q)}` },
  { id: "myntra", name: "Myntra", region: "in", color: "#ff3f6c", mode: "live", engine: { type: "custom" }, search: (q) => `https://www.myntra.com/${slug(q)}?rawQuery=${enc(q)}` },
  amazon("in", "www.amazon.in", "Amazon.in"),
  { id: "ajio", name: "AJIO", region: "in", color: "#2c4152", mode: "live", engine: { type: "custom" }, search: (q) => `https://www.ajio.com/search/?text=${enc(q)}` },
  { id: "skechers_in", name: "Skechers", region: "in", color: "#0047bb", mode: "live", engine: { type: "custom" }, brand: "skechers", search: (q) => `https://www.skechers.in/search?q=${enc(q)}` },
  link("in", "tatacliq", "Tata CLiQ", "#da1c5c", (q) => `https://www.tatacliq.com/search/?searchCategory=all&text=${enc(q)}`),
  link("in", "nykaa", "Nykaa Fashion", "#e80071", (q) => `https://www.nykaafashion.com/catalogsearch/result/?q=${enc(q)}`),
  link("in", "nike", "Nike", "#111111", (q) => `https://www.nike.com/in/w?q=${enc(q)}`, "nike"),
  link("in", "adidas", "Adidas", "#000000", (q) => `https://www.adidas.co.in/search?q=${enc(q)}`, "adidas"),
  link("in", "puma", "Puma", "#c8102e", (q) => `https://in.puma.com/in/en/search?q=${enc(q)}`, "puma"),
  link("in", "baccabucci", "Bacca Bucci", "#1a1a1a", (q) => `https://baccabucci.com/search?q=${enc(q)}`, "bacca bucci"),
  link("in", "redtape", "Red Tape", "#c4161c", (q) => `https://redtape.com/search?q=${enc(q)}`, "red tape"),
  link("in", "campus", "Campus", "#e30613", (q) => `https://www.campusshoes.com/search?q=${enc(q)}`, "campus"),
  link("in", "asics", "ASICS", "#001e62", (q) => `https://www.asics.com/in/en-in/search?q=${enc(q)}`, "asics"),

  /* ---------- United States ---------- */
  { id: "zappos", name: "Zappos", region: "us", color: "#003953", mode: "live", engine: { type: "custom" }, search: (q) => `https://www.zappos.com/search?term=${enc(q)}` },
  { id: "sixpm", name: "6pm", region: "us", color: "#e2231a", mode: "live", engine: { type: "custom" }, search: (q) => `https://www.6pm.com/search?term=${enc(q)}` },
  { id: "walmart", name: "Walmart", region: "us", color: "#0071dc", mode: "live", engine: { type: "custom" }, search: (q) => `https://www.walmart.com/search?q=${plus(q)}` },
  nike("us", ""),
  link("us", "amazon", "Amazon", "#ff9900", (q) => `https://www.amazon.com/s?k=${plus(q)}`),
  link("us", "footlocker", "Foot Locker", "#121212", (q) => `https://www.footlocker.com/search?query=${enc(q)}`),
  link("us", "dsw", "DSW", "#000000", (q) => `https://www.dsw.com/search?searchTerm=${enc(q)}`),
  link("us", "dicks", "Dick's", "#00573f", (q) => `https://www.dickssportinggoods.com/search/SearchDisplay?searchTerm=${enc(q)}`),
  link("us", "nordstrom", "Nordstrom", "#000000", (q) => `https://www.nordstrom.com/sr?keyword=${enc(q)}`),
  link("us", "kohls", "Kohl's", "#859d2f", (q) => `https://www.kohls.com/search.jsp?search=${plus(q)}`),
  link("us", "finishline", "Finish Line", "#000000", (q) => `https://www.finishline.com/plp/all-products?query=${enc(q)}`),
  link("us", "adidas", "Adidas", "#000000", (q) => `https://www.adidas.com/us/search?q=${enc(q)}`, "adidas"),
  link("us", "newbalance", "New Balance", "#cf0a2c", (q) => `https://www.newbalance.com/search?q=${enc(q)}`, "new balance"),
  link("us", "puma", "Puma", "#c8102e", (q) => `https://us.puma.com/us/en/search?q=${enc(q)}`, "puma"),
  link("us", "asics", "ASICS", "#001e62", (q) => `https://www.asics.com/us/en-us/search?q=${enc(q)}`, "asics"),
  link("us", "hoka", "HOKA", "#1a1a1a", (q) => `https://www.hoka.com/en/us/search?q=${enc(q)}`, "hoka"),
  link("us", "on", "On", "#1a1a1a", (q) => `https://www.on.com/en-us/search?q=${enc(q)}`, "on"),
  link("us", "brooks", "Brooks", "#003a70", (q) => `https://www.brooksrunning.com/en_us/search?q=${enc(q)}`, "brooks"),
  link("us", "converse", "Converse", "#000000", (q) => `https://www.converse.com/shop/search?q=${enc(q)}`, "converse"),
  link("us", "vans", "Vans", "#c8102e", (q) => `https://www.vans.com/en-us/search?q=${enc(q)}`, "vans"),
  link("us", "skechers", "Skechers", "#0047bb", (q) => `https://www.skechers.com/search/?q=${plus(q)}`, "skechers"),

  /* ---------- United Kingdom ---------- */
  amazon("uk", "www.amazon.co.uk", "Amazon.co.uk"),
  nike("uk", "/gb"),
  link("uk", "jdsports", "JD Sports", "#000000", (q) => `https://www.jdsports.co.uk/search/${enc(q)}/`),
  link("uk", "asos", "ASOS", "#2d2d2d", (q) => `https://www.asos.com/search/?q=${plus(q)}`),
  link("uk", "schuh", "Schuh", "#000000", (q) => `https://www.schuh.co.uk/search/?q=${plus(q)}`),
  link("uk", "office", "Office", "#000000", (q) => `https://www.office.co.uk/search?q=${plus(q)}`),
  link("uk", "sportsdirect", "Sports Direct", "#0a2240", (q) => `https://www.sportsdirect.com/searchresults?descriptionfilter=${plus(q)}`),
  link("uk", "footlocker", "Foot Locker", "#121212", (q) => `https://www.footlocker.co.uk/en/search?query=${enc(q)}`),
  link("uk", "adidas", "Adidas", "#000000", (q) => `https://www.adidas.co.uk/search?q=${enc(q)}`, "adidas"),

  /* ---------- Germany ---------- */
  amazon("de", "www.amazon.de", "Amazon.de"),
  zalando("de", "www.zalando.de", "katalog"),
  nike("de", "/de"),
  link("de", "aboutyou", "About You", "#000000", (q) => `https://www.aboutyou.de/suche?term=${enc(q)}`),
  link("de", "footlocker", "Foot Locker", "#121212", (q) => `https://www.footlocker.de/de/search?query=${enc(q)}`),
  link("de", "snipes", "Snipes", "#e30613", (q) => `https://www.snipes.com/search?q=${plus(q)}`),
  link("de", "deichmann", "Deichmann", "#e2001a", (q) => `https://www.deichmann.com/de-de/search?q=${enc(q)}`),
  link("de", "otto", "OTTO", "#f00020", (q) => `https://www.otto.de/suche/${enc(q)}/`),
  link("de", "sportscheck", "SportScheck", "#003da5", (q) => `https://www.sportscheck.com/search/?q=${plus(q)}`),
  link("de", "adidas", "Adidas", "#000000", (q) => `https://www.adidas.de/search?q=${enc(q)}`, "adidas"),
  link("de", "puma", "Puma", "#c8102e", (q) => `https://eu.puma.com/de/de/search?q=${enc(q)}`, "puma"),
  link("de", "birkenstock", "Birkenstock", "#1d3c34", (q) => `https://www.birkenstock.com/de/search?q=${enc(q)}`, "birkenstock"),

  /* ---------- France ---------- */
  amazon("fr", "www.amazon.fr", "Amazon.fr"),
  zalando("fr", "www.zalando.fr", "catalogue"),
  nike("fr", "/fr"),
  link("fr", "courir", "Courir", "#000000", (q) => `https://www.courir.com/fr/search?q=${plus(q)}`),
  link("fr", "footlocker", "Foot Locker", "#121212", (q) => `https://www.footlocker.fr/fr/search?query=${enc(q)}`),
  link("fr", "sarenza", "Sarenza", "#000000", (q) => `https://www.sarenza.com/store/product/list/view/search.aspx?search=${plus(q)}`),
  link("fr", "adidas", "Adidas", "#000000", (q) => `https://www.adidas.fr/search?q=${enc(q)}`, "adidas"),

  /* ---------- Italy ---------- */
  amazon("it", "www.amazon.it", "Amazon.it"),
  zalando("it", "www.zalando.it", "catalogo"),
  nike("it", "/it"),
  link("it", "footlocker", "Foot Locker", "#121212", (q) => `https://www.footlocker.it/it/search?query=${enc(q)}`),
  link("it", "aw-lab", "AW LAB", "#e30613", (q) => `https://www.aw-lab.com/it-it/search?q=${plus(q)}`),
  link("it", "adidas", "Adidas", "#000000", (q) => `https://www.adidas.it/search?q=${enc(q)}`, "adidas"),

  /* ---------- Spain ---------- */
  amazon("es", "www.amazon.es", "Amazon.es"),
  zalando("es", "www.zalando.es", "catalogo"),
  nike("es", "/es"),
  link("es", "elcorteingles", "El Corte Inglés", "#00753c", (q) => `https://www.elcorteingles.es/search-nwx/1/?s=${plus(q)}`),
  link("es", "footlocker", "Foot Locker", "#121212", (q) => `https://www.footlocker.es/es/search?query=${enc(q)}`),
  link("es", "adidas", "Adidas", "#000000", (q) => `https://www.adidas.es/search?q=${enc(q)}`, "adidas"),

  /* ---------- Netherlands ---------- */
  amazon("nl", "www.amazon.nl", "Amazon.nl"),
  zalando("nl", "www.zalando.nl", "catalogus"),
  nike("nl", "/nl"),
  link("nl", "bol", "bol", "#0000a4", (q) => `https://www.bol.com/nl/nl/s/?searchtext=${plus(q)}`),
  link("nl", "footlocker", "Foot Locker", "#121212", (q) => `https://www.footlocker.nl/nl/search?query=${enc(q)}`),
  link("nl", "adidas", "Adidas", "#000000", (q) => `https://www.adidas.nl/search?q=${enc(q)}`, "adidas"),

  /* ---------- Canada ---------- */
  amazon("ca", "www.amazon.ca", "Amazon.ca"),
  nike("ca", "/ca"),
  link("ca", "sportchek", "Sport Chek", "#d6001c", (q) => `https://www.sportchek.ca/search.html?q=${plus(q)}`),
  link("ca", "footlocker", "Foot Locker", "#121212", (q) => `https://www.footlocker.ca/en/search?query=${enc(q)}`),
  link("ca", "softmoc", "SoftMoc", "#000000", (q) => `https://www.softmoc.com/ca/search?q=${plus(q)}`),
  link("ca", "adidas", "Adidas", "#000000", (q) => `https://www.adidas.ca/en/search?q=${enc(q)}`, "adidas"),

  /* ---------- Australia ---------- */
  amazon("au", "www.amazon.com.au", "Amazon.com.au"),
  nike("au", "/au"),
  link("au", "theiconic", "THE ICONIC", "#000000", (q) => `https://www.theiconic.com.au/catalog/?q=${plus(q)}`),
  link("au", "rebel", "Rebel", "#e2001a", (q) => `https://www.rebelsport.com.au/search?q=${plus(q)}`),
  link("au", "platypus", "Platypus", "#000000", (q) => `https://www.platypusshoes.com.au/catalogsearch/result/?q=${plus(q)}`),
  link("au", "footlocker", "Foot Locker", "#121212", (q) => `https://www.footlocker.com.au/en/search?query=${enc(q)}`),

  /* ---------- Japan ---------- */
  amazon("jp", "www.amazon.co.jp", "Amazon.co.jp"),
  nike("jp", "/jp"),
  link("jp", "abcmart", "ABC-Mart", "#e60012", (q) => `https://www.abc-mart.net/shop/goods/search.aspx?keyword=${enc(q)}`),
  link("jp", "rakuten", "Rakuten", "#bf0000", (q) => `https://search.rakuten.co.jp/search/mall/${enc(q)}/`),

  /* ---------- UAE ---------- */
  amazon("ae", "www.amazon.ae", "Amazon.ae"),
  link("ae", "noon", "noon", "#feee00", (q) => `https://www.noon.com/uae-en/search/?q=${enc(q)}`),
  link("ae", "namshi", "Namshi", "#000000", (q) => `https://www.namshi.com/uae-en/search?q=${enc(q)}`),
  link("ae", "levelshoes", "Level Shoes", "#000000", (q) => `https://www.levelshoes.com/catalogsearch/result/?q=${plus(q)}`),
  link("ae", "nike", "Nike", "#111111", (q) => `https://www.nike.ae/en/search?q=${enc(q)}`, "nike"),

  /* ---------- Singapore ---------- */
  amazon("sg", "www.amazon.sg", "Amazon.sg"),
  nike("sg", "/sg"),
  link("sg", "zalora", "Zalora", "#000000", (q) => `https://www.zalora.sg/search?q=${plus(q)}`),
  link("sg", "footlocker", "Foot Locker", "#121212", (q) => `https://www.footlocker.sg/en/search?query=${enc(q)}`),

  /* ---------- Mexico ---------- */
  amazon("mx", "www.amazon.com.mx", "Amazon.com.mx"),
  nike("mx", "/mx"),
  link("mx", "mercadolibre", "Mercado Libre", "#ffe600", (q) => `https://listado.mercadolibre.com.mx/${slug(q)}`),
  link("mx", "liverpool", "Liverpool", "#e10098", (q) => `https://www.liverpool.com.mx/tienda?s=${plus(q)}`),
  link("mx", "innovasport", "Innovasport", "#000000", (q) => `https://www.innovasport.com/search?text=${plus(q)}`),
];

export const STORES: Record<StoreId, StoreInfo> = Object.fromEntries(list.map((s) => [s.id, s]));
export const ALL_STORES = list;

export const storesIn = (region: Region) => list.filter((s) => s.region === region);
export const liveStoresIn = (region: Region) => storesIn(region).filter((s) => s.mode === "live");

/* ---------- Brands ---------- */

/** Famous global brands, shown in every country. */
const GLOBAL_BRANDS = [
  "Nike", "Adidas", "Puma", "New Balance", "ASICS", "Converse", "Vans", "Reebok",
  "Skechers", "Hoka", "On", "Salomon", "Jordan", "Under Armour", "Crocs", "Birkenstock",
  "Dr. Martens", "Timberland", "Onitsuka Tiger", "Mizuno", "Saucony", "Brooks", "Fila", "Veja",
];

/** Brands shown in the marquee and the "shop by brand" section, per country: local favourites first. */
const RAW_BRANDS: Record<Region, string[]> = {
  in: [
    "Nike", "Adidas", "Puma", "Red Tape", "Bacca Bucci", "Skechers", "ASICS", "New Balance",
    "Campus", "Reebok", "Woodland", "Converse", "Crocs", "Bata", "HRX", "Hoka",
    "Sparx", "Liberty", "Metro", "Hush Puppies", "Clarks", "Fila", "Onitsuka Tiger", "Vans",
  ],
  us: [
    "Nike", "Adidas", "New Balance", "Hoka", "On", "Brooks", "ASICS", "Converse",
    "Vans", "Saucony", "Skechers", "Puma", "Reebok", "Crocs", "Timberland", "Jordan",
    "Under Armour", "Allbirds", "Merrell", "Salomon", "Altra", "Dr. Martens", "Clarks", "UGG",
  ],
  uk: [...GLOBAL_BRANDS.slice(0, 20), "Clarks", "Kickers", "Hunter", "Joules"],
  de: [
    "Adidas", "Puma", "Nike", "Birkenstock", "New Balance", "ASICS", "On", "Hoka",
    "Salomon", "Ecco", "Lowa", "Converse", "Vans", "Dr. Martens", "Onitsuka Tiger", "Veja",
    "Meindl", "Geox", "Tamaris", "Rieker", "Lloyd", "Hummel", "Mizuno", "Jack Wolfskin",
  ],
  fr: [...GLOBAL_BRANDS.slice(0, 20), "Veja", "Le Coq Sportif", "Kickers", "Palladium"],
  it: [...GLOBAL_BRANDS.slice(0, 20), "Diadora", "Superga", "Geox", "Lotto"],
  es: [...GLOBAL_BRANDS.slice(0, 20), "Munich", "Joma", "Camper", "Kelme"],
  nl: [...GLOBAL_BRANDS.slice(0, 20), "Veja", "Floris van Bommel", "Mexx", "Hummel"],
  ca: [...GLOBAL_BRANDS.slice(0, 20), "Merrell", "Sorel", "Kodiak", "Allbirds"],
  au: [...GLOBAL_BRANDS.slice(0, 20), "Blundstone", "Volley", "UGG", "R.M. Williams"],
  jp: [...GLOBAL_BRANDS.slice(0, 20), "Onitsuka Tiger", "Mizuno", "Moonstar", "Asahi"],
  ae: [...GLOBAL_BRANDS.slice(0, 24)],
  sg: [...GLOBAL_BRANDS.slice(0, 24)],
  mx: [...GLOBAL_BRANDS.slice(0, 20), "Flexi", "Panam", "Charly", "Andrea"],
};

export const BRANDS = Object.fromEntries(
  Object.entries(RAW_BRANDS).map(([r, list]) => [r, [...new Set(list)]]),
) as Record<Region, string[]>;

/* ---------- Sports ---------- */

export interface Sport {
  id: string;
  label: string;
  q: string;
}

const s = (id: string, label: string, q: string): Sport => ({ id, label, q });

const EN_SPORTS = [
  s("running", "Running", "running shoes"),
  s("football", "Football", "football boots"),
  s("basketball", "Basketball", "basketball shoes"),
  s("training", "Training", "training shoes"),
  s("walking", "Walking", "walking shoes"),
  s("hiking", "Hiking", "hiking shoes"),
  s("tennis", "Tennis", "tennis shoes"),
  s("trail", "Trail running", "trail running shoes"),
];

export const SPORTS: Record<Region, Sport[]> = {
  in: [
    s("running", "Running", "running shoes"),
    s("basketball", "Basketball", "basketball shoes"),
    s("football", "Football", "football shoes"),
    s("training", "Gym & Training", "training shoes"),
    s("walking", "Walking", "walking shoes"),
    s("hiking", "Hiking", "trekking shoes"),
    s("cricket", "Cricket", "cricket shoes"),
    s("tennis", "Badminton & Tennis", "badminton shoes"),
  ],
  us: [
    s("running", "Running", "running shoes"),
    s("basketball", "Basketball", "basketball shoes"),
    s("football", "Soccer", "soccer cleats"),
    s("training", "Training", "training shoes"),
    s("walking", "Walking", "walking shoes"),
    s("hiking", "Hiking", "hiking shoes"),
    s("tennis", "Tennis", "tennis shoes"),
    s("golf", "Golf", "golf shoes"),
  ],
  uk: EN_SPORTS,
  de: EN_SPORTS,
  fr: [
    s("running", "Running", "chaussures running"),
    s("football", "Football", "chaussures de foot"),
    s("basketball", "Basketball", "chaussures de basket"),
    s("training", "Training", "chaussures de training"),
    s("walking", "Walking", "chaussures de marche"),
    s("hiking", "Hiking", "chaussures de randonnée"),
    s("tennis", "Tennis", "chaussures de tennis"),
    s("trail", "Trail running", "chaussures de trail"),
  ],
  it: [
    s("running", "Running", "scarpe running"),
    s("football", "Football", "scarpe da calcio"),
    s("basketball", "Basketball", "scarpe da basket"),
    s("training", "Training", "scarpe da training"),
    s("walking", "Walking", "scarpe da camminata"),
    s("hiking", "Hiking", "scarpe da trekking"),
    s("tennis", "Tennis", "scarpe da tennis"),
    s("trail", "Trail running", "scarpe trail running"),
  ],
  es: [
    s("running", "Running", "zapatillas running"),
    s("football", "Football", "botas de fútbol"),
    s("basketball", "Basketball", "zapatillas de baloncesto"),
    s("training", "Training", "zapatillas de training"),
    s("walking", "Walking", "zapatillas para caminar"),
    s("hiking", "Hiking", "zapatillas de senderismo"),
    s("tennis", "Tennis", "zapatillas de tenis"),
    s("trail", "Trail running", "zapatillas trail running"),
  ],
  nl: [
    s("running", "Running", "hardloopschoenen"),
    s("football", "Football", "voetbalschoenen"),
    s("basketball", "Basketball", "basketbalschoenen"),
    s("training", "Training", "trainingsschoenen"),
    s("walking", "Walking", "wandelschoenen"),
    s("hiking", "Hiking", "bergschoenen"),
    s("tennis", "Tennis", "tennisschoenen"),
    s("trail", "Trail running", "trailschoenen"),
  ],
  ca: [
    s("running", "Running", "running shoes"),
    s("basketball", "Basketball", "basketball shoes"),
    s("football", "Soccer", "soccer cleats"),
    s("training", "Training", "training shoes"),
    s("walking", "Walking", "walking shoes"),
    s("hiking", "Hiking", "hiking shoes"),
    s("winter", "Winter boots", "winter boots"),
    s("tennis", "Tennis", "tennis shoes"),
  ],
  au: EN_SPORTS,
  jp: EN_SPORTS,
  ae: EN_SPORTS,
  sg: EN_SPORTS,
  mx: [
    s("running", "Running", "tenis para correr"),
    s("football", "Football", "tacos de fútbol"),
    s("basketball", "Basketball", "tenis de basquetbol"),
    s("training", "Training", "tenis de entrenamiento"),
    s("walking", "Walking", "tenis para caminar"),
    s("hiking", "Hiking", "botas de senderismo"),
    s("tennis", "Tennis", "tenis para tenis"),
    s("trail", "Trail running", "tenis trail running"),
  ],
};

/**
 * Boots worn by star players.
 *
 * No data feed says which boots a player wears in a given match, so this is a
 * hand-kept list based on each player's public boot deal / signature line.
 * Keep it to players you're confident about, and update it when deals change.
 * `model: null` means we know the brand but the exact line varies.
 */
export interface StarBoots {
  slug: string;
  name: string;
  /** Other spellings used by score feeds. */
  aliases?: string[];
  club: string;
  brand: string;
  model: string | null;
}

export const STAR_BOOTS: StarBoots[] = [
  { slug: "cristiano-ronaldo", name: "Cristiano Ronaldo", club: "Al Nassr / Portugal", brand: "Nike", model: "Nike Mercurial Superfly" },
  { slug: "kylian-mbappe", name: "Kylian Mbappé", club: "Real Madrid / France", brand: "Nike", model: "Nike Mercurial" },
  { slug: "vinicius-junior", name: "Vinícius Júnior", aliases: ["Vinicius Jr.", "Vinícius Jr.", "Vinicius Junior"], club: "Real Madrid / Brazil", brand: "Nike", model: "Nike Mercurial" },
  { slug: "erling-haaland", name: "Erling Haaland", club: "Manchester City / Norway", brand: "Nike", model: "Nike Phantom" },
  { slug: "harry-kane", name: "Harry Kane", club: "Bayern Munich / England", brand: "Nike", model: "Nike Phantom" },
  { slug: "kevin-de-bruyne", name: "Kevin De Bruyne", club: "Napoli / Belgium", brand: "Nike", model: "Nike Phantom" },
  { slug: "lionel-messi", name: "Lionel Messi", club: "Inter Miami / Argentina", brand: "adidas", model: "adidas F50" },
  { slug: "lamine-yamal", name: "Lamine Yamal", club: "Barcelona / Spain", brand: "adidas", model: "adidas F50" },
  { slug: "jude-bellingham", name: "Jude Bellingham", club: "Real Madrid / England", brand: "adidas", model: "adidas Predator" },
  { slug: "bukayo-saka", name: "Bukayo Saka", club: "Arsenal / England", brand: "New Balance", model: "New Balance Furon" },
  { slug: "neymar", name: "Neymar", aliases: ["Neymar Jr", "Neymar Jr."], club: "Santos / Brazil", brand: "Puma", model: "Puma Future" },
  { slug: "mohamed-salah", name: "Mohamed Salah", club: "Liverpool / Egypt", brand: "adidas", model: null },
  { slug: "antoine-griezmann", name: "Antoine Griezmann", club: "Atlético Madrid", brand: "Puma", model: null },
  { slug: "jack-grealish", name: "Jack Grealish", club: "England", brand: "Puma", model: null },
  { slug: "virgil-van-dijk", name: "Virgil van Dijk", club: "Liverpool / Netherlands", brand: "Nike", model: null },
  { slug: "marcus-rashford", name: "Marcus Rashford", club: "England", brand: "Nike", model: null },
  { slug: "robert-lewandowski", name: "Robert Lewandowski", club: "Barcelona / Poland", brand: "Nike", model: null },
  { slug: "phil-foden", name: "Phil Foden", club: "Manchester City / England", brand: "Nike", model: null },
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const INDEX = new Map<string, StarBoots>();
for (const p of STAR_BOOTS) for (const n of [p.name, ...(p.aliases ?? [])]) INDEX.set(norm(n), p);

/** Find a star by the name a score feed uses ("Kylian Mbappé", "Vinícius Júnior"…). */
export const starByName = (name: string) => INDEX.get(norm(name));
export const starBySlug = (slug: string) => STAR_BOOTS.find((p) => p.slug === slug);

/** What we call the boots, e.g. "Nike Mercurial" or "adidas football boots". */
export const bootsLabel = (p: StarBoots) => p.model ?? `${p.brand} football boots`;

/** Competitions we show, most followed first. `id` is the data provider's league code. */
export interface League {
  id: string;
  slug: string;
  name: string;
  country: string;
}

export const LEAGUES: League[] = [
  { id: "uefa.champions", slug: "champions-league", name: "UEFA Champions League", country: "Europe" },
  { id: "eng.1", slug: "premier-league", name: "Premier League", country: "England" },
  { id: "esp.1", slug: "laliga", name: "LaLiga", country: "Spain" },
  { id: "ger.1", slug: "bundesliga", name: "Bundesliga", country: "Germany" },
  { id: "ita.1", slug: "serie-a", name: "Serie A", country: "Italy" },
  { id: "fra.1", slug: "ligue-1", name: "Ligue 1", country: "France" },
  { id: "uefa.europa", slug: "europa-league", name: "UEFA Europa League", country: "Europe" },
  { id: "uefa.europa.conf", slug: "conference-league", name: "UEFA Conference League", country: "Europe" },
  { id: "ind.1", slug: "indian-super-league", name: "Indian Super League", country: "India" },
  { id: "usa.1", slug: "mls", name: "MLS", country: "USA" },
  { id: "ned.1", slug: "eredivisie", name: "Eredivisie", country: "Netherlands" },
  { id: "por.1", slug: "primeira-liga", name: "Primeira Liga", country: "Portugal" },
  { id: "mex.1", slug: "liga-mx", name: "Liga MX", country: "Mexico" },
  { id: "bra.1", slug: "brasileirao", name: "Brasileirão", country: "Brazil" },
  { id: "arg.1", slug: "argentina-primera", name: "Liga Profesional Argentina", country: "Argentina" },
  { id: "tur.1", slug: "super-lig", name: "Süper Lig", country: "Turkey" },
  { id: "sco.1", slug: "scottish-premiership", name: "Scottish Premiership", country: "Scotland" },
  { id: "eng.2", slug: "championship", name: "EFL Championship", country: "England" },
  { id: "fifa.world", slug: "world-cup", name: "FIFA World Cup", country: "World" },
  { id: "fifa.friendly", slug: "international-friendlies", name: "International Friendlies", country: "World" },
];

export const leagueById = (id: string) => LEAGUES.find((l) => l.id === id);
export const leagueBySlug = (slug: string) => LEAGUES.find((l) => l.slug === slug);

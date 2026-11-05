export type MatchState = "pre" | "in" | "post";

export interface TeamSide {
  id: string;
  name: string;
  short: string;
  abbr: string;
  logo: string | null;
  color: string | null;
  score: number | null;
  form?: string;
}

export interface Match {
  id: string;
  league: { id: string; slug: string; name: string };
  date: string; // ISO kick-off
  state: MatchState;
  /** "34'", "HT", "FT", or kick-off time text. */
  status: string;
  home: TeamSide;
  away: TeamSide;
  venue?: string;
}

export interface MatchEvent {
  minute: string;
  kind: "goal" | "yellow" | "red" | "sub" | "period" | "other";
  side: "home" | "away" | null;
  text: string;
}

export interface MatchStat {
  label: string;
  home: string;
  away: string;
}

export interface LineupPlayer {
  name: string;
  jersey: string;
  position: string;
  starter: boolean;
  subbedIn: boolean;
  subbedOut: boolean;
  /** Slug in STAR_BOOTS if we know this player's boots. */
  star?: string;
}

export interface MatchDetail extends Match {
  events: MatchEvent[];
  stats: MatchStat[];
  lineups: { home: LineupPlayer[]; away: LineupPlayer[]; homeFormation?: string; awayFormation?: string };
  commentary: { minute: string; text: string }[];
  /** Star players in this match whose boots we know. */
  stars: { slug: string; side: "home" | "away" }[];
}

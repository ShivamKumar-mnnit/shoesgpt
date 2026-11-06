import { cacheLife } from "next/cache";
import { leagueMatches, liveAndToday, matchDetail, standings, teamSchedule, teamsInLeague } from "./espn";

/*
 * Cached football data for server-rendered pages (what search engines see).
 * Scores refresh about every 30 seconds; the browser keeps polling for live updates.
 */

export async function getLiveMatches() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 600 });
  return liveAndToday();
}

export async function getLeagueMatches(leagueId: string) {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 600 });
  return leagueMatches(leagueId);
}

export async function getMatch(leagueId: string, id: string) {
  "use cache";
  cacheLife({ stale: 20, revalidate: 20, expire: 600 });
  return matchDetail(leagueId, id);
}

export async function getStandings(leagueId: string) {
  "use cache";
  cacheLife("hours");
  return standings(leagueId).catch(() => []);
}

export async function getTeam(leagueId: string, teamId: string) {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  return teamSchedule(leagueId, teamId);
}

export async function getTeams(leagueId: string) {
  "use cache";
  cacheLife("days");
  return teamsInLeague(leagueId).catch(() => []);
}

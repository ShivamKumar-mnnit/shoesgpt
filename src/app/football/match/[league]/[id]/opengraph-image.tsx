import { ImageResponse } from "next/og";
import { getMatch } from "@/lib/football/data";
import { leagueBySlug } from "@/lib/football/leagues";

export const alt = "Match score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share image for a match: both teams, their crests and the score. */
export default async function MatchImage({ params }: { params: Promise<{ league: string; id: string }> }) {
  const { league, id } = await params;
  const l = leagueBySlug(league);
  const m = l ? await getMatch(l.id, id).catch(() => null) : null;
  const status = !m ? "" : m.state === "in" ? `LIVE ${m.status}` : m.state === "post" ? "FULL TIME" : "UPCOMING";

  const team = (t: { name: string; logo: string | null } | undefined) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 360 }}>
      {t?.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.logo} width={180} height={180} alt="" style={{ objectFit: "contain" }} />
      ) : (
        <div style={{ width: 180, height: 180, borderRadius: 90, background: "#e9e4da", display: "flex" }} />
      )}
      <div style={{ marginTop: 24, fontSize: 44, fontWeight: 800, textAlign: "center", color: "#121212", display: "flex" }}>{t?.name ?? ""}</div>
    </div>
  );

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f3f0ea", padding: 56, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: "#3a3a3a" }}>
          <span>{m?.league.name ?? "Football"}</span>
          <span style={{ color: m?.state === "in" ? "#e11d48" : "#3a3a3a", fontWeight: 800 }}>{status}</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {team(m?.home)}
          <div style={{ display: "flex", fontSize: 150, fontWeight: 900, color: "#121212" }}>
            {m && m.state !== "pre" ? `${m.home.score}-${m.away.score}` : "vs"}
          </div>
          {team(m?.away)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#3a3a3a" }}>
          <span style={{ fontWeight: 800, color: "#121212" }}>shoesGPT</span>
          <span>Live score · lineups · players&apos; boots</span>
        </div>
      </div>
    ),
    size,
  );
}

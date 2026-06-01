import { useParams } from "react-router-dom";
import type { PlayerStat } from "../api/types";
import { MatchList, type MatchSummary } from "../components/MatchList";
import { Panel } from "../components/Panel";
import { StatTable } from "../components/StatTable";
import { ErrorView, Loading } from "../components/StateViews";
import { usePlayer, usePlayerHistory, usePlayerStats } from "../query/hooks";

function toSummary(stat: PlayerStat): MatchSummary {
  return {
    matchId: stat.matchId,
    season: stat.season,
    tournamentName: stat.tournamentName,
    context: `${stat.clubName ?? "—"} · ${stat.goals} goals`,
  };
}

function formatBirthday(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function PlayerPage() {
  const { playerId = "" } = useParams();
  const profile = usePlayer(playerId);
  const history = usePlayerHistory(playerId);
  const stats = usePlayerStats(playerId);

  if (profile.isPending) return <Loading />;
  if (profile.isError) return <ErrorView error={profile.error} notFoundLabel="Player not found" />;

  const p = profile.data;
  const headerBits = [p.clubName, p.age != null ? `Age ${p.age}` : null, formatBirthday(p.dateOfBirth)].filter(
    Boolean,
  );

  return (
    <section className="stack">
      <div className="page-head">
        <h1 className="title">
          {p.jerseyNumber && <span className="jersey">#{p.jerseyNumber}</span>}
          {p.name}
        </h1>
        <p className="subtitle">{headerBits.join(" · ")}</p>
      </div>

      <Panel>
        <h2 className="section-title">Season history</h2>
        {history.isPending && <Loading />}
        {history.isError && <ErrorView error={history.error} notFoundLabel="No history" />}
        {history.data &&
          (history.data.history.length === 0 ? (
            <p className="status">No matches played yet.</p>
          ) : (
            <StatTable entries={history.data.history} totals={history.data.totals} />
          ))}
      </Panel>

      <Panel>
        <h2 className="section-title">Matches</h2>
        {stats.isPending && <Loading />}
        {stats.isError && <ErrorView error={stats.error} notFoundLabel="No matches" />}
        {stats.data && <MatchList matches={stats.data.stats.map(toSummary)} />}
      </Panel>
    </section>
  );
}

import React from "react";
import { useParams } from "react-router-dom";
import { LineScoreTable } from "../components/LineScoreTable";
import { MatchRoster } from "../components/MatchRoster";
import { Panel } from "../components/Panel";
import { ErrorView, Loading } from "../components/StateViews";
import { useMatch } from "../query/hooks";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function MatchPage() {
  const { matchId = "" } = useParams();
  const { data, isPending, isError, error } = useMatch(matchId);

  if (isPending) return <Loading />;
  if (isError) return <ErrorView error={error} notFoundLabel="Match not found" />;

  const meta = [
    formatDate(data.date),
    data.venue,
    data.attendance != null ? `${data.attendance} att.` : null,
    data.tournamentName,
    data.season,
  ].filter(Boolean) as string[];

  return (
    <section className="stack">
      <Panel className="match-info">
        <h1 className="title">
          {data.homeTeam.clubName ?? "—"} vs {data.awayTeam.clubName ?? "—"}
        </h1>
        <p className="subtitle">
          {meta.map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && " · "}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </p>
        <LineScoreTable home={data.homeTeam} away={data.awayTeam} />
      </Panel>

      <div className="rosters">
        <MatchRoster title={data.homeTeam.clubName ?? "Home"} players={data.homeTeam.players} />
        <MatchRoster title={data.awayTeam.clubName ?? "Away"} players={data.awayTeam.players} />
      </div>
    </section>
  );
}

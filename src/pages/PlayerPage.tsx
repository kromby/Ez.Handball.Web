import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useParams } from "react-router-dom";
import type { PlayerStat } from "../api/types";
import { MatchList, type MatchSummary } from "../components/MatchList";
import { Panel } from "../components/Panel";
import { StarToggle } from "../components/StarToggle";
import { StatTable } from "../components/StatTable";
import { ErrorView, Loading } from "../components/StateViews";
import { usePlayer, usePlayerHistory, usePlayerStats } from "../query/hooks";

function toSummary(stat: PlayerStat, t: TFunction): MatchSummary {
  return {
    matchId: stat.matchId,
    season: stat.season,
    tournamentName: stat.tournamentName,
    context: `${stat.clubName ?? "—"} · ${t("player.goalsCount", { count: stat.goals })}`,
  };
}

function formatBirthday(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function PlayerPage() {
  const { t } = useTranslation();
  const { playerId = "" } = useParams();
  const profile = usePlayer(playerId);
  const history = usePlayerHistory(playerId);
  const stats = usePlayerStats(playerId);

  if (profile.isPending) return <Loading />;
  if (profile.isError) return <ErrorView error={profile.error} notFoundLabel={t("player.notFound")} />;

  const p = profile.data;
  const headerBits = [p.clubName, p.age != null ? t("player.age", { age: p.age }) : null, formatBirthday(p.dateOfBirth)].filter(
    Boolean,
  );

  return (
    <section className="stack">
      <div className="page-head">
        <div className="title-row">
          <h1 className="title">
            {p.jerseyNumber && <span className="jersey">#{p.jerseyNumber}</span>}
            {p.name}
          </h1>
          <StarToggle playerId={playerId} />
        </div>
        <p className="subtitle">{headerBits.join(" · ")}</p>
      </div>

      <Panel>
        <h2 className="section-title">{t("player.seasonHistory")}</h2>
        {history.isPending && <Loading />}
        {history.isError && <ErrorView error={history.error} notFoundLabel={t("player.noHistory")} />}
        {history.data &&
          (history.data.history.length === 0 ? (
            <p className="status">{t("match.noMatches")}</p>
          ) : (
            <StatTable entries={history.data.history} totals={history.data.totals} />
          ))}
      </Panel>

      <Panel>
        <h2 className="section-title">{t("player.matches")}</h2>
        {stats.isPending && <Loading />}
        {stats.isError && <ErrorView error={stats.error} notFoundLabel={t("player.noMatches")} />}
        {stats.data && <MatchList matches={stats.data.stats.map((s) => toSummary(s, t))} />}
      </Panel>
    </section>
  );
}

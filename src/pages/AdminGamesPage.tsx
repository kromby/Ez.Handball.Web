import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AdminTournamentGames } from "../api/types";
import { AdminNav } from "../components/AdminNav";
import { FilterSelect } from "../components/FilterSelect";
import { ErrorView, Loading } from "../components/StateViews";
import { formatDateTime } from "../components/adminGames/formatDateTime";
import { HbStatzSyncButton } from "../components/adminGames/HbStatzSyncButton";
import { SyncButton } from "../components/adminGames/SyncButton";
import { useAdminGameStatus, useSeasons } from "../query/hooks";

function gameCounts(tournament: AdminTournamentGames) {
  const games = tournament.rounds.flatMap((r) => r.games);
  return { total: games.length, notIngested: games.filter((g) => !g.ingested).length };
}

function TournamentRow({ tournament, season }: { tournament: AdminTournamentGames; season: string }) {
  const { t } = useTranslation();
  const { total, notIngested } = gameCounts(tournament);
  return (
    <tr>
      <td>
        <Link to={`/admin/games/${encodeURIComponent(tournament.tournamentId)}?season=${encodeURIComponent(season)}`}>
          {tournament.competitionName}
        </Link>
      </td>
      <td>
        {tournament.lastSyncedAt ? formatDateTime(tournament.lastSyncedAt) : t("admin.games.neverSynced")}
      </td>
      <td className="num">{total}</td>
      <td className="num">{notIngested}</td>
    </tr>
  );
}

function GamesBody({ season, displaySeason }: { season: string | undefined; displaySeason: string | undefined }) {
  const { t } = useTranslation();
  const { data, isPending, isError, error } = useAdminGameStatus(season);

  if (isPending) return <Loading />;
  if (isError) return <ErrorView error={error} notFoundLabel={t("admin.games.notFound")} />;
  if (data.length === 0) return <p className="status">{t("admin.games.empty")}</p>;

  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th>{t("admin.games.competition")}</th>
          <th>{t("admin.games.lastSyncedHeader")}</th>
          <th className="num">{t("admin.games.totalGames")}</th>
          <th className="num">{t("admin.games.notIngested")}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((tournament) => (
          <TournamentRow key={tournament.tournamentId} tournament={tournament} season={displaySeason ?? ""} />
        ))}
      </tbody>
    </table>
  );
}

export default function AdminGamesPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const urlSeason = params.get("season") ?? undefined;

  const seasons = useSeasons();
  const currentSeason = seasons.data?.find((s) => s.isCurrent)?.label;
  const selectedSeason = urlSeason ?? currentSeason;

  return (
    <section className="stack">
      <AdminNav />
      <div className="page-head market-head">
        <header>
          <div className="scribble">{t("admin.eyebrow")}</div>
          <h1 className="title">{t("admin.games.title")}</h1>
        </header>
        <SyncButton />
        <HbStatzSyncButton />
      </div>

      <FilterSelect
        label={t("admin.games.filterSeason")}
        value={selectedSeason ?? ""}
        options={(seasons.data ?? []).map((s) => ({ value: s.label, label: s.label }))}
        onChange={(v) => setParams(v ? { season: v } : {})}
      />

      <GamesBody season={urlSeason} displaySeason={selectedSeason} />
    </section>
  );
}

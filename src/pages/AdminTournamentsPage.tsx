import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TournamentStatus } from "../api/types";
import { AdminNav } from "../components/AdminNav";
import { ErrorView, Loading } from "../components/StateViews";
import { StatusBadge } from "../components/StatusBadge";
import { useAdminTournamentStatus } from "../query/hooks";

function TournamentRow({ tournament }: { tournament: TournamentStatus }) {
  const { t } = useTranslation();
  return (
    <tr>
      <td>{tournament.season}</td>
      <td>{tournament.competitionName}</td>
      <td>
        {tournament.active ? (
          <Link to={`/admin/games/${encodeURIComponent(tournament.tournamentId)}?season=${encodeURIComponent(tournament.season)}`}>
            {tournament.name}
          </Link>
        ) : (
          tournament.name
        )}
      </td>
      <td>{tournament.gender}</td>
      <td>{tournament.type}</td>
      <td>
        <StatusBadge
          on={tournament.active}
          onLabel={t("admin.tournaments.on")}
          offLabel={t("admin.tournaments.off")}
        />
      </td>
      <td>
        <StatusBadge
          on={tournament.ingest}
          onLabel={t("admin.tournaments.on")}
          offLabel={t("admin.tournaments.off")}
        />
      </td>
      <td className="num">{tournament.priority}</td>
    </tr>
  );
}

function TournamentsBody() {
  const { t } = useTranslation();
  const { data, isPending, isError, error } = useAdminTournamentStatus();

  if (isPending) return <Loading />;
  if (isError) return <ErrorView error={error} notFoundLabel={t("admin.tournaments.notFound")} />;
  if (data.length === 0) return <p className="status">{t("admin.tournaments.empty")}</p>;

  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th>{t("admin.tournaments.season")}</th>
          <th>{t("admin.tournaments.competition")}</th>
          <th>{t("admin.tournaments.tournament")}</th>
          <th>{t("admin.tournaments.gender")}</th>
          <th>{t("admin.tournaments.type")}</th>
          <th>{t("admin.tournaments.active")}</th>
          <th>{t("admin.tournaments.ingest")}</th>
          <th className="num">{t("admin.tournaments.priority")}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((tournament) => (
          <TournamentRow key={`${tournament.season}-${tournament.tournamentId}`} tournament={tournament} />
        ))}
      </tbody>
    </table>
  );
}

export default function AdminTournamentsPage() {
  const { t } = useTranslation();
  return (
    <section className="stack">
      <AdminNav />
      <header>
        <div className="scribble">{t("admin.eyebrow")}</div>
        <h1 className="title">{t("admin.tournaments.title")}</h1>
      </header>
      <TournamentsBody />
    </section>
  );
}

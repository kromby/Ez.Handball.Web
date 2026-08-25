import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminNav } from "../components/AdminNav";
import { ErrorView, Loading } from "../components/StateViews";
import { TournamentGamesSection } from "../components/adminGames/TournamentGamesSection";
import { useAdminGameStatus } from "../query/hooks";

export default function AdminGameDetailPage() {
  const { t } = useTranslation();
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const [params] = useSearchParams();
  const season = params.get("season") ?? undefined;

  const { data, isPending, isError, error } = useAdminGameStatus(season);
  const tournament = data?.find((t) => t.tournamentId === tournamentId);

  const backHref = `/admin/games${season ? `?season=${encodeURIComponent(season)}` : ""}`;

  return (
    <section className="stack">
      <AdminNav />
      <Link to={backHref} className="admin-back-link">{t("admin.games.backToList")}</Link>

      {isPending ? (
        <Loading />
      ) : isError ? (
        <ErrorView error={error} notFoundLabel={t("admin.games.notFound")} />
      ) : !tournament ? (
        <p className="status">{t("admin.games.tournamentNotFound")}</p>
      ) : (
        <TournamentGamesSection tournament={tournament} />
      )}
    </section>
  );
}

import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import type { ClubRosterPlayer } from "../api/types";
import { ClubMatchRow } from "../components/club/ClubMatchRow";
import { Panel } from "../components/Panel";
import { ErrorView, Loading } from "../components/StateViews";
import { useClub, useClubMatches, useClubRoster } from "../query/hooks";

type ClubMatchesQuery = ReturnType<typeof useClubMatches>;

function MatchSection({
  title,
  emptyLabel,
  query,
}: {
  title: string;
  emptyLabel: string;
  query: ClubMatchesQuery;
}) {
  const { t } = useTranslation();
  return (
    <Panel>
      <h2 className="section-title">{title}</h2>
      {query.isPending && <Loading />}
      {query.isError && <ErrorView error={query.error} notFoundLabel={t("club.matchesError")} />}
      {query.data &&
        (query.data.matches.length === 0 ? (
          <p className="status">{emptyLabel}</p>
        ) : (
          query.data.matches.map((m) => <ClubMatchRow key={m.matchId} match={m} />)
        ))}
    </Panel>
  );
}

function RosterTable({ players }: { players: ClubRosterPlayer[] }) {
  const { t } = useTranslation();
  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th className="num">#</th>
          <th>{t("leaderboard.player")}</th>
          <th>{t("club.colPosition")}</th>
          <th className="num">{t("club.colAge")}</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player) => (
          <tr key={player.playerId}>
            <td className="num">{player.jerseyNumber ?? ""}</td>
            <td>
              <Link to={`/players/${encodeURIComponent(player.playerId)}`}>{player.name}</Link>
            </td>
            <td>{player.position}</td>
            <td className="num">{player.age ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ClubPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const club = useClub(id);
  const roster = useClubRoster(id);
  const upcoming = useClubMatches(id, "upcoming");
  const played = useClubMatches(id, "played");

  if (club.isPending) return <Loading />;
  if (club.isError) return <ErrorView error={club.error} notFoundLabel={t("club.notFound")} />;

  const detail = club.data;
  const headerBits = [detail.venue, detail.foundedYear != null ? String(detail.foundedYear) : null].filter(Boolean);

  return (
    <section className="stack">
      <div className="page-head">
        <div className="title-row">
          {detail.logoUrl && <img className="club-logo" src={detail.logoUrl} alt="" />}
          <h1 className="title">{detail.name}</h1>
        </div>
        {headerBits.length > 0 && <p className="subtitle">{headerBits.join(" · ")}</p>}
      </div>

      <MatchSection title={t("club.upcoming")} emptyLabel={t("club.emptyUpcoming")} query={upcoming} />
      <MatchSection title={t("club.results")} emptyLabel={t("club.emptyResults")} query={played} />

      <Panel>
        <h2 className="section-title">{t("club.roster")}</h2>
        {roster.isPending && <Loading />}
        {roster.isError && <ErrorView error={roster.error} notFoundLabel={t("club.notFound")} />}
        {roster.data &&
          (roster.data.players.length === 0 ? (
            <p className="status">{t("club.emptyRoster")}</p>
          ) : (
            <RosterTable players={roster.data.players} />
          ))}
      </Panel>
    </section>
  );
}

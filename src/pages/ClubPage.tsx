import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import type { ClubRosterPlayer } from "../api/types";
import { Panel } from "../components/Panel";
import { ErrorView, Loading } from "../components/StateViews";
import { useClub, useClubRoster } from "../query/hooks";

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

  if (club.isPending) return <Loading />;
  if (club.isError) return <ErrorView error={club.error} notFoundLabel={t("club.notFound")} />;

  const c = club.data;
  const headerBits = [c.venue, c.foundedYear != null ? String(c.foundedYear) : null].filter(Boolean);

  return (
    <section className="stack">
      <div className="page-head">
        <div className="title-row">
          {c.logoUrl && <img className="club-logo" src={c.logoUrl} alt="" />}
          <h1 className="title">{c.name}</h1>
        </div>
        {headerBits.length > 0 && <p className="subtitle">{headerBits.join(" · ")}</p>}
      </div>

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

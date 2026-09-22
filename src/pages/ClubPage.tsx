import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import type { ClubRosterPlayer } from "../api/types";
import { useAuth } from "../auth/useAuth";
import { ClubMatchRow } from "../components/club/ClubMatchRow";
import { Panel } from "../components/Panel";
import { PlayerHubTable } from "../components/PlayerHubTable";
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
  const { status } = useAuth();
  // Same stat columns as /players; jersey # replaces the pool rank and rows keep
  // the server's jersey order.
  return (
    <PlayerHubTable
      entries={players}
      authed={status === "authenticated"}
      leadingColumns={[{ key: "jersey", header: "#", align: "right", render: (player) => player.jerseyNumber ?? "" }]}
      afterPositionColumns={[{ key: "age", header: t("club.colAge"), align: "right", render: (player) => player.age ?? "—" }]}
    />
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

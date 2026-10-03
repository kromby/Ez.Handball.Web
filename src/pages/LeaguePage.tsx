import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Panel } from "../components/Panel";
import { ErrorView, Loading } from "../components/StateViews";
import { InvitePanel } from "../components/InvitePanel";
import { BallDefs } from "../components/BallAvatar";
import { LeagueStandingsTable } from "../components/LeagueStandingsTable";
import { LeagueProgressChart } from "../components/LeagueProgressChart";
import { useAuth } from "../auth/useAuth";
import { useClubs, useMiniLeague, useMiniLeagueStandings } from "../query/hooks";

function roleBadgeKey(role: string | null): "leagues.badgeCreator" | "leagues.badgeMember" | "leagues.badgeNotMember" {
  if (role === "creator") return "leagues.badgeCreator";
  if (role === "member") return "leagues.badgeMember";
  return "leagues.badgeNotMember";
}

export default function LeaguePage() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const { user } = useAuth();
  const league = useMiniLeague(id);
  const standings = useMiniLeagueStandings(id);
  const clubs = useClubs();

  if (league.isPending) return <Loading />;
  if (league.isError) return <ErrorView error={league.error} notFoundLabel={t("leagues.notFound")} />;

  const data = league.data;
  const myTeamId = data.members.find((member) => member.userId === user?.id)?.teamId;

  return (
    <section className="stack">
      <BallDefs />
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h1 className="title">{data.name}</h1>
        <span className="chip">{data.season} · {t("leagues.memberCount", { count: data.memberCount })}</span>
      </div>

      <InvitePanel league={data} />

      <Panel>
        <span className="chip">{t(roleBadgeKey(data.role))}</span>
        <h2 className="label" style={{ marginTop: 14 }}>{t("leagues.standings")}</h2>
        {standings.isPending && <Loading />}
        {standings.isError && <p className="error">{t("leagues.standingsLoadError")}</p>}
        {standings.data && (
          <LeagueStandingsTable
            entries={standings.data.entries}
            members={data.members}
            clubs={clubs.data ?? []}
            myTeamId={myTeamId}
          />
        )}
        {data.members.length <= 1 && <p className="status">{t("leagues.membersOnlyYou")}</p>}
      </Panel>

      {standings.data && standings.data.entries.length > 0 && (
        <Panel>
          <h2 className="label">{t("leagues.chartTitle")}</h2>
          <LeagueProgressChart entries={standings.data.entries} myTeamId={myTeamId} />
        </Panel>
      )}
    </section>
  );
}

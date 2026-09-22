import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import type { MiniLeagueMember } from "../api/types";
import { Panel } from "../components/Panel";
import { ErrorView, Loading } from "../components/StateViews";
import { InvitePanel } from "../components/InvitePanel";
import { BallDefs } from "../components/BallAvatar";
import { MemberCrest } from "../components/MemberCrest";
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

  const pointsByTeamId = new Map(
    (standings.data?.entries ?? []).map((entry) => [entry.teamId, entry.totalPoints]),
  );
  const clubsById = new Map((clubs.data ?? []).map((club) => [club.clubId, club]));

  const memberName = (m: MiniLeagueMember) =>
    m.teamName ?? (m.userId === user?.id ? user.displayName : t("leagues.memberShort", { id: m.userId.slice(0, 8) }));

  const memberLabel = (m: MiniLeagueMember) =>
    m.userId === user?.id ? t("leagues.you", { name: memberName(m) }) : memberName(m);

  // The API ranks every member with a team, so a missing entry once standings have loaded means no points yet.
  const memberPoints = (m: MiniLeagueMember) => (standings.data ? pointsByTeamId.get(m.teamId) ?? 0 : undefined);

  return (
    <section className="stack">
      <BallDefs />
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h1 className="title">{data.name}</h1>
        <span className="chip">{data.season} · {t("leagues.memberCount", { count: data.memberCount })}</span>
      </div>

      <Panel>
        <span className="chip">{t(roleBadgeKey(data.role))}</span>

        <h2 className="label" style={{ marginTop: 14 }}>{t("leagues.members")}</h2>
        <ul className="position-group-list">
          {data.members.map((m) => {
            const points = memberPoints(m);
            const club = m.favoriteClubId ? clubsById.get(m.favoriteClubId) : undefined;
            return (
              <li key={m.userId} className="squad-row">
                <MemberCrest logoUrl={club?.logoUrl} clubName={club?.name} />
                <span>{memberLabel(m)}</span>
                <span className="squad-row-price" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {points != null && <span>{t("leagues.memberPoints", { points })}</span>}
                  <span>{m.role === "creator" ? t("leagues.roleCreator") : t("leagues.roleMember")}</span>
                </span>
              </li>
            );
          })}
        </ul>
        {data.members.length <= 1 && <p className="status">{t("leagues.membersOnlyYou")}</p>}

        <InvitePanel league={data} />
      </Panel>
    </section>
  );
}

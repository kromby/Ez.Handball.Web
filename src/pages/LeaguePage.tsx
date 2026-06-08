import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import type { MiniLeagueMember } from "../api/types";
import { Panel } from "../components/Panel";
import { ErrorView, Loading } from "../components/StateViews";
import { useAuth } from "../auth/useAuth";
import { useMiniLeague } from "../query/hooks";

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
  const [copied, setCopied] = useState(false);

  if (league.isPending) return <Loading />;
  if (league.isError) return <ErrorView error={league.error} notFoundLabel={t("leagues.notFound")} />;

  const data = league.data;
  const permalink = `${window.location.origin}/leagues/${encodeURIComponent(data.id)}`;

  const memberLabel = (m: MiniLeagueMember) =>
    m.userId === user?.id
      ? t("leagues.you", { name: user?.displayName ?? "" })
      : t("leagues.memberShort", { id: m.userId.slice(0, 8) });

  const copy = () => {
    void navigator.clipboard?.writeText(permalink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="stack">
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h1 className="title">{data.name}</h1>
        <span className="chip">{data.season} · {t("leagues.memberCount", { count: data.memberCount })}</span>
      </div>

      <Panel>
        <span className="chip">{t(roleBadgeKey(data.role))}</span>

        <h2 className="label" style={{ marginTop: 14 }}>{t("leagues.members")}</h2>
        <ul className="position-group-list">
          {data.members.map((m) => (
            <li key={m.userId} className="squad-row">
              <span>{memberLabel(m)}</span>
              <span className="squad-row-price">
                {m.role === "creator" ? t("leagues.roleCreator") : t("leagues.roleMember")}
              </span>
            </li>
          ))}
        </ul>
        {data.members.length <= 1 && <p className="status">{t("leagues.membersOnlyYou")}</p>}

        <h2 className="label" style={{ marginTop: 14 }}>{t("leagues.share")}</h2>
        <div className="share-row">
          <code className="share-link">{permalink}</code>
          <button type="button" className="btn btn--ghost" onClick={copy} aria-label={t("leagues.copyLink")}>
            {copied ? t("leagues.copied") : t("leagues.copyLink")}
          </button>
        </div>
        <p className="status" aria-live="polite">{t("leagues.shareNote")}</p>
      </Panel>
    </section>
  );
}

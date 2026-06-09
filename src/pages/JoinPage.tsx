import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import { Panel } from "../components/Panel";
import { Loading } from "../components/StateViews";
import { useInvitePreview, useJoinMiniLeague } from "../query/hooks";

// Preview only fails with 410 (expired) or 404 (invalid).
function previewMessageKey(err: unknown): "invite.expired" | "invite.invalid" {
  return err instanceof ApiError && err.status === 410 ? "invite.expired" : "invite.invalid";
}

// Join can also fail generically (e.g. a 400/500) — fall back to a join-specific message.
function joinMessageKey(err: unknown): "invite.expired" | "invite.invalid" | "invite.joinError" {
  if (err instanceof ApiError && err.status === 410) return "invite.expired";
  if (err instanceof ApiError && err.status === 404) return "invite.invalid";
  return "invite.joinError";
}

export default function JoinPage() {
  const { t } = useTranslation();
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const preview = useInvitePreview(token);
  const join = useJoinMiniLeague();

  if (preview.isPending) return <Loading />;
  if (preview.isError) {
    return (
      <section className="stack">
        <Panel>
          <p className="error" role="alert">{t(previewMessageKey(preview.error))}</p>
        </Panel>
      </section>
    );
  }

  const data = preview.data;
  const doJoin = () => {
    join.mutate(token, {
      onSuccess: (league) => navigate(`/leagues/${encodeURIComponent(league.id)}`),
    });
  };

  return (
    <section className="stack">
      <Panel>
        <p className="eyebrow">{t("invite.invitedToJoin")}</p>
        <h1 className="title">{data.name}</h1>
        <p className="status">{data.season} · {t("leagues.memberCount", { count: data.memberCount })}</p>
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn btn--amber" onClick={doJoin} disabled={join.isPending}>
            {join.isPending ? t("invite.joining") : t("invite.join")}
          </button>
        </div>
        {join.isError && <p className="error" role="alert">{t(joinMessageKey(join.error))}</p>}
      </Panel>
    </section>
  );
}

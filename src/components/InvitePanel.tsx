import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MiniLeague } from "../api/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { useGenerateInvite, useInvite } from "../query/hooks";

export function InvitePanel({ league }: { league: MiniLeague }) {
  const { t } = useTranslation();
  const isMember = league.role !== null;
  const invite = useInvite(league.id, { enabled: isMember });
  const generate = useGenerateInvite(league.id);
  const [copied, setCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!isMember || invite.isPending) return null;
  if (invite.isError) return <p className="error">{t("invite.loadError")}</p>;

  const data = invite.data; // Invite | null
  const url = data ? `${window.location.origin}/invite/${data.token}` : "";

  const copy = () => {
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        /* clipboard unavailable — no-op */
      });
  };

  return (
    <div className="invite-panel">
      <h2 className="label">{t("invite.panelTitle")}</h2>
      {data === null ? (
        <>
          <p className="status">{t("invite.generateBlurb")}</p>
          <button type="button" className="btn btn--amber" onClick={() => generate.mutate()} disabled={generate.isPending}>
            {t("invite.generate")}
          </button>
        </>
      ) : (
        <>
          <div className="share-row">
            <code className="share-link">{url}</code>
            <button type="button" className="btn btn--ghost" onClick={copy} aria-label={t("invite.copyLink")}>
              {copied ? t("invite.copied") : t("invite.copyLink")}
            </button>
          </div>
          <div className="invite-meta">
            <button type="button" className="btn btn--ghost" onClick={() => setConfirmOpen(true)} disabled={generate.isPending}>
              {t("invite.regenerate")}
            </button>
            <span className="status">{t("invite.neverExpires")}</span>
          </div>
          <ConfirmDialog
            open={confirmOpen}
            title={t("invite.confirmTitle")}
            body={t("invite.confirmBody")}
            confirmLabel={t("invite.confirm")}
            cancelLabel={t("invite.cancel")}
            busy={generate.isPending}
            onConfirm={() => {
              setConfirmOpen(false);
              generate.mutate();
            }}
            onCancel={() => setConfirmOpen(false)}
          />
        </>
      )}
    </div>
  );
}

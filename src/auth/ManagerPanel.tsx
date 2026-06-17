import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../api/client";
import * as api from "../api/endpoints";
import { ManagerCrest } from "../components/ManagerCrest";
import { ErrorView, Loading } from "../components/StateViews";
import { useManager } from "../query/hooks";
import { useAuth } from "./useAuth";

/** Account-page panel: the manager's public identity (crest + team name) and an inline rename. */
export function ManagerPanel() {
  const { t } = useTranslation();
  const { setTeamName } = useAuth();
  const qc = useQueryClient();
  const manager = useManager();
  const [name, setName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (manager.isPending) return <Loading />;
  if (manager.isError) return <ErrorView error={manager.error} notFoundLabel={t("manager.errorGeneric")} />;

  const data = manager.data;
  const value = name ?? data.teamName;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setPending(true);
    try {
      const updated = await api.renameTeam(value);
      qc.setQueryData(["manager"], updated);
      setTeamName(updated.teamName);
      setName(updated.teamName);
      setMessage(t("manager.saved"));
    } catch (err) {
      if (err instanceof ApiError && err.code === "team_name_taken") setError(t("manager.errorTaken"));
      else if (err instanceof ApiError && err.code === "validation_error") setError(t("manager.errorInvalid"));
      else setError(t("manager.errorGeneric"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="stack manager-panel">
      <div className="manager-identity">
        <ManagerCrest teamName={data.teamName} color={data.color} />
        <div>
          <h2 className="section-title">{t("manager.panelTitle")}</h2>
          <p className="manager-name">{data.teamName}</p>
          {!data.onboarding.squadComplete && (
            <p className="form-note">
              {t("manager.progress", {
                owned: data.onboarding.playersOwned,
                size: data.onboarding.squadSize,
              })}
            </p>
          )}
        </div>
      </div>

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {message && <p className="form-note" role="status">{message}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="field">
          <label htmlFor="teamName">{t("manager.renameLabel")}</label>
          <input
            id="teamName"
            type="text"
            value={value}
            onChange={(event) => setName(event.target.value)}
          />
          <p className="form-note">{t("manager.renameHelp")}</p>
        </div>
        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? t("manager.saving") : t("manager.save")}
        </button>
      </form>
    </div>
  );
}

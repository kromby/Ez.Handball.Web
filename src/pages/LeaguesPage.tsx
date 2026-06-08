import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { Panel } from "../components/Panel";
import { RegField } from "../auth/registration/RegField";
import { useCreateMiniLeague } from "../query/hooks";

export default function LeaguesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateMiniLeague();
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const trimmed = name.trim();
  const nameValid = trimmed.length >= 1 && trimmed.length <= 60;
  const nameError = touched && !nameValid ? t("leagues.nameInvalid") : undefined;

  function submit() {
    setTouched(true);
    setFormError(null);
    if (!nameValid) return;
    create.mutate(trimmed, {
      onSuccess: (league) => navigate(`/leagues/${encodeURIComponent(league.id)}`),
      onError: (err) => {
        if (err instanceof ApiError && err.code === "invalid_name") setFormError(t("leagues.nameInvalid"));
        else if (err instanceof ApiError && err.code === "no_current_season") setFormError(t("leagues.noCurrentSeason"));
        else setFormError(t("common.error"));
      },
    });
  }

  return (
    <section className="stack">
      <div className="page-head">
        <h1 className="title">{t("leagues.title")}</h1>
      </div>
      <Panel>
        <p className="subtitle">{t("leagues.blurb")}</p>
        <RegField
          id="leagueName"
          label={t("leagues.nameLabel")}
          placeholder={t("leagues.namePlaceholder")}
          value={name}
          onChange={setName}
          onBlur={() => setTouched(true)}
          error={nameError}
        />
        {formError && <p className="error" role="alert">{formError}</p>}
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn btn--amber" onClick={submit} disabled={create.isPending}>
            {create.isPending ? t("leagues.creating") : t("leagues.create")}
          </button>
        </div>
        <p className="status" style={{ marginTop: 10 }}>{t("leagues.seasonNote")}</p>
      </Panel>
    </section>
  );
}

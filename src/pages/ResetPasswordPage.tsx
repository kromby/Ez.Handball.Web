import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authEndpoints";
import { ApiError } from "../api/client";
import { Panel } from "../components/Panel";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8 || password.length > 128) {
      setError(t("auth.passwordRange"));
      return;
    }
    setPending(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "token_expired") setError(t("auth.linkExpired"));
      else if (err instanceof ApiError && err.code === "invalid_token")
        setError(t("auth.verifyInvalid"));
      else if (err instanceof ApiError && err.code === "weak_password")
        setError(t("auth.weakPassword"));
      else setError(t("common.error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="stack auth-card">
      <div className="page-head">
        <h1 className="title">{t("auth.resetTitle")}</h1>
      </div>
      <Panel>
        {done ? (
          <p className="form-note" role="status">
            {t("auth.passwordUpdated")} <Link to="/login">{t("auth.logIn")}</Link>
          </p>
        ) : (
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            {error && <p className="form-error" role="alert">{error}</p>}
            {!token && <p className="form-note">{t("auth.resetMissingToken")}</p>}
            <div className="field">
              <label htmlFor="password">{t("auth.newPassword")}</label>
              <input id="password" type="password" autoComplete="new-password" value={password}
                onChange={(event) => setPassword(event.target.value)} />
            </div>
            <button className="btn-primary" type="submit" disabled={pending || !token}>
              {pending ? t("auth.saving") : t("auth.setNewPassword")}
            </button>
          </form>
        )}
      </Panel>
    </section>
  );
}

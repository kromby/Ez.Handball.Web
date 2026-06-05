import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/authEndpoints";
import { Panel } from "../components/Panel";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      await requestPasswordReset(email);
    } catch {
      // No enumeration: succeed silently regardless of the outcome.
    } finally {
      setPending(false);
      setSubmitted(true);
    }
  }

  return (
    <section className="stack auth-card">
      <div className="page-head">
        <h1 className="title">{t("auth.resetPasswordTitle")}</h1>
      </div>
      <Panel>
        {submitted ? (
          <p className="form-note" role="status">
            {t("auth.resetSentLong")}
          </p>
        ) : (
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">{t("auth.email")}</label>
              <input id="email" type="email" autoComplete="email" value={email}
                onChange={(event) => setEmail(event.target.value)} />
            </div>
            <button className="btn-primary" type="submit" disabled={pending}>
              {pending ? t("auth.sending") : t("auth.sendResetLink")}
            </button>
            <p className="form-note">
              <Link to="/login">{t("auth.backToLogin")}</Link>
            </p>
          </form>
        )}
      </Panel>
    </section>
  );
}

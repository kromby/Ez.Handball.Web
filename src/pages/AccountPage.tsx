import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Panel } from "../components/Panel";
import { Loading } from "../components/StateViews";
import { useAuth } from "../auth/useAuth";
import { ProfileForm } from "../auth/ProfileForm";
import { ManagerPanel } from "../auth/ManagerPanel";

export default function AccountPage() {
  const { t } = useTranslation();
  const { user, logout, resendVerification } = useAuth();
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  if (!user) return <Loading />;

  async function onResend() {
    setResent(false);
    setResendError(null);
    try {
      await resendVerification();
      setResent(true);
    } catch {
      setResendError(t("auth.resendFailed"));
    }
  }

  return (
    <section className="stack auth-card">
      <div className="page-head">
        <h1 className="title">{t("account.title")}</h1>
        <p className="subtitle">{user.email}</p>
      </div>

      {!user.emailVerified && (
        <div className="verify-banner">
          <span>{t("auth.verifyPlease")}</span>
          <button className="btn-link" type="button" onClick={onResend}>
            {t("auth.resendVerification")}
          </button>
          {resent && <span className="form-note">{t("auth.resetSent")}</span>}
          {resendError && <span className="form-error">{resendError}</span>}
        </div>
      )}

      <Panel>
        <ProfileForm />
      </Panel>

      <Panel>
        <ManagerPanel />
      </Panel>

      <Panel>
        <h2 className="section-title">{t("account.sessions")}</h2>
        <div className="auth-form">
          <button className="btn-primary" type="button" onClick={() => logout(false)}>
            {t("account.logOut")}
          </button>
          <button className="btn-link" type="button" onClick={() => logout(true)}>
            {t("account.logOutEverywhere")}
          </button>
        </div>
      </Panel>
    </section>
  );
}

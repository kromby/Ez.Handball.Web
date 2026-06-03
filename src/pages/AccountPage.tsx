import { useState } from "react";
import { Panel } from "../components/Panel";
import { Loading } from "../components/StateViews";
import { useAuth } from "../auth/useAuth";
import { ProfileForm } from "../auth/ProfileForm";

export default function AccountPage() {
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
      setResendError("Couldn't resend right now. Please try again later.");
    }
  }

  return (
    <section className="stack auth-card">
      <div className="page-head">
        <h1 className="title">Your account</h1>
        <p className="subtitle">{user.email}</p>
      </div>

      {!user.emailVerified && (
        <div className="verify-banner">
          <span>Please verify your email to secure your account.</span>
          <button className="btn-link" type="button" onClick={onResend}>
            Resend verification
          </button>
          {resent && <span className="form-note">Sent — check your inbox.</span>}
          {resendError && <span className="form-error">{resendError}</span>}
        </div>
      )}

      <Panel>
        <ProfileForm />
      </Panel>

      <Panel>
        <h2 className="section-title">Sessions</h2>
        <div className="auth-form">
          <button className="btn-primary" type="button" onClick={() => logout(false)}>
            Log out
          </button>
          <button className="btn-link" type="button" onClick={() => logout(true)}>
            Log out everywhere
          </button>
        </div>
      </Panel>
    </section>
  );
}

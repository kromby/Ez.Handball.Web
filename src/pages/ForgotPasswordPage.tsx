import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/authEndpoints";
import { Panel } from "../components/Panel";

export default function ForgotPasswordPage() {
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
        <h1 className="title">Reset password</h1>
      </div>
      <Panel>
        {submitted ? (
          <p className="form-note" role="status">
            If an account exists for that email, we've sent reset instructions.
          </p>
        ) : (
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" value={email}
                onChange={(event) => setEmail(event.target.value)} />
            </div>
            <button className="btn-primary" type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </button>
            <p className="form-note">
              <Link to="/login">Back to login</Link>
            </p>
          </form>
        )}
      </Panel>
    </section>
  );
}

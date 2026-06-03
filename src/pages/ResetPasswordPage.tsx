import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../api/authEndpoints";
import { ApiError } from "../api/client";
import { Panel } from "../components/Panel";

export default function ResetPasswordPage() {
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
      setError("Password must be 8–128 characters.");
      return;
    }
    setPending(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "token_expired") setError("This link has expired.");
      else if (err instanceof ApiError && err.code === "invalid_token")
        setError("This link is invalid or already used.");
      else if (err instanceof ApiError && err.code === "weak_password")
        setError("Password must be at least 8 characters.");
      else setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="stack auth-card">
      <div className="page-head">
        <h1 className="title">Set a new password</h1>
      </div>
      <Panel>
        {done ? (
          <p className="form-note" role="status">
            Password updated. <Link to="/login">Log in</Link>
          </p>
        ) : (
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            {error && <p className="form-error" role="alert">{error}</p>}
            {!token && <p className="form-note">This reset link is missing its token.</p>}
            <div className="field">
              <label htmlFor="password">New password</label>
              <input id="password" type="password" autoComplete="new-password" value={password}
                onChange={(event) => setPassword(event.target.value)} />
            </div>
            <button className="btn-primary" type="submit" disabled={pending || !token}>
              {pending ? "Saving…" : "Set new password"}
            </button>
          </form>
        )}
      </Panel>
    </section>
  );
}

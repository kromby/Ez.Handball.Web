import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ApiError } from "../api/client";
import { Panel } from "../components/Panel";
import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from ?? "/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? "Too many attempts, please wait a moment."
          : "That email or password didn't match.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="stack auth-card">
      <div className="page-head">
        <h1 className="title">Log in</h1>
      </div>
      <Panel>
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button className="btn-primary" type="submit" disabled={pending}>
            {pending ? "Logging in…" : "Log in"}
          </button>
          <p className="form-note">
            <Link to="/forgot-password">Forgot your password?</Link>
          </p>
          <p className="form-note">
            No account? <Link to="/register">Register</Link>
          </p>
        </form>
      </Panel>
    </section>
  );
}

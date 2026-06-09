import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { AuthCard } from "../auth/AuthCard";
import { useAuth } from "../auth/useAuth";

export default function LoginPage() {
  const { t } = useTranslation();
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
          ? t("auth.tooManyAttempts")
          : t("auth.loginMismatch"),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard title={t("auth.loginTitle")}>
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor="email">{t("auth.email")}</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">{t("auth.password")}</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <button className="btn-primary" type="submit" disabled={pending}>
          {pending ? t("auth.loggingIn") : t("auth.logIn")}
        </button>
        <p className="form-note">
          <Link to="/forgot-password">{t("auth.forgotPassword")}</Link>
        </p>
        <p className="form-note">
          {t("auth.noAccount")} <Link to="/register" state={location.state}>{t("auth.register")}</Link>
        </p>
      </form>
    </AuthCard>
  );
}

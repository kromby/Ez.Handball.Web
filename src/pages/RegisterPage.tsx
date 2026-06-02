import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import type { Language } from "../api/types";
import { Panel } from "../components/Panel";
import { ErrorView, Loading } from "../components/StateViews";
import { useAuth } from "../auth/useAuth";
import { useClubs } from "../query/hooks";

/** Maps a backend error to the form field it belongs to. */
function fieldErrorFor(err: ApiError): { field: string; message: string } | null {
  if (err.code === "email_taken") return { field: "email", message: "That email is already registered." };
  if (err.code === "weak_password")
    return { field: "password", message: "Password must be at least 8 characters." };
  if (err.code === "invalid_club") return { field: "favoriteClubId", message: "Please choose a valid club." };
  if (err.code === "validation_error" && err.details?.field)
    return { field: err.details.field, message: "Please check this field." };
  return null;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const clubs = useClubs();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState<Language>("is");
  const [favoriteClubId, setFavoriteClubId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 8 || password.length > 128)
      next.password = "Password must be 8–128 characters.";
    if (displayName.trim().length < 1 || displayName.length > 60)
      next.displayName = "Display name must be 1–60 characters.";
    if (!favoriteClubId) next.favoriteClubId = "Please choose your favorite club.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setPending(true);
    try {
      await register({ email, password, displayName, language, favoriteClubId });
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError) {
        const mapped = fieldErrorFor(err);
        if (mapped) setErrors((prev) => ({ ...prev, [mapped.field]: mapped.message }));
        else if (err.status === 429) setFormError("Too many attempts, please wait a moment.");
        else setFormError("Something went wrong. Please try again.");
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="stack auth-card">
      <div className="page-head">
        <h1 className="title">Create account</h1>
      </div>
      <Panel>
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {formError && <p className="form-error" role="alert">{formError}</p>}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" value={email}
              onChange={(event) => setEmail(event.target.value)} />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="new-password" value={password}
              onChange={(event) => setPassword(event.target.value)} />
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          <div className="field">
            <label htmlFor="displayName">Display name</label>
            <input id="displayName" type="text" value={displayName}
              onChange={(event) => setDisplayName(event.target.value)} />
            {errors.displayName && <p className="field-error">{errors.displayName}</p>}
          </div>

          <div className="field">
            <label htmlFor="language">Language</label>
            <select id="language" value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}>
              <option value="is">Íslenska</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="favoriteClubId">Favorite club</label>
            {clubs.isPending && <Loading />}
            {clubs.isError && <ErrorView error={clubs.error} notFoundLabel="No clubs found" />}
            {clubs.data && (
              <select id="favoriteClubId" value={favoriteClubId}
                onChange={(event) => setFavoriteClubId(event.target.value)}>
                <option value="">Choose a club…</option>
                {clubs.data.map((club) => (
                  <option key={club.clubId} value={club.clubId}>{club.name}</option>
                ))}
              </select>
            )}
            {errors.favoriteClubId && <p className="field-error">{errors.favoriteClubId}</p>}
          </div>

          <button className="btn-primary" type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create account"}
          </button>
          <p className="form-note">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </Panel>
    </section>
  );
}

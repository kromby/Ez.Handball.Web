import { useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import type { Language } from "../api/types";
import { Panel } from "../components/Panel";
import { ErrorView, Loading } from "../components/StateViews";
import { useAuth } from "../auth/useAuth";
import { useClubs } from "../query/hooks";

export default function AccountPage() {
  const { user, updateProfile, logout, resendVerification } = useAuth();
  const clubs = useClubs();

  // user is guaranteed by ProtectedRoute, but guard for type-narrowing.
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [language, setLanguage] = useState<Language>(user?.language ?? "is");
  const [favoriteClubId, setFavoriteClubId] = useState(user?.favoriteClubId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resent, setResent] = useState(false);

  if (!user) return <Loading />;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setPending(true);
    try {
      await updateProfile({ displayName, language, favoriteClubId });
      setMessage("Profile saved.");
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "invalid_club"
          ? "Please choose a valid club."
          : "Something went wrong. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  async function onResend() {
    setResent(false);
    try {
      await resendVerification();
      setResent(true);
    } catch {
      setError("Couldn't resend right now. Please try again later.");
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
        </div>
      )}

      <Panel>
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {message && <p className="form-note" role="status">{message}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="field">
            <label htmlFor="displayName">Display name</label>
            <input id="displayName" type="text" value={displayName}
              onChange={(event) => setDisplayName(event.target.value)} />
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
                {clubs.data.map((club) => (
                  <option key={club.clubId} value={club.clubId}>{club.name}</option>
                ))}
              </select>
            )}
          </div>

          <button className="btn-primary" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </button>
        </form>
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

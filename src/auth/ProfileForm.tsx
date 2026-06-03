import { useState, type FormEvent } from "react";
import { ApiError } from "../api/client";
import type { Language } from "../api/types";
import { ErrorView, Loading } from "../components/StateViews";
import { useAuth } from "./useAuth";
import { useClubs } from "../query/hooks";

/** The profile-editing form on the account page: display name, language, club. */
export function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const clubs = useClubs();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [language, setLanguage] = useState<Language>(user?.language ?? "is");
  const [favoriteClubId, setFavoriteClubId] = useState(user?.favoriteClubId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

  return (
    <form className="auth-form" onSubmit={onSubmit} noValidate>
      {message && (
        <p className="form-note" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="field">
        <label htmlFor="displayName">Display name</label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="language">Language</label>
        <select id="language" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
          <option value="is">Íslenska</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="favoriteClubId">Favorite club</label>
        {clubs.isPending && <Loading />}
        {clubs.isError && <ErrorView error={clubs.error} notFoundLabel="No clubs found" />}
        {clubs.data && (
          <select id="favoriteClubId" value={favoriteClubId} onChange={(event) => setFavoriteClubId(event.target.value)}>
            {clubs.data.map((club) => (
              <option key={club.clubId} value={club.clubId}>
                {club.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <button className="btn-primary" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

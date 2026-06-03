import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import type { Language } from "../api/types";
import { ErrorView, Loading } from "../components/StateViews";
import { useAuth } from "../auth/useAuth";
import { useClubs } from "../query/hooks";
import { Celebration } from "../auth/registration/Celebration";
import { ClubPicker } from "../auth/registration/ClubPicker";
import { Icon } from "../auth/registration/Icon";
import { LanguagePicker } from "../auth/registration/LanguagePicker";
import { PasswordStrength } from "../auth/registration/PasswordStrength";
import { RegField } from "../auth/registration/RegField";
import { RegisterCover } from "../auth/registration/RegisterCover";

/** Maps a backend error to the form field it belongs to (step 0). */
function mapFieldError(err: ApiError): { field: string; message: string } | null {
  if (err.code === "email_taken") return { field: "email", message: "That email is already registered." };
  if (err.code === "weak_password") return { field: "password", message: "Password must be at least 8 characters." };
  if (err.code === "validation_error" && err.details?.field) {
    const known: Record<string, string> = { email: "email", password: "password", displayName: "displayName" };
    const field = known[err.details.field];
    if (field) return { field, message: "Please check this field." };
  }
  return null;
}

/**
 * Two-step registration ("notebook spread"): step 1 collects the account
 * details, step 2 picks the favourite club — and choosing a club submits the
 * whole form (the backend register is a single call), landing on a celebration.
 */
export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const clubs = useClubs();

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState<Language>("is");
  const [clubId, setClubId] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const liveErrors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 8 || password.length > 128) next.password = "Password must be 8–128 characters.";
    if (displayName.trim().length < 1 || displayName.length > 60) next.displayName = "Display name must be 1–60 characters.";
    return next;
  }, [email, password, displayName]);

  const shownError = (name: string) => serverErrors[name] ?? (touched[name] ? liveErrors[name] : undefined);
  const selectedClub = clubId && clubs.data ? clubs.data.find((club) => club.clubId === clubId) ?? null : null;

  const update = (name: string, setter: (value: string) => void) => (value: string) => {
    setter(value);
    setServerErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };
  const touch = (name: string) => setTouched((prev) => ({ ...prev, [name]: true }));

  function goClub() {
    setTouched({ displayName: true, email: true, password: true });
    if (Object.keys(liveErrors).length === 0) setStep(1);
  }

  function handleRegisterError(err: unknown) {
    if (!(err instanceof ApiError)) {
      setFormError("Something went wrong. Please try again.");
      return;
    }
    const fieldError = mapFieldError(err);
    if (fieldError) {
      setServerErrors((prev) => ({ ...prev, [fieldError.field]: fieldError.message }));
      setTouched((prev) => ({ ...prev, [fieldError.field]: true }));
      setClubId(null);
      setStep(0);
    } else if (err.code === "invalid_club") {
      setFormError("That club isn't valid. Please pick another.");
      setClubId(null);
    } else if (err.status === 429) {
      setFormError("Too many attempts, please wait a moment.");
    } else {
      setFormError("Something went wrong. Please try again.");
    }
  }

  async function pickClub(id: string) {
    setFormError(null);
    setClubId(id);
    setSubmitting(true);
    try {
      await register({ email, password, displayName, language, favoriteClubId: id });
      setDone(true);
    } catch (err) {
      handleRegisterError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack reg-wrap">
      <div className="reg-spread">
        <RegisterCover club={selectedClub} step={step} done={done} />

        <div className="reg-form">
          <div className="reg-form-inner">
            {done ? (
              <Celebration displayName={displayName} club={selectedClub} onEnter={() => navigate("/")} />
            ) : step === 0 ? (
              <div className="reg-page">
                <h2>Your details</h2>
                <p className="reg-lede">Takes about a minute.</p>
                <div className="reg-fields">
                  <RegField
                    id="displayName"
                    label="Display name"
                    placeholder="e.g. Halla"
                    autoFocus
                    value={displayName}
                    onChange={update("displayName", setDisplayName)}
                    onBlur={() => touch("displayName")}
                    error={shownError("displayName")}
                  />
                  <RegField
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="you@club.is"
                    value={email}
                    onChange={update("email", setEmail)}
                    onBlur={() => touch("email")}
                    error={shownError("email")}
                  />
                  <div>
                    <RegField
                      id="password"
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      hint="8+ characters"
                      value={password}
                      onChange={update("password", setPassword)}
                      onBlur={() => touch("password")}
                      error={shownError("password")}
                    />
                    <PasswordStrength value={password} />
                  </div>
                  <div>
                    <div className="reg-field-label" style={{ marginBottom: 9 }}>
                      Language
                    </div>
                    <LanguagePicker value={language} onChange={setLanguage} />
                  </div>
                </div>
                <div className="reg-actions">
                  <div className="reg-actions-spacer" />
                  <button className="btn btn--amber" onClick={goClub}>
                    Continue <Icon name="arrow" size={16} sketch={false} />
                  </button>
                </div>
                <p className="reg-have-account">
                  Already have an account? <Link to="/login">Log in</Link>
                </p>
              </div>
            ) : (
              <div className="reg-page">
                <h2>Who do you support?</h2>
                <p className="reg-lede">Tap a club &mdash; we&rsquo;ll set up your notebook straight away.</p>
                {formError && (
                  <p className="form-error" role="alert">
                    {formError}
                  </p>
                )}
                {clubs.isPending && <Loading />}
                {clubs.isError && <ErrorView error={clubs.error} notFoundLabel="No clubs found" />}
                {clubs.data && <ClubPicker clubs={clubs.data} value={clubId} onChange={pickClub} />}
                <div className="reg-actions">
                  <button className="btn btn--ghost" onClick={() => setStep(0)} disabled={submitting}>
                    Back
                  </button>
                  <div className="reg-actions-spacer" />
                  {submitting ? (
                    <span className="reg-busy">
                      <span className="reg-spin" /> Setting up your notebook&hellip;
                    </span>
                  ) : (
                    <span className="scribble" style={{ fontSize: 17, color: "var(--ink-3)" }}>
                      tap a crest to finish &rarr;
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

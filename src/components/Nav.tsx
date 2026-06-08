import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/useAuth";
import { useShortlist } from "../query/hooks";
import { LanguageToggle } from "./LanguageToggle";

/** Brand logomark: the hand-drawn handball tucked into a goal's top corner. */
function LogoMark() {
  return (
    <span className="logomark" aria-hidden="true">
      <img src="/assets/logo.png" alt="" className="logomark-img" />
    </span>
  );
}

/** "Olís deildin Fantasy" wordmark with its handwritten tagline. */
function Wordmark() {
  const { t } = useTranslation();
  return (
    <span className="wordmark">
      <span className="wordmark-name">{t("brand.name")}</span>
      <span className="wordmark-sub">{t("brand.tagline")}</span>
    </span>
  );
}

function AuthArea() {
  const { t } = useTranslation();
  const { status, user } = useAuth();
  const { data } = useShortlist();
  if (status === "loading") return null;
  if (status === "authenticated" && user) {
    return (
      <nav className="nav-auth" aria-label={t("nav.account")}>
        <Link to="/market" className="nav-link">{t("nav.market")}</Link>
        <Link to="/squad" className="nav-link">{t("nav.mySquad")}</Link>
        <Link to="/leagues" className="nav-link">{t("nav.leagues")}</Link>
        <Link to="/shortlist" className="nav-shortlist">
          {data ? t("nav.shortlistWithCount", { count: data.count }) : t("nav.shortlist")}
        </Link>
        <Link to="/account" className="user-name">{user.displayName}</Link>
      </nav>
    );
  }
  return (
    <nav className="nav-auth" aria-label={t("nav.account")}>
      <Link to="/login">{t("nav.login")}</Link>
      <Link to="/register">{t("nav.register")}</Link>
    </nav>
  );
}

export function Nav() {
  const { t } = useTranslation();
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label={t("nav.home")}>
          <LogoMark />
          <Wordmark />
        </Link>
        <div className="nav-right">
          <LanguageToggle />
          <AuthArea />
        </div>
      </div>
    </header>
  );
}

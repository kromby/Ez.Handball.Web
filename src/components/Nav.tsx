import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { useShortlist } from "../query/hooks";

/** Brand logomark: the hand-drawn handball tucked into a goal's top corner. */
function LogoMark() {
  return (
    <span className="logomark" aria-hidden="true">
      <img src="/assets/logo.png" alt="" className="logomark-img" />
    </span>
  );
}

/** "Ez.Handball" wordmark with its handwritten tagline. */
function Wordmark() {
  return (
    <span className="wordmark">
      <span className="wordmark-name">Ez.Handball</span>
      <span className="wordmark-sub">the stats, drawn by hand</span>
    </span>
  );
}

function AuthArea() {
  const { status, user } = useAuth();
  const { data } = useShortlist();
  if (status === "loading") return null;
  if (status === "authenticated" && user) {
    return (
      <nav className="nav-auth" aria-label="Account">
        <Link to="/shortlist" className="nav-shortlist">
          {data ? `Shortlist · ${data.count}` : "Shortlist"}
        </Link>
        <Link to="/account" className="user-name">{user.displayName}</Link>
      </nav>
    );
  }
  return (
    <nav className="nav-auth" aria-label="Account">
      <Link to="/login">Log in</Link>
      <Link to="/register">Register</Link>
    </nav>
  );
}

export function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="Ez.Handball — home">
          <LogoMark />
          <Wordmark />
        </Link>
        <AuthArea />
      </div>
    </header>
  );
}

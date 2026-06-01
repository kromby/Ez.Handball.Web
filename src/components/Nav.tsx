import { Link } from "react-router-dom";

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

export function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand" aria-label="Ez.Handball — home">
          <LogoMark />
          <Wordmark />
        </Link>
      </div>
    </header>
  );
}

import { Link } from "react-router-dom";

/** Brand logomark: the hand-drawn handball tucked into a goal's top corner. */
function LogoMark() {
  return (
    <span className="logomark" aria-hidden="true">
      <img src="/assets/ball.png" alt="" className="logomark-ball" />
      <svg viewBox="0 0 48 48" className="logomark-goal">
        <g filter="url(#pencil)">
          <path
            d="M5 9 H40 V13 H9 V44"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M40 9 V30" stroke="var(--ink)" strokeWidth="3.4" strokeLinecap="round" />
        </g>
      </svg>
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

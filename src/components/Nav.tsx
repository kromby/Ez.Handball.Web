import { Link } from "react-router-dom";

export function Nav() {
  return (
    <header className="nav">
      <Link to="/" className="nav-title">
        Ez.Handball
      </Link>
    </header>
  );
}

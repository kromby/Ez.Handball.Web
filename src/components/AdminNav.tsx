import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function AdminNav() {
  const { t } = useTranslation();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `admin-subnav-link${isActive ? " is-active" : ""}`;
  return (
    <nav className="admin-subnav" aria-label={t("nav.admin")}>
      <NavLink to="/admin/tournaments" className={linkClass}>
        {t("admin.tournaments.title")}
      </NavLink>
      <NavLink to="/admin/games" className={linkClass}>
        {t("admin.games.title")}
      </NavLink>
    </nav>
  );
}

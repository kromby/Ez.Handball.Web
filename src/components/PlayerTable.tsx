import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { StarToggle } from "./StarToggle";

export interface PlayerColumn<T> {
  key: string;
  header: string;
  align?: "right";
  render: (row: T) => ReactNode;
}

interface PlayerRow {
  playerId: string;
  name: string | null;
  clubName: string | null;
}

const numClass = (align?: "right") => (align === "right" ? "num" : undefined);

export function PlayerTable<T extends PlayerRow>({
  rows,
  before = [],
  after = [],
  emptyLabel,
}: {
  rows: T[];
  before?: PlayerColumn<T>[];
  after?: PlayerColumn<T>[];
  emptyLabel?: string;
}) {
  const { t } = useTranslation();
  if (rows.length === 0) return <p className="status">{emptyLabel ?? t("leaderboard.noPlayers")}</p>;
  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th aria-label="Shortlist" />
          {before.map((c) => (
            <th key={c.key} className={numClass(c.align)}>{c.header}</th>
          ))}
          <th>{t("leaderboard.player")}</th>
          <th>{t("leaderboard.club")}</th>
          {after.map((c) => (
            <th key={c.key} className={numClass(c.align)}>{c.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.playerId}>
            <td><StarToggle playerId={row.playerId} /></td>
            {before.map((c) => (
              <td key={c.key} className={numClass(c.align)}>{c.render(row)}</td>
            ))}
            <td>
              <Link to={`/players/${encodeURIComponent(row.playerId)}`}>{row.name ?? "Unknown player"}</Link>
            </td>
            <td>{row.clubName ?? "—"}</td>
            {after.map((c) => (
              <td key={c.key} className={numClass(c.align)}>{c.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { MatchPlayerLine } from "../api/types";
import { Panel } from "./Panel";

// HBStatz fields are null until HBStatz reports the match — show a dash, not a misleading 0.
const countOrDash = (value: number | null) => (value == null ? "—" : value);
// Fantasy points can be halves (10.5); show a decimal only when there is one.
const pointsLabel = (value: number | null) =>
  value == null ? "—" : Number.isInteger(value) ? String(value) : value.toFixed(1);

function RosterRow({ player }: { player: MatchPlayerLine }) {
  const { t } = useTranslation();
  return (
    <tr>
      <td className="num">{player.jerseyNumber ?? ""}</td>
      <td>
        <Link to={`/players/${encodeURIComponent(player.playerId)}`}>{player.name ?? t("match.unknownPlayer")}</Link>
      </td>
      <td className="num">{player.goals}</td>
      <td className="num">{player.yellowCards}</td>
      <td className="num">{player.twoMinuteSuspensions}</td>
      <td className="num">{player.redCards}</td>
      <td className="num">{countOrDash(player.hbStatzAssists)}</td>
      <td className="num">{countOrDash(player.hbStatzSteals)}</td>
      <td className="num">{countOrDash(player.hbStatzBlocks)}</td>
      <td className="num">{countOrDash(player.hbStatzSaves)}</td>
      <td className="num roster-points">{pointsLabel(player.points)}</td>
    </tr>
  );
}

function RosterTable({ players }: { players: MatchPlayerLine[] }) {
  const { t } = useTranslation();
  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th className="num">#</th>
          <th>{t("leaderboard.player")}</th>
          <th className="num">{t("leaderboard.goals")}</th>
          <th className="num">{t("match.yellow")}</th>
          <th className="num">{t("leaderboard.metricTwoMinSuspensions")}</th>
          <th className="num">{t("match.red")}</th>
          <th className="num">{t("playerHub.assists")}</th>
          <th className="num">{t("match.steals")}</th>
          <th className="num">{t("match.blocks")}</th>
          <th className="num">{t("playerHub.saves")}</th>
          <th className="num">{t("playerHub.rating")}</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player) => (
          <RosterRow key={player.playerId} player={player} />
        ))}
      </tbody>
    </table>
  );
}

export function MatchRoster({
  title,
  players,
  logoUrl,
}: {
  title: string;
  players: MatchPlayerLine[];
  logoUrl?: string | null;
}) {
  return (
    <Panel className="roster">
      <h3 className="section-title roster-title">
        {logoUrl && <img className="club-logo-sm" src={logoUrl} alt="" />}
        {title}
      </h3>
      <RosterTable players={players} />
    </Panel>
  );
}

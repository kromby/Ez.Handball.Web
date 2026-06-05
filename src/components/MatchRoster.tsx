import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { MatchPlayerLine } from "../api/types";
import { Panel } from "./Panel";

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

export function MatchRoster({ title, players }: { title: string; players: MatchPlayerLine[] }) {
  return (
    <Panel className="roster">
      <h3 className="section-title">{title}</h3>
      <RosterTable players={players} />
    </Panel>
  );
}

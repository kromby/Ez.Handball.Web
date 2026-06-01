import { Link } from "react-router-dom";
import type { MatchPlayerLine } from "../api/types";
import { Panel } from "./Panel";

function RosterRow({ player }: { player: MatchPlayerLine }) {
  return (
    <tr>
      <td className="num">{player.jerseyNumber ?? ""}</td>
      <td>
        <Link to={`/players/${encodeURIComponent(player.playerId)}`}>{player.name ?? "Unknown player"}</Link>
      </td>
      <td className="num">{player.goals}</td>
      <td className="num">{player.yellowCards}</td>
      <td className="num">{player.twoMinuteSuspensions}</td>
      <td className="num">{player.redCards}</td>
    </tr>
  );
}

function RosterTable({ players }: { players: MatchPlayerLine[] }) {
  return (
    <table className="stats-table">
      <thead>
        <tr>
          <th className="num">#</th>
          <th>Player</th>
          <th className="num">Goals</th>
          <th className="num">Yellow</th>
          <th className="num">2-min</th>
          <th className="num">Red</th>
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

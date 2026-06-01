import { Link } from "react-router-dom";
import type { MatchPlayerLine } from "../api/types";

export function MatchRoster({ title, players }: { title: string; players: MatchPlayerLine[] }) {
  return (
    <div className="roster">
      <h3 className="section-title">{title}</h3>
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
          {players.map((pl) => (
            <tr key={pl.playerId}>
              <td className="num">{pl.jerseyNumber ?? ""}</td>
              <td>
                <Link to={`/players/${encodeURIComponent(pl.playerId)}`}>{pl.name ?? "Unknown player"}</Link>
              </td>
              <td className="num">{pl.goals}</td>
              <td className="num">{pl.yellowCards}</td>
              <td className="num">{pl.twoMinuteSuspensions}</td>
              <td className="num">{pl.redCards}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

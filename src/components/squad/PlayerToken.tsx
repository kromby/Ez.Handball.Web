import { Link } from "react-router-dom";
import type { SquadPlayer } from "../../api/types";
import { BallAvatar } from "../BallAvatar";

/** "–" for an unusable rating (0 = below min-games guard, or null/undefined). */
function ratingLabel(rating: number | null | undefined): string {
  return rating && rating > 0 ? String(Math.round(rating)) : "–";
}

function lastName(name: string | null): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1];
}

export interface PlayerTokenProps {
  code: string;          // position code shown on the badge
  x: number;             // anchor, % of court width
  y: number;             // anchor, % of court height
  player?: SquadPlayer;  // omit for an empty ghost slot
  selected?: boolean;
  onSelect: (playerId: string) => void;
}

export function PlayerToken({ code, x, y, player, selected, onSelect }: PlayerTokenProps) {
  const style = { left: `${x}%`, top: `${y}%` } as const;

  if (!player) {
    return (
      <Link to="/market" className="player-token player-token--ghost" style={style}>
        <span className="token-ball token-ball--ghost" aria-hidden="true">+</span>
        <span className="token-badge">{code}</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`player-token${selected ? " is-selected" : ""}`}
      style={style}
      onClick={() => onSelect(player.playerId)}
    >
      <span className="token-av">
        <BallAvatar size={42} />
        <span className="token-badge">{code}</span>
      </span>
      <span className="token-label">
        <span className="token-name">{lastName(player.name)}</span>
        <span className="token-rating">{ratingLabel(player.rating)}</span>
      </span>
    </button>
  );
}

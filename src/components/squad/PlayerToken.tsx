import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { SquadPlayer } from "../../api/types";
import { BallAvatar } from "../BallAvatar";
import { ratingLabel } from "./ratingLabel";

/**
 * Short name shown on a court token. Uses the FIRST name — the common form of
 * address in Iceland (the trailing word is usually a patronymic, not a surname).
 * Making first-vs-last configurable is tracked as a follow-up.
 */
function shortName(name: string | null): string {
  if (!name) return "—";
  return name.trim().split(/\s+/)[0];
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
  const { t } = useTranslation();
  const style = { left: `${x}%`, top: `${y}%` } as const;

  if (!player) {
    return (
      <Link
        to="/market"
        className="player-token player-token--ghost"
        style={style}
        aria-label={t("squad.addSlot", { code })}
      >
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
        <span className="token-name">{shortName(player.name)}</span>
        <span className="token-rating">{ratingLabel(player.rating)}</span>
      </span>
    </button>
  );
}

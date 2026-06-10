import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { formatMoney } from "../../api/money";
import type { SquadPlayer } from "../../api/types";
import { BallAvatar } from "../BallAvatar";
import { SketchBox } from "../SketchBox";
import { SellButton } from "../SellButton";
import { ratingLabel } from "./ratingLabel";

export function SelectedPlayerPanel({ player }: { player: SquadPlayer | null }) {
  const { t } = useTranslation();

  if (!player) {
    return (
      <SketchBox tone="sunken" radius={14} pad="22px">
        <p className="scribble panel-empty">{t("squad.tapPrompt")}</p>
      </SketchBox>
    );
  }

  const drift = player.price ? player.price.amount - player.pricePaid.amount : null;

  return (
    <SketchBox tone="paper" radius={14} pad="18px 20px">
      <div className="panel-head">
        <BallAvatar size={46} />
        <div className="panel-id">
          <h3 className="panel-name">{player.name ?? t("match.unknownPlayer")}</h3>
          <div className="panel-meta">
            {player.clubName ?? ""} · <span className="token-badge">{player.position ?? "—"}</span>
          </div>
        </div>
        <div className="panel-rating">
          <div className="panel-rating-num">{ratingLabel(player.rating)}</div>
          <div className="poslabel">{t("squad.rating")}</div>
        </div>
      </div>

      <div className="panel-stats">
        <div className="panel-stat">
          <div className="panel-stat-v amber">{formatMoney(player.price)}</div>
          <div className="poslabel">{t("squad.price")}</div>
        </div>
        <div className="panel-stat">
          <div className="panel-stat-v">{formatMoney(player.pricePaid)}</div>
          <div className="poslabel">{t("squad.paidLabel")}</div>
        </div>
        {drift !== null && (
          <div className="panel-stat">
            <div
              data-testid="drift"
              className={`panel-stat-v ${drift >= 0 ? "drift-up" : "drift-down"}`}
            >
              {drift >= 0 ? "▲" : "▼"} {formatMoney({ amount: Math.abs(drift), currency: player.pricePaid.currency })}
            </div>
            <div className="poslabel">{t("squad.drift")}</div>
          </div>
        )}
      </div>

      <div className="panel-actions">
        <SellButton player={{ playerId: player.playerId, name: player.name }} />
        {player.price && (
          <span className="panel-frees">{t("squad.frees", { price: formatMoney(player.price) })}</span>
        )}
      </div>
      <Link className="panel-link" to={`/players/${encodeURIComponent(player.playerId)}`}>
        {t("squad.viewProfile")}
      </Link>
    </SketchBox>
  );
}

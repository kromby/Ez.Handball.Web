import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { formatMoney } from "../../api/money";
import type { SquadPlayer } from "../../api/types";
import { BallAvatar } from "../BallAvatar";
import { SketchBox } from "../SketchBox";
import { SellButton } from "../SellButton";
import { ratingLabel } from "./ratingLabel";

/** One labelled stat cell in the panel's stat row. */
function StatCell({
  label,
  value,
  valueClassName,
  testId,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  testId?: string;
}) {
  return (
    <div className="panel-stat">
      <div data-testid={testId} className={`panel-stat-v ${valueClassName ?? ""}`.trim()}>
        {value}
      </div>
      <div className="poslabel">{label}</div>
    </div>
  );
}

/** Avatar + name/club/position + big rating. Kept as its own component to keep the panel's JSX shallow. */
function PanelHead({ player }: { player: SquadPlayer }) {
  const { t } = useTranslation();
  return (
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
  );
}

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
  const driftValue = (amount: number, currency: string): string =>
    `${amount >= 0 ? "▲" : "▼"} ${formatMoney({ amount: Math.abs(amount), currency })}`;

  return (
    <SketchBox tone="paper" radius={14} pad="18px 20px">
      <PanelHead player={player} />

      <div className="panel-stats">
        <StatCell label={t("squad.price")} value={formatMoney(player.price)} valueClassName="amber" />
        <StatCell label={t("squad.paidLabel")} value={formatMoney(player.pricePaid)} />
        {drift !== null && (
          <StatCell
            label={t("squad.drift")}
            value={driftValue(drift, player.pricePaid.currency)}
            valueClassName={drift >= 0 ? "drift-up" : "drift-down"}
            testId="drift"
          />
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

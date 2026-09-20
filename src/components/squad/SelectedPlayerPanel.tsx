import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { formatMoney } from "../../api/money";
import type { ClubMatch, SquadPlayer } from "../../api/types";
import { useClub, useClubMatches, useMyGameweeks } from "../../query/hooks";
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
function PanelHead({ player, clubLogoUrl }: { player: SquadPlayer; clubLogoUrl: string | null | undefined }) {
  const { t } = useTranslation();
  return (
    <div className="panel-head">
      {clubLogoUrl ? (
        <img className="panel-crest" src={clubLogoUrl} alt="" />
      ) : (
        <BallAvatar size={46} />
      )}
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

/** One row of the "form" section: a label plus optional points and/or opponent crest+name. */
function PanelFixtureRow({
  label,
  points,
  opponent,
}: {
  label: string;
  points?: string | null;
  opponent: ClubMatch | null;
}) {
  const { t } = useTranslation();
  return (
    <div className="panel-fixture">
      <span className="poslabel">{label}</span>
      <span className="panel-fixture-body">
        {points != null && <span className="panel-fixture-pts">{points}</span>}
        {opponent && (
          <span className="panel-fixture-opp">
            {opponent.opponentLogoUrl ? (
              <img className="panel-fixture-logo" src={opponent.opponentLogoUrl} alt="" />
            ) : (
              <span className="panel-fixture-logo panel-fixture-logo--blank" aria-hidden="true" />
            )}
            {t("match.versus")} {opponent.opponentName ?? t("club.unknownOpponent")}
          </span>
        )}
      </span>
    </div>
  );
}

export function SelectedPlayerPanel({ player }: { player: SquadPlayer | null }) {
  const { t } = useTranslation();
  const clubId = player?.clubId ?? "";
  const club = useClub(clubId);
  const played = useClubMatches(clubId, "played");
  const upcoming = useClubMatches(clubId, "upcoming");
  const gameweeks = useMyGameweeks();

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

  const settledGameweeks = gameweeks.data?.gameweeks ?? [];
  const lastSettled = settledGameweeks[settledGameweeks.length - 1] ?? null;
  const lastRoundScore = lastSettled?.breakdown.find((entry) => entry.playerId === player.playerId) ?? null;
  const lastOpponent = played.data?.matches[0] ?? null;
  const nextOpponent = upcoming.data?.matches[0] ?? null;
  const lastRoundPoints = lastRoundScore
    ? lastRoundScore.played
      ? t("squad.pts", { points: lastRoundScore.points })
      : t("gameweekScores.dnp")
    : null;

  return (
    <SketchBox tone="paper" radius={14} pad="18px 20px">
      <PanelHead player={player} clubLogoUrl={club.data?.logoUrl} />

      {lastRoundScore && (
        <PanelFixtureRow label={t("squad.lastRound")} points={lastRoundPoints} opponent={lastOpponent} />
      )}
      {nextOpponent && <PanelFixtureRow label={t("squad.nextMatch")} opponent={nextOpponent} />}

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

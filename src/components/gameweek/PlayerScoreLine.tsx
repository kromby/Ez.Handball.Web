import { useTranslation } from "react-i18next";

export interface PlayerScoreLineProps {
  name: string;
  position: string | null;
  rawPoints: number;
  points: number;
  played: boolean;
  autoSubbedIn: boolean;
  captainApplied: boolean;
  multiplier: number;
}

export function PlayerScoreLine({
  name,
  position,
  rawPoints,
  points,
  played,
  autoSubbedIn,
  captainApplied,
  multiplier,
}: PlayerScoreLineProps) {
  const { t } = useTranslation();
  return (
    <div className={`gwsc-line${played ? "" : " gwsc-line--dnp"}`}>
      <span className="gwsc-pos poslabel">{position ?? ""}</span>
      <span className="gwsc-name" data-testid="gwsc-line-name">
        {name}
        {captainApplied && (
          <span
            className="gwsc-badge gwsc-badge--cap"
            aria-label={t("gameweekScores.captainBadgeLabel", { multiplier })}
          >
            {t("gameweekScores.captainBadge", { multiplier })}
          </span>
        )}
        {autoSubbedIn && (
          <span
            className="gwsc-badge gwsc-badge--sub"
            aria-label={t("gameweekScores.subBadgeLabel")}
          >
            {t("gameweekScores.subBadge")}
          </span>
        )}
      </span>
      <span className="gwsc-raw">
        {played
          ? t("gameweekScores.raw", { points: rawPoints })
          : t("gameweekScores.dnp")}
      </span>
      <span className="gwsc-final">{points}</span>
    </div>
  );
}

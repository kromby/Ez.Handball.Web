import { useTranslation } from "react-i18next";
import { useCurrentGameweek } from "../../query/hooks";
import { formatDeadline, formatKickoff } from "./datetime";
import { gameweekLabelKey } from "./gameweekLabels";
import { GameweekStatusPill } from "./GameweekStatusPill";
import { useCountdown } from "./useCountdown";

function earliestThrow(dates: string[]): string {
  return [...dates].sort()[0] ?? "";
}

export function CurrentGameweekStrip() {
  const { t } = useTranslation();
  const { data } = useCurrentGameweek();
  const gw = data?.current ?? null;
  const countdown = useCountdown(gw?.deadline ?? "");

  if (!gw) return null;

  const firstThrow = earliestThrow(gw.matches.map((m) => m.date));

  return (
    <div className="gw-strip">
      <div className="gw-strip-round">
        <span className="gw-strip-round-label">{t("gameweek.roundLabel", { label: gw.roundLabel })}</span>
        <span className="gw-strip-round-num">{gw.number}</span>
      </div>
      <div className="gw-strip-body">
        <div className="gw-strip-title">{t("gameweek.matchWeekend")}</div>
        <div className="gw-strip-meta">
          {t("gameweek.matchCount", { count: gw.matches.length, time: formatKickoff(firstThrow) })}
        </div>
        <GameweekStatusPill labelKey={gameweekLabelKey(gw.status, true)} />
      </div>
      <div className="gw-strip-deadline">
        <div className="gw-strip-eyebrow">{t("gameweek.locksInEyebrow")}</div>
        <div className="gw-countdown">{countdown.locked ? t("gameweek.locked") : countdown.label}</div>
        <div className="gw-strip-deadline-at">{t("gameweek.deadlineAt", { time: formatDeadline(gw.deadline) })}</div>
      </div>
    </div>
  );
}

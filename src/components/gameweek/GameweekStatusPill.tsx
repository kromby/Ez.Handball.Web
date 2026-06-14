import { useTranslation } from "react-i18next";
import type { GameweekLabelKey } from "./gameweekLabels";

export function GameweekStatusPill({ labelKey }: { labelKey: GameweekLabelKey }) {
  const { t } = useTranslation();
  return (
    <span className={`gw-pill gw-pill--${labelKey}`}>
      {t(`gameweek.status.${labelKey}`)}
    </span>
  );
}

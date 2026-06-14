import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Gameweek, RoundGroup } from "../../api/types";
import { FixtureRow } from "./FixtureRow";
import { gameweekLabelKey, isCurrent } from "./gameweekLabels";
import { GameweekStatusPill } from "./GameweekStatusPill";

export function GameweekListRow({
  gameweek,
  current,
  round,
}: {
  gameweek: Gameweek;
  current: Gameweek | null;
  round: RoundGroup | undefined;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const labelKey = gameweekLabelKey(gameweek.status, isCurrent(gameweek, current));

  return (
    <div className={`gw-row${open ? " gw-row--open" : ""}`}>
      <button type="button" className="gw-row-head" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="gw-row-title">{t("gameweek.heroTitle", { number: gameweek.number })}</span>
        <span className="gw-row-round">{t("gameweek.roundLabel", { label: gameweek.roundLabel })}</span>
        <GameweekStatusPill labelKey={labelKey} />
        <span className="gw-row-chevron" aria-hidden="true">{open ? "▾" : "›"}</span>
      </button>
      {open && (
        <div className="gw-row-fixtures">
          {round && round.matches.length > 0 ? (
            round.matches.map((m) => <FixtureRow key={m.matchId} match={m} />)
          ) : (
            <p className="gw-empty-note">{t("gameweek.noFixtures")}</p>
          )}
        </div>
      )}
    </div>
  );
}

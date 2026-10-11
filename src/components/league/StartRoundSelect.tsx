import { useTranslation } from "react-i18next";
import type { Gameweek } from "../../api/types";

/** Season gameweeks in calendar order — the choices for a league's start round. */
export function sortedRounds(gameweeks: Gameweek[] | undefined): Gameweek[] {
  return [...(gameweeks ?? [])].sort((a, b) => a.number - b.number);
}

/** Drop-down of the season's gameweeks a mini-league can start counting points from. */
export function StartRoundSelect({
  id,
  rounds,
  value,
  onChange,
  disabled,
}: {
  id: string;
  rounds: Gameweek[];
  value: string;
  onChange: (roundLabel: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="field">
      <label htmlFor={id}>{t("leagues.startRoundLabel")}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {rounds.map((gw) => (
          <option key={gw.roundLabel} value={gw.roundLabel}>
            {t("leagues.round", { label: gw.roundLabel })}
          </option>
        ))}
      </select>
      <p className="status">{t("leagues.startRoundHint")}</p>
    </div>
  );
}

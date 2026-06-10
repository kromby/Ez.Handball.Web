import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { SquadPlayer } from "../../api/types";
import { SketchBox } from "../SketchBox";
import { PlayerToken } from "./PlayerToken";

/** The seven court anchors (% of the court box). Goal at top; keeper in the mouth. */
const COURT_POS: Record<string, { x: number; y: number }> = {
  GK: { x: 50, y: 9 },
  LW: { x: 11, y: 24 }, RW: { x: 89, y: 24 },
  LP: { x: 50, y: 40 },
  LB: { x: 25, y: 60 }, RB: { x: 75, y: 60 },
  CB: { x: 50, y: 75 },
};
export const COURT_ORDER = Object.keys(COURT_POS) as (keyof typeof COURT_POS)[];

export interface SquadCourtProps {
  players: SquadPlayer[];
  selectedId: string | null;
  onSelect: (playerId: string) => void;
}

export function SquadCourt({ players, selectedId, onSelect }: SquadCourtProps) {
  const { t } = useTranslation();
  const { byPos, others } = useMemo(() => {
    const byPos = new Map<string, SquadPlayer[]>();
    for (const p of players) {
      const code = p.position ?? "";
      byPos.set(code, [...(byPos.get(code) ?? []), p]);
    }
    const others = players.filter((p) => !p.position || !(p.position in COURT_POS));
    return { byPos, others };
  }, [players]);

  return (
    <SketchBox tone="paper" radius={18} pad={14}>
      <div className="court">
        {/* markings match the 440×340 design artboard — edit with the spec open */}
        <svg className="court-mk" viewBox="0 0 440 340" preserveAspectRatio="none" aria-hidden="true">
          <rect x="8" y="8" width="424" height="324" rx="10" fill="none" stroke="#c9bb98" strokeWidth="1.8" />
          <path d="M36 8 C 36 244 404 244 404 8" fill="none" stroke="#a9986f" strokeWidth="1.8" strokeDasharray="3 9" />
          <path d="M114 8 C 114 150 326 150 326 8 Z" fill="var(--amber-wash)" fillOpacity="0.6" stroke="var(--amber-deep)" strokeWidth="2" />
          <rect x="190" y="2" width="60" height="9" rx="2" fill="none" stroke="#7a7050" strokeWidth="2.8" />
        </svg>

        {COURT_ORDER.map((code) => {
          const here = byPos.get(code) ?? [];
          const anchor = COURT_POS[code];
          if (here.length === 0) {
            return <PlayerToken key={code} code={code} x={anchor.x} y={anchor.y} onSelect={onSelect} />;
          }
          return here.map((p, i) => {
            const spread = here.length > 1 ? (i - (here.length - 1) / 2) * 16 : 0;
            return (
              <PlayerToken
                key={p.playerId}
                code={code}
                x={anchor.x + spread}
                y={anchor.y}
                player={p}
                selected={p.playerId === selectedId}
                onSelect={onSelect}
              />
            );
          });
        })}
      </div>

      {others.length > 0 && (
        <div className="court-others" data-testid="court-others">
          <div className="poslabel">{t("squad.others")}</div>
          <ul>
            {others.map((p) => (
              <li key={p.playerId}>
                <button type="button" className="court-others-row" onClick={() => onSelect(p.playerId)}>
                  {p.name ?? t("match.unknownPlayer")} <span className="token-badge">{p.position ?? "—"}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </SketchBox>
  );
}

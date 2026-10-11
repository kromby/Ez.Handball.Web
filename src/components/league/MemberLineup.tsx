import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { MemberLineupSlot } from "../../api/types";

function ArmbandBadge({ role }: { role: MemberLineupSlot["role"] }) {
  const { t } = useTranslation();
  if (role === "Captain") {
    return (
      <span className="gwsc-badge gwsc-badge--cap" aria-label={t("leagueMember.captainLabel")}>
        {t("leagueMember.captainBadge")}
      </span>
    );
  }
  if (role === "Vice") {
    return (
      <span className="gwsc-badge" aria-label={t("leagueMember.viceLabel")}>
        {t("leagueMember.viceBadge")}
      </span>
    );
  }
  return null;
}

function SlotLine({ slot }: { slot: MemberLineupSlot }) {
  const { t } = useTranslation();
  return (
    <li className="gwsc-line">
      <span className="gwsc-pos poslabel">{slot.position ?? ""}</span>
      <span className="gwsc-name">
        {slot.name ?? t("gameweekScores.unknownPlayer")}
        <ArmbandBadge role={slot.role} />
      </span>
    </li>
  );
}

/** A lineup frozen at a round's deadline: starters first, then the bench in substitution order. */
export function MemberLineup({ lineup }: { lineup: MemberLineupSlot[] }) {
  const { t } = useTranslation();
  const listId = useId();
  const starters = lineup.filter((slot) => slot.role !== "Bench");
  const bench = lineup
    .filter((slot) => slot.role === "Bench")
    .sort((first, second) => (first.benchOrder ?? 0) - (second.benchOrder ?? 0));

  return (
    <div className="member-lineup">
      <h3 className="poslabel" id={`${listId}-starters`}>{t("leagueMember.starters")}</h3>
      <ul className="member-lineup-list" aria-labelledby={`${listId}-starters`}>
        {starters.map((slot) => <SlotLine key={slot.playerId} slot={slot} />)}
      </ul>
      {bench.length > 0 && (
        <>
          <h3 className="poslabel member-lineup-bench" id={`${listId}-bench`}>{t("leagueMember.bench")}</h3>
          <ul className="member-lineup-list" aria-labelledby={`${listId}-bench`}>
            {bench.map((slot) => <SlotLine key={slot.playerId} slot={slot} />)}
          </ul>
        </>
      )}
    </div>
  );
}

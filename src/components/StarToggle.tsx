import type { MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/useAuth";
import { useAddToShortlist, useRemoveFromShortlist, useShortlist } from "../query/hooks";

export function StarToggle({ playerId, name }: { playerId: string; name?: string | null }) {
  const { t } = useTranslation();
  const { status } = useAuth();
  const { data } = useShortlist();
  const add = useAddToShortlist();
  const remove = useRemoveFromShortlist();

  // Hooks above run unconditionally; bail out after they're called.
  if (status !== "authenticated" || !data) return null;

  const member = data.items.some((i) => i.playerId === playerId);
  const atCap = !member && data.count >= data.max;

  const playerName = name ?? t("match.unknownPlayer");

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // don't trigger an enclosing row/link
    if (member) remove.mutate(playerId);
    else if (!atCap) add.mutate(playerId);
  };

  return (
    <button
      type="button"
      className={`star-toggle${member ? " is-on" : ""}`}
      aria-pressed={member}
      aria-label={member ? t("shortlist.remove", { name: playerName }) : t("shortlist.add", { name: playerName })}
      disabled={atCap}
      title={atCap ? t("shortlist.full", { max: data.max }) : undefined}
      onClick={onClick}
    >
      {member ? "★" : "☆"}
    </button>
  );
}

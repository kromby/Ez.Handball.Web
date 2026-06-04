import type { MouseEvent } from "react";
import { useAuth } from "../auth/useAuth";
import { useAddToShortlist, useRemoveFromShortlist, useShortlist } from "../query/hooks";

export function StarToggle({ playerId }: { playerId: string }) {
  const { status } = useAuth();
  const { data } = useShortlist();
  const add = useAddToShortlist();
  const remove = useRemoveFromShortlist();

  // Hooks above run unconditionally; bail out after they're called.
  if (status !== "authenticated" || !data) return null;

  const member = data.items.some((i) => i.playerId === playerId);
  const atCap = !member && data.count >= data.max;

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
      aria-label={member ? "Remove from shortlist" : "Add to shortlist"}
      disabled={atCap}
      title={atCap ? `Shortlist full (${data.max}/${data.max}) — remove one to add more` : undefined}
      onClick={onClick}
    >
      {member ? "★" : "☆"}
    </button>
  );
}

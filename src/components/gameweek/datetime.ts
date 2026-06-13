/** Weekday + 24h time, e.g. "Sat 17:00". Falls back to the raw ISO if unparseable. */
export function formatKickoff(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Weekday + 24h time for a deadline, e.g. "Sat 18:00". */
export function formatDeadline(iso: string): string {
  return formatKickoff(iso);
}

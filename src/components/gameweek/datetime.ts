/** Weekday + 24h time, e.g. "Sat 17:00". Falls back to the raw ISO if unparseable. */
export function formatKickoff(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString(undefined, {
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

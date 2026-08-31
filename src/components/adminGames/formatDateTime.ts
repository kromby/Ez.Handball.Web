export function formatDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString(undefined, {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

/** The single source of truth for the club page route. */
export function clubPath(clubId: string): string {
  return `/clubs/${encodeURIComponent(clubId)}`;
}

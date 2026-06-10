/** Squad rating for display: "–" when unusable (0 = below min-games guard, or null/undefined), else the rounded number. */
export function ratingLabel(rating: number | null | undefined): string {
  return rating && rating > 0 ? String(Math.round(rating)) : "–";
}

/**
 * Club identity colours for the registration cover + crest fills.
 *
 * The backend's `GET /api/clubs` returns no colour, so we derive one
 * deterministically from the club id: stable across sessions and distinct per
 * club, which preserves the design's "cover retints to your club" moment. The
 * palette stays inside the sketchbook's warm/earthy range (no neon, no bright
 * purple). If the API ever adds a real colour, callers swap to it here.
 */
const CLUB_PALETTE = [
  "#c2603f", // terracotta
  "#b0832a", // ochre
  "#5e7d4a", // olive
  "#8a4a3a", // brick
  "#356b8c", // slate blue
  "#9c5a2c", // rust
  "#4f6d57", // pine
  "#a8503f", // clay
  "#2f7d79", // teal
];

/** A stable, on-brand colour for a club, keyed by its id. */
export function clubColor(clubId: string): string {
  let sum = 0;
  for (let i = 0; i < clubId.length; i += 1) sum += clubId.charCodeAt(i);
  return CLUB_PALETTE[sum % CLUB_PALETTE.length];
}

/** Up to two initials from a club name, for the monogram-crest fallback. */
export function clubMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** First letters of up to two words; first two letters of a single word; "?" if empty. */
export function crestInitials(teamName: string): string {
  const words = teamName.trim().split(/\s+/u).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Readable text color (black or white) for a #RRGGBB background, by luminance. */
function readableText(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return "#fff";
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1a1a1a" : "#fff";
}

export function ManagerCrest({
  teamName,
  color,
  size = 48,
}: {
  teamName: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      className="manager-crest"
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: Math.round(size / 4),
        background: color,
        color: readableText(color),
        fontWeight: 700,
        fontSize: Math.round(size / 2.4),
        lineHeight: 1,
      }}
    >
      {crestInitials(teamName)}
    </span>
  );
}

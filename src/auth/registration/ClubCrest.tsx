import type { Club } from "../../api/types";
import { clubColor, clubMonogram } from "./clubColor";

export type CrestShape = "roundel" | "shield" | "hex";

/**
 * A club's mark. When the club has a real `logoUrl` we show it; otherwise we
 * draw a hand-style monogram crest tinted with the club's derived colour. The
 * shape (roundel / shield / hex) only affects the drawn fallback.
 */
export function ClubCrest({
  club,
  size = 56,
  shape = "hex",
}: {
  club: Club;
  size?: number;
  shape?: CrestShape;
}) {
  if (club.logoUrl) {
    return (
      <img
        src={club.logoUrl}
        alt={club.name}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain", display: "block", flex: "none" }}
      />
    );
  }

  const col = clubColor(club.clubId);
  const cream = "#f7efd6";
  const mark = clubMonogram(club.name);
  const pencil = "url(#pencil)";
  const mono = (
    <text
      x="24"
      y="25"
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily="Spectral, Georgia, serif"
      fontWeight="800"
      fontSize={mark.length > 2 ? 14 : 17}
      letterSpacing="0.5"
      fill={cream}
    >
      {mark}
    </text>
  );

  let body;
  if (shape === "shield") {
    body = (
      <g>
        <path d="M7 7 H41 V27 Q41 43 24 49 Q7 43 7 27 Z" fill={col} stroke="var(--ink)" strokeWidth="2.2" filter={pencil} strokeLinejoin="round" />
        <path d="M7 18 H41" stroke={cream} strokeWidth="1.6" strokeOpacity="0.45" filter={pencil} />
        {mono}
      </g>
    );
  } else if (shape === "roundel") {
    body = (
      <g>
        <circle cx="24" cy="24" r="20" fill={col} stroke="var(--ink)" strokeWidth="2.2" filter={pencil} />
        <circle cx="24" cy="24" r="15.5" fill="none" stroke={cream} strokeWidth="1.3" strokeOpacity="0.5" filter={pencil} />
        {mono}
      </g>
    );
  } else {
    body = (
      <g>
        <path d="M24 5 L40 14 V34 L24 43 L8 34 V14 Z" fill={col} stroke="var(--ink)" strokeWidth="2.2" filter={pencil} strokeLinejoin="round" />
        <path d="M24 5 V43 M8 14 L40 34 M40 14 L8 34" stroke={cream} strokeWidth="1" strokeOpacity="0.22" filter={pencil} />
        {mono}
      </g>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label={club.name}
      style={{ display: "block", flex: "none", filter: "drop-shadow(0 1px 1.5px rgba(40,36,29,.18))" }}
    >
      {body}
    </svg>
  );
}

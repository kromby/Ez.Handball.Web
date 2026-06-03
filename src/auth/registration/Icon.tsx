import type { CSSProperties } from "react";

export type IconName = "arrow" | "check" | "search";

const PATHS: Record<Exclude<IconName, "search">, string> = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M5 13l4 4 10-11",
};

/**
 * Small hand-drawn stroke icon, matching the sketchbook borders via the shared
 * `#pencil` SVG filter (already defined once in index.html). Pass `sketch={false}`
 * to drop the wobble for tiny glyphs like the row checkmark.
 */
export function Icon({
  name,
  size = 20,
  sketch = true,
  style,
}: {
  name: IconName;
  size?: number;
  sketch?: boolean;
  style?: CSSProperties;
}) {
  const filter = sketch ? "url(#pencil)" : undefined;
  const svgProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    style: { display: "block", ...style },
  };
  if (name === "search") {
    return (
      <svg {...svgProps}>
        <g filter={filter}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </g>
      </svg>
    );
  }
  return (
    <svg {...svgProps}>
      <path d={PATHS[name]} filter={filter} />
    </svg>
  );
}

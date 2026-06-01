import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

/** Track an element's pixel size so the hand-drawn border path stays crisp. */
function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    // jsdom (tests) has no ResizeObserver — bail gracefully; w stays 0 and the SVG is skipped.
    if (typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** Tiny seeded PRNG (Lehmer) so the wobble is stable across renders. */
function seededRng(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => (state = (state * 16807) % 2147483647) / 2147483647;
}

/**
 * Build a hand-drawn rounded-rect outline by walking the perimeter and nudging
 * each sample point along its outward normal, then smoothing through the points.
 *
 * This replaces the old SVG `feDisplacementMap` "pencil" filter, which silently
 * stops painting past a browser-imposed region (~800px) — so on tall boxes the
 * lower border vanished and content appeared to spill outside. Geometry has no
 * such cap and renders identically at any height.
 */
function roughRoundRectPath(w: number, h: number, radius: number, amp: number, step: number, seed: number): string {
  const inset = 1.6; // keep the stroke off the edge so it isn't clipped
  const right = w - inset;
  const bottom = h - inset;
  const corner = Math.max(0, Math.min(radius, (right - inset) / 2, (bottom - inset) / 2));
  const rnd = seededRng(seed);
  const pts: [number, number][] = [];

  const push = (x: number, y: number, nx: number, ny: number) => {
    const jitter = (rnd() - 0.5) * 2 * amp;
    pts.push([x + nx * jitter, y + ny * jitter]);
  };
  const edge = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const segments = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let i = 0; i <= segments; i++) {
      const progress = i / segments;
      push(x0 + (x1 - x0) * progress, y0 + (y1 - y0) * progress, nx, ny);
    }
  };
  const arc = (cx: number, cy: number, from: number, to: number) => {
    const segments = Math.max(2, Math.round((Math.abs(to - from) * corner) / step));
    for (let i = 0; i <= segments; i++) {
      const angle = from + (to - from) * (i / segments);
      const nx = Math.cos(angle);
      const ny = Math.sin(angle);
      push(cx + nx * corner, cy + ny * corner, nx, ny);
    }
  };

  // clockwise from the top edge
  edge(inset + corner, inset, right - corner, inset, 0, -1);
  arc(right - corner, inset + corner, -Math.PI / 2, 0); // top-right
  edge(right, inset + corner, right, bottom - corner, 1, 0);
  arc(right - corner, bottom - corner, 0, Math.PI / 2); // bottom-right
  edge(right - corner, bottom, inset + corner, bottom, 0, 1);
  arc(inset + corner, bottom - corner, Math.PI / 2, Math.PI); // bottom-left
  edge(inset, bottom - corner, inset, inset + corner, -1, 0);
  arc(inset + corner, inset + corner, Math.PI, Math.PI * 1.5); // top-left

  if (pts.length < 2) return "";
  const mid = (start: [number, number], end: [number, number]) => [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
  const first = mid(pts[pts.length - 1], pts[0]);
  let path = `M ${first[0].toFixed(1)} ${first[1].toFixed(1)} `;
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const next = mid(cur, pts[(i + 1) % pts.length]);
    path += `Q ${cur[0].toFixed(1)} ${cur[1].toFixed(1)} ${next[0].toFixed(1)} ${next[1].toFixed(1)} `;
  }
  return `${path}Z`;
}

type Tone = "paper" | "sunken" | "amber" | "ink" | "none";

const TONES: Record<Tone, { bg: string; stroke: string; sw: number; op: number }> = {
  paper: { bg: "var(--paper-2)", stroke: "var(--ink)", sw: 2, op: 0.92 },
  sunken: { bg: "var(--paper-3)", stroke: "var(--ink-2)", sw: 1.6, op: 0.7 },
  amber: { bg: "var(--amber-wash)", stroke: "var(--amber-deep)", sw: 2, op: 0.95 },
  ink: { bg: "var(--ink)", stroke: "var(--ink)", sw: 2, op: 1 },
  none: { bg: "transparent", stroke: "var(--ink)", sw: 2, op: 0.9 },
};

export interface SketchBoxProps {
  tone?: Tone;
  radius?: number;
  pad?: string | number;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  children?: ReactNode;
  [key: string]: unknown;
}

/** A container drawn with a wobbly, hand-sketched border (geometric, not filtered). */
export function SketchBox({
  tone = "paper",
  radius = 14,
  pad,
  className = "",
  style = {},
  as,
  children,
  ...rest
}: SketchBoxProps) {
  const ref = useRef<HTMLElement>(null);
  const { w, h } = useSize(ref);
  const Tag = (as ?? "div") as ElementType;
  const toneStyle = TONES[tone] ?? TONES.paper;

  const [pathA, pathB] = useMemo(() => {
    if (w <= 0 || h <= 0) return ["", ""];
    return [
      roughRoundRectPath(w, h, radius, 1.5, 17, 7),
      roughRoundRectPath(w, h, radius + 1.5, 1.1, 23, 23),
    ];
  }, [w, h, radius]);

  return (
    <Tag
      ref={ref}
      className={`sketchbox ${className}`.trim()}
      style={{ position: "relative", background: toneStyle.bg, borderRadius: radius, padding: pad, ...style }}
      {...rest}
    >
      {w > 0 && (
        <svg
          width={w}
          height={h}
          viewBox={`0 0 ${w} ${h}`}
          aria-hidden="true"
          style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible", zIndex: 0 }}
        >
          <path
            d={pathB}
            fill="none"
            stroke={toneStyle.stroke}
            strokeWidth={toneStyle.sw * 0.7}
            strokeOpacity={toneStyle.op * 0.35}
            strokeLinejoin="round"
            transform="translate(1.2,1.6)"
          />
          <path
            d={pathA}
            fill="none"
            stroke={toneStyle.stroke}
            strokeWidth={toneStyle.sw}
            strokeOpacity={toneStyle.op}
            strokeLinejoin="round"
          />
        </svg>
      )}
      <div style={{ position: "relative", zIndex: 1, height: "100%" }}>{children}</div>
    </Tag>
  );
}

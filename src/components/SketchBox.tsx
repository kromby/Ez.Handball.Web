import {
  useLayoutEffect,
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
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    // jsdom (tests) has no ResizeObserver — bail gracefully; w stays 0 and the SVG is skipped.
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function roundRectPath(w: number, h: number, r: number): string {
  r = Math.min(r, w / 2, h / 2);
  return `M ${r} 1 H ${w - r} Q ${w - 1} 1 ${w - 1} ${r} V ${h - r} Q ${w - 1} ${h - 1} ${w - r} ${h - 1} H ${r} Q 1 ${h - 1} 1 ${h - r} V ${r} Q 1 1 ${r} 1 Z`;
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

/** A container drawn with a wobbly, hand-sketched border (real SVG pencil filter). */
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
  const t = TONES[tone] ?? TONES.paper;

  return (
    <Tag
      ref={ref}
      className={`sketchbox ${className}`.trim()}
      style={{ position: "relative", background: t.bg, borderRadius: radius, padding: pad, ...style }}
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
            d={roundRectPath(w, h, radius)}
            fill="none"
            stroke={t.stroke}
            strokeWidth={t.sw}
            strokeOpacity={t.op}
            filter="url(#pencil)"
            strokeLinejoin="round"
          />
          <path
            d={roundRectPath(w, h, radius + 1.5)}
            fill="none"
            stroke={t.stroke}
            strokeWidth={t.sw * 0.7}
            strokeOpacity={t.op * 0.35}
            filter="url(#pencil2)"
            strokeLinejoin="round"
            transform="translate(1.2,1.6)"
          />
        </svg>
      )}
      <div style={{ position: "relative", zIndex: 1, height: "100%" }}>{children}</div>
    </Tag>
  );
}

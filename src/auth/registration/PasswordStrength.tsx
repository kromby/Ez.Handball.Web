import { useMemo } from "react";

const LABELS = ["", "tooth & nail", "getting there", "iron grip"];
const COLORS = ["var(--line-2)", "var(--bad)", "var(--amber)", "var(--good)"];

/** Three pencil ticks rating password strength, with a handwritten label. */
export function PasswordStrength({ value }: { value: string }) {
  const score = useMemo(() => {
    let s = 0;
    if (value.length >= 8) s += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) s += 1;
    if (/[0-9!@#$%^&*]/.test(value)) s += 1;
    return value.length === 0 ? 0 : Math.max(1, s);
  }, [value]);

  return (
    <div className="reg-pwstrength" style={{ opacity: value ? 1 : 0.55 }}>
      <div className="reg-pwstrength-bars">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className="reg-pwstrength-bar"
            style={bar <= score ? { background: COLORS[score] } : undefined}
          />
        ))}
      </div>
      <span className="scribble reg-pwstrength-label" style={{ color: COLORS[score] }}>
        {LABELS[score]}
      </span>
    </div>
  );
}

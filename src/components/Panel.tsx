import { SketchBox, type SketchBoxProps } from "./SketchBox";

/** A standard content panel: a hand-drawn paper card with consistent radius and padding. */
export function Panel({ className = "", children, ...rest }: SketchBoxProps) {
  return (
    <SketchBox tone="paper" radius={16} pad="clamp(18px, 3vw, 28px)" className={`panel ${className}`.trim()} {...rest}>
      {children}
    </SketchBox>
  );
}

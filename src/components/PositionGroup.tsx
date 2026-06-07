import type { ReactNode } from "react";

export function PositionGroup({
  label,
  owned,
  limit,
  children,
}: {
  label: string;
  owned: number;
  limit: number;
  children: ReactNode;
}) {
  return (
    <section className="position-group">
      <header className="position-group-head">
        <span className="position-group-label">{label}</span>
        <span className="position-group-count">{owned} / {limit}</span>
      </header>
      <ul className="position-group-list">{children}</ul>
    </section>
  );
}

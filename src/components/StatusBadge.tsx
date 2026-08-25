export function StatusBadge({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span className={`status-badge ${on ? "status-badge--on" : "status-badge--off"}`}>
      {on ? onLabel : offLabel}
    </span>
  );
}

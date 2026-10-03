import { formatMoney } from "../../api/money";

/** One labelled stat cell in the panel's stat row. */
export function StatCell({
  label,
  value,
  valueClassName,
  testId,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  testId?: string;
}) {
  return (
    <div className="panel-stat">
      <div data-testid={testId} className={`panel-stat-v ${valueClassName ?? ""}`.trim()}>
        {value}
      </div>
      <div className="poslabel">{label}</div>
    </div>
  );
}

/** "▲ 1M ISK" / "▼ 1M ISK" for a price drift (current price minus price paid). */
export const driftValue = (amount: number, currency: string): string =>
  `${amount >= 0 ? "▲" : "▼"} ${formatMoney({ amount: Math.abs(amount), currency })}`;

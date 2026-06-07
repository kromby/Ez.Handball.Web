import { useTranslation } from "react-i18next";
import { formatMoney } from "../api/money";
import type { Money } from "../api/types";

/**
 * Budget figures are independent (an FPL sell-on fee can make remaining + used ≠ cap),
 * so we never derive one from another. The bar shows squad value against total worth
 * (value + remaining), NOT against the starting cap.
 */
export function BudgetMeter({
  remaining,
  used,
  value,
  size,
  maxSize,
}: {
  remaining: Money;
  used: Money;
  value: Money;
  size: number;
  maxSize: number;
}) {
  const { t } = useTranslation();
  const totalWorth = value.amount + remaining.amount;
  const pct = totalWorth > 0 ? Math.round((value.amount / totalWorth) * 100) : 0;

  return (
    <div className="budget-meter">
      <div className="budget-bar" aria-hidden="true">
        <div className="budget-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <dl className="budget-chips">
        <div><dt>{t("squad.remaining")}</dt><dd>{formatMoney(remaining)}</dd></div>
        <div><dt>{t("squad.budgetUsed")}</dt><dd>{formatMoney(used)}</dd></div>
        <div><dt>{t("squad.squadValue")}</dt><dd>{formatMoney(value)}</dd></div>
        <div><dt>{t("squad.size")}</dt><dd>{size} / {maxSize}</dd></div>
      </dl>
    </div>
  );
}

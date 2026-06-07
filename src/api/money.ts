import type { Money } from "./types";

/** Trim a trailing `.0` from a fixed(1) number: 8.5 → "8.5", 12.0 → "12". */
function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

/** Compact ISK-style money: "100M ISK", "8.5M ISK", "750K ISK", "0 ISK", or "—" for null. */
export function formatMoney(money: Money | null | undefined): string {
  if (!money) return "—";
  const { amount, currency } = money;
  if (amount >= 1_000_000) return `${trim(amount / 1_000_000)}M ${currency}`;
  if (amount >= 1_000) return `${trim(amount / 1_000)}K ${currency}`;
  return `${amount} ${currency}`;
}

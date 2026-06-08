import { expect, test } from "vitest";
import { formatMoney } from "./money";

test("formats millions with a trimmed decimal", () => {
  expect(formatMoney({ amount: 100_000_000, currency: "ISK" })).toBe("100M ISK");
  expect(formatMoney({ amount: 8_500_000, currency: "ISK" })).toBe("8.5M ISK");
  expect(formatMoney({ amount: 12_000_000, currency: "ISK" })).toBe("12M ISK");
});

test("formats thousands and small amounts", () => {
  expect(formatMoney({ amount: 750_000, currency: "ISK" })).toBe("750K ISK");
  expect(formatMoney({ amount: 0, currency: "ISK" })).toBe("0 ISK");
});

test("returns an em dash for null", () => {
  expect(formatMoney(null)).toBe("—");
});

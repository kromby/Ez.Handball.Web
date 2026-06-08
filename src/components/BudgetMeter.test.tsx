import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { I18nextProvider } from "react-i18next";
import { i18n } from "../i18n";
import { BudgetMeter } from "./BudgetMeter";

test("shows remaining, used, value and size", () => {
  render(
    <I18nextProvider i18n={i18n}>
      <BudgetMeter
        remaining={{ amount: 42_000_000, currency: "ISK" }}
        used={{ amount: 58_000_000, currency: "ISK" }}
        value={{ amount: 61_000_000, currency: "ISK" }}
        size={7}
        maxSize={15}
      />
    </I18nextProvider>,
  );
  expect(screen.getByText(/42M ISK/)).toBeInTheDocument();
  expect(screen.getByText(/7\s*\/\s*15/)).toBeInTheDocument();
});

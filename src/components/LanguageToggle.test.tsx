import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { i18n } from "../i18n";
import { LanguageToggle } from "./LanguageToggle";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => { i18n.changeLanguage("en"); vi.restoreAllMocks(); });

describe("LanguageToggle", () => {
  test("marks the active language pressed", () => {
    renderWithProviders(<LanguageToggle />);
    expect(screen.getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "IS" })).toHaveAttribute("aria-pressed", "false");
  });

  test("clicking a language switches the active language", async () => {
    renderWithProviders(<LanguageToggle />);
    await userEvent.click(screen.getByRole("button", { name: "IS" }));
    expect(i18n.language).toBe("is");
  });
});

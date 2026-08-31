import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { AdminNav } from "./AdminNav";
import { renderWithProviders } from "../test/renderWithQuery";

test("links to both admin pages", () => {
  renderWithProviders(<AdminNav />);
  expect(screen.getByRole("link", { name: "Tournament status" })).toHaveAttribute("href", "/admin/tournaments");
  expect(screen.getByRole("link", { name: "Games" })).toHaveAttribute("href", "/admin/games");
});

test("marks the current page's link active", () => {
  renderWithProviders(<AdminNav />, { initialEntries: ["/admin/games"] });
  expect(screen.getByRole("link", { name: "Games" })).toHaveClass("is-active");
  expect(screen.getByRole("link", { name: "Tournament status" })).not.toHaveClass("is-active");
});

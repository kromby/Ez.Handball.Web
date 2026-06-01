import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import App from "./App";
import { renderWithProviders } from "./test/renderWithQuery";

test("renders the nav banner and leaderboard at /", () => {
  renderWithProviders(<App />, ["/"]);
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Leaderboard" })).toBeInTheDocument();
});

test("legacy ?playerId redirects to the player route", () => {
  renderWithProviders(<App />, ["/?playerId=42"]);
  // Redirected to /players/42 — PlayerPage shows Loading while fetching
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

test("renders the match page at /matches/:id", () => {
  renderWithProviders(<App />, ["/matches/99"]);
  expect(screen.getByRole("heading", { name: "Match" })).toBeInTheDocument();
});

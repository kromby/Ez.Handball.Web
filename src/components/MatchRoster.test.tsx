import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { MatchPlayerLine } from "../api/types";
import { MatchRoster } from "./MatchRoster";
import { renderWithProviders } from "../test/renderWithQuery";

const line = (over: Partial<MatchPlayerLine>): MatchPlayerLine => ({
  playerId: "p1",
  name: "Ólafur",
  jerseyNumber: "7",
  position: "CB",
  goals: 7,
  yellowCards: 0,
  twoMinuteSuspensions: 1,
  redCards: 0,
  ...over,
});

test("renders a row per player, linking names to player pages", () => {
  renderWithProviders(<MatchRoster title="Valur" players={[line({})]} />);
  expect(screen.getByText("Valur")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Ólafur/ })).toHaveAttribute("href", "/players/p1");
});

test("falls back to a placeholder when a player name is null", () => {
  renderWithProviders(<MatchRoster title="Valur" players={[line({ name: null })]} />);
  expect(screen.getByText("Unknown player")).toBeInTheDocument();
});

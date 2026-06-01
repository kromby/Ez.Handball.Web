import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { MatchList, type MatchSummary } from "./MatchList";
import { renderWithProviders } from "../test/renderWithQuery";

const summary = (over: Partial<MatchSummary>): MatchSummary => ({
  matchId: "m1",
  season: "2025-26",
  tournamentName: "Olís deild karla",
  context: "Valur · 7 goals",
  ...over,
});

test("renders a row per match linking to the match page", () => {
  renderWithProviders(<MatchList matches={[summary({}), summary({ matchId: "m2" })]} />);
  const links = screen.getAllByRole("link");
  expect(links[0]).toHaveAttribute("href", "/matches/m1");
  expect(links[1]).toHaveAttribute("href", "/matches/m2");
});

test("shows the context column the caller supplies", () => {
  renderWithProviders(<MatchList matches={[summary({ context: "Valur · 9 goals" })]} />);
  expect(screen.getByText("Valur · 9 goals")).toBeInTheDocument();
});

test("renders an empty message when there are no matches", () => {
  renderWithProviders(<MatchList matches={[]} />);
  expect(screen.getByText(/no matches/i)).toBeInTheDocument();
});

import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { LeaderboardEntry } from "../api/types";
import { LeaderboardTable } from "./LeaderboardTable";
import { renderWithProviders } from "../test/renderWithQuery";

const entry = (over: Partial<LeaderboardEntry>): LeaderboardEntry => ({
  rank: 1,
  playerId: "p1",
  name: "Ólafur Stefánsson",
  clubId: "c1",
  clubName: "Valur",
  gender: "karlar",
  games: 23,
  goals: 142,
  yellowCards: 3,
  twoMinuteSuspensions: 5,
  redCards: 0,
  avgGoals: 6.17,
  ...over,
});

test("renders a row per entry with rank, name, and metric value", () => {
  renderWithProviders(
    <LeaderboardTable entries={[entry({}), entry({ rank: 2, playerId: "p2", name: "Gunnar", goals: 131 })]} metric="goals" />,
  );
  expect(screen.getByText("Ólafur Stefánsson")).toBeInTheDocument();
  expect(screen.getByText("142")).toBeInTheDocument();
  expect(screen.getByText("131")).toBeInTheDocument();
});

test("each row links to the player page", () => {
  renderWithProviders(<LeaderboardTable entries={[entry({})]} metric="goals" />);
  expect(screen.getByRole("link", { name: /Ólafur Stefánsson/ })).toHaveAttribute("href", "/players/p1");
});

test("top-3 ranks get a medal class", () => {
  renderWithProviders(<LeaderboardTable entries={[entry({ rank: 1 })]} metric="goals" />);
  expect(document.querySelector(".rank-medal")).toBeInTheDocument();
});

test("falls back to a placeholder when name is null", () => {
  renderWithProviders(<LeaderboardTable entries={[entry({ name: null })]} metric="goals" />);
  expect(screen.getByText("Unknown player")).toBeInTheDocument();
});

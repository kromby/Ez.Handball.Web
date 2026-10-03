import { screen, within } from "@testing-library/react";
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
  hbStatzAssists: null,
  hbStatzSteals: null,
  hbStatzBlocks: null,
  hbStatzSaves: null,
  points: null,
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

test("shows HBStatz columns and the player's points for the game", () => {
  renderWithProviders(
    <MatchRoster
      title="Valur"
      players={[line({ hbStatzAssists: 2, hbStatzSteals: 1, hbStatzBlocks: 3, hbStatzSaves: 0, points: 14 })]}
    />,
  );
  const cells = within(screen.getByRole("row", { name: /Ólafur/ })).getAllByRole("cell");
  // #, name, goals, yellow, 2min, red, assists, steals, blocks, saves, points
  expect(cells.slice(6).map((c) => c.textContent)).toEqual(["2", "1", "3", "0", "14"]);
});

test("shows a dash for HBStatz values that are not reported yet, and half points with a decimal", () => {
  renderWithProviders(<MatchRoster title="Valur" players={[line({ points: 10.5 })]} />);
  const cells = within(screen.getByRole("row", { name: /Ólafur/ })).getAllByRole("cell");
  expect(cells.slice(6).map((c) => c.textContent)).toEqual(["—", "—", "—", "—", "10.5"]);
});

test("shows the club crest next to the title when a logo is given", () => {
  renderWithProviders(<MatchRoster title="Valur" logoUrl="https://logo/valur.png" players={[]} />);
  expect(document.querySelector("img.club-logo-sm")).toHaveAttribute("src", "https://logo/valur.png");
});

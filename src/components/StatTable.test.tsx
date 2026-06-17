import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import type { PlayerHistoryEntry, PlayerHistoryTotals } from "../api/types";
import { StatTable } from "./StatTable";

const entry: PlayerHistoryEntry = {
  season: "2025-26",
  tournamentId: "t1",
  tournamentName: "Olís deild karla",
  clubId: "c1",
  clubName: "Valur",
  games: 23,
  totalGoals: 142,
  totalYellowCards: 3,
  totalTwoMinuteSuspensions: 5,
  totalRedCards: 0,
  avgGoals: 6.17,
  avgYellowCards: 0.13,
  avgTwoMinuteSuspensions: 0.22,
  avgRedCards: 0,
};

const totals: PlayerHistoryTotals = {
  games: 23,
  totalGoals: 142,
  totalYellowCards: 3,
  totalTwoMinuteSuspensions: 5,
  totalRedCards: 0,
  avgGoals: 6.17,
  avgYellowCards: 0.13,
  avgTwoMinuteSuspensions: 0.22,
  avgRedCards: 0,
};

test("renders one row per history entry plus a totals row", () => {
  render(
    <MemoryRouter>
      <StatTable entries={[entry]} totals={totals} />
    </MemoryRouter>,
  );
  expect(screen.getByText("Olís deild karla")).toBeInTheDocument();
  expect(screen.getByText("Total")).toBeInTheDocument();
  expect(screen.getAllByText("6.17")[0]).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Valur" })).toHaveAttribute("href", "/clubs/c1");
});

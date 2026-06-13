import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { RoundMatch } from "../../api/types";
import { renderWithProviders } from "../../test/renderWithQuery";
import { FixtureRow } from "./FixtureRow";
import { GameweekStatusPill } from "./GameweekStatusPill";

function team(name: string, score: number | null) {
  return { teamId: name, clubId: name, name, logoSrc: null, score };
}

const played: RoundMatch = {
  matchId: "m1",
  played: true,
  date: "2026-06-20T16:00:00Z",
  venue: null,
  home: team("Valur", 28),
  away: team("Afturelding", 24),
};

const upcoming: RoundMatch = {
  matchId: "m2",
  played: false,
  date: "2026-06-20T16:00:00Z",
  venue: null,
  home: team("Haukar", null),
  away: team("FH", null),
};

test("status pill renders the mapped label", () => {
  renderWithProviders(<GameweekStatusPill labelKey="open" />);
  expect(screen.getByText("Open")).toBeInTheDocument();
});

test("played fixture shows both names and the score", () => {
  renderWithProviders(<FixtureRow match={played} />);
  expect(screen.getByText("Valur")).toBeInTheDocument();
  expect(screen.getByText("Afturelding")).toBeInTheDocument();
  expect(screen.getByText("28–24")).toBeInTheDocument();
});

test("upcoming fixture shows the kickoff time, no score", () => {
  renderWithProviders(<FixtureRow match={upcoming} />);
  expect(screen.getByText("Haukar")).toBeInTheDocument();
  expect(screen.queryByText(/–/)).not.toBeInTheDocument();
});

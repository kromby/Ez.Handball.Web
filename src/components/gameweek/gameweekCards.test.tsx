import { fireEvent, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { Gameweek, RoundGroup } from "../../api/types";
import { renderWithProviders } from "../../test/renderWithQuery";
import { GameweekHeroCard } from "./GameweekHeroCard";
import { GameweekListRow } from "./GameweekListRow";

function gw(number: number, status: Gameweek["status"]): Gameweek {
  return {
    number, roundLabel: String(number), tournamentId: "8444",
    deadline: "2099-06-20T18:00:00Z", status, matches: [],
  };
}

const round: RoundGroup = {
  round: "18",
  startDate: "2026-06-20",
  endDate: "2026-06-21",
  matches: [
    {
      matchId: "m1", played: false, date: "2026-06-20T16:00:00Z", venue: null,
      home: { teamId: "h", clubId: "h", name: "Valur", logoSrc: null, score: null },
      away: { teamId: "a", clubId: "a", name: "Haukar", logoSrc: null, score: null },
    },
  ],
};

test("hero shows title, OPEN pill, countdown and fixtures", () => {
  renderWithProviders(<GameweekHeroCard gameweek={gw(18, "Open")} current={gw(18, "Open")} round={round} />);
  expect(screen.getByText("Gameweek 18")).toBeInTheDocument();
  expect(screen.getByText("Open")).toBeInTheDocument();
  expect(screen.getByText("Valur")).toBeInTheDocument();
  expect(screen.getByText(/Locks in/)).toBeInTheDocument();
});

test("list row is collapsed, then expands fixtures on click", () => {
  renderWithProviders(
    <GameweekListRow gameweek={gw(19, "Open")} current={gw(18, "Open")} round={round} />,
  );
  expect(screen.getByText("Upcoming")).toBeInTheDocument();
  expect(screen.queryByText("Valur")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByText("Valur")).toBeInTheDocument();
});

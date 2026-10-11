import { screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import type { ManagerStanding } from "../api/types";
import { renderWithProviders } from "../test/renderWithQuery";
import { LeagueRoundPointsChart } from "./LeagueRoundPointsChart";

function standing(teamName: string, rounds: ManagerStanding["rounds"]): ManagerStanding {
  return {
    rank: 1, previousRank: null, rankDelta: null, teamId: `${teamName}:fantasy`, teamName, color: "#123456",
    totalPoints: 0, roundPoints: 0, roundsPlayed: rounds.length, averagePoints: 0, roundsWon: 0, wonLatestRound: false,
    rounds,
  };
}

function chart() {
  return within(screen.getByRole("img", { name: "Points scored in each round, per team" }) as unknown as HTMLElement);
}

test("draws a bar per team per round with the points scored that round, not the running total", () => {
  renderWithProviders(
    <LeagueRoundPointsChart
      entries={[
        standing("Alpha", [{ roundLabel: "1", points: 30, totalPoints: 30 }, { roundLabel: "2", points: 40, totalPoints: 70 }]),
        standing("Bravo", [{ roundLabel: "1", points: 12, totalPoints: 12 }, { roundLabel: "2", points: 0, totalPoints: 12 }]),
      ]}
      myTeamId="Alpha:fantasy"
    />,
  );
  expect(chart().getByText("Alpha · Round 2: 40")).toBeInTheDocument();
  expect(chart().getByText("Bravo · Round 1: 12")).toBeInTheDocument();
  // A zero is a real score and still gets a bar.
  expect(chart().getByText("Bravo · Round 2: 0")).toBeInTheDocument();
  expect(within(screen.getByRole("list")).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Alpha", "Bravo"]);
});

test("leaves out the bar for a round a team has no score in", () => {
  renderWithProviders(
    <LeagueRoundPointsChart
      entries={[
        standing("Alpha", [{ roundLabel: "1", points: 30, totalPoints: 30 }, { roundLabel: "2", points: 40, totalPoints: 70 }]),
        standing("Bravo", [{ roundLabel: "2", points: 20, totalPoints: 20 }]),
      ]}
      myTeamId={undefined}
    />,
  );
  expect(chart().getByText("Bravo · Round 2: 20")).toBeInTheDocument();
  expect(chart().queryByText(/^Bravo · Round 1/)).not.toBeInTheDocument();
});

test("extends the axis below zero for a negative round", () => {
  renderWithProviders(
    <LeagueRoundPointsChart
      entries={[standing("Alpha", [{ roundLabel: "1", points: -5, totalPoints: -5 }, { roundLabel: "2", points: 25, totalPoints: 20 }])]}
      myTeamId={undefined}
    />,
  );
  expect(chart().getByText("Alpha · Round 1: -5")).toBeInTheDocument();
  expect(chart().getByText("-10")).toBeInTheDocument();
});

test("renders nothing before any round is settled", () => {
  renderWithProviders(<LeagueRoundPointsChart entries={[standing("Alpha", [])]} myTeamId={undefined} />);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

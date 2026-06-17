import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import type { MatchTeam } from "../api/types";
import { ScoreLine } from "./ScoreLine";

const team = (name: string, fh: number, sh: number, final: number): MatchTeam => ({
  teamId: name,
  clubId: name,
  clubName: name,
  score: { firstHalf: fh, secondHalf: sh, final },
  players: [],
});

function renderScore(home: MatchTeam, away: MatchTeam) {
  return render(
    <MemoryRouter>
      <ScoreLine home={home} away={away} />
    </MemoryRouter>,
  );
}

test("renders both clubs as links and their final scores", () => {
  renderScore(team("Valur", 14, 13, 27), team("Haukar", 12, 13, 25));
  expect(screen.getByRole("link", { name: "Valur" })).toHaveAttribute("href", "/clubs/Valur");
  expect(screen.getByRole("link", { name: "Haukar" })).toHaveAttribute("href", "/clubs/Haukar");
  expect(screen.getByText("27")).toBeInTheDocument();
  expect(screen.getByText("25")).toBeInTheDocument();
});

test("shows the half-time line when the first half was not 0–0", () => {
  renderScore(team("Valur", 14, 13, 27), team("Haukar", 12, 13, 25));
  expect(screen.getByText("Half-time 14–12")).toBeInTheDocument();
});

test("hides the half-time line when the first half was 0–0", () => {
  renderScore(team("Valur", 0, 27, 27), team("Haukar", 0, 25, 25));
  expect(screen.queryByText(/half-time/i)).not.toBeInTheDocument();
});

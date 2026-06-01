import { render, screen } from "@testing-library/react";
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

test("renders both final scores", () => {
  render(<ScoreLine home={team("Valur", 14, 13, 27)} away={team("Haukar", 12, 13, 25)} />);
  expect(screen.getByText("27")).toBeInTheDocument();
  expect(screen.getByText("25")).toBeInTheDocument();
});

test("shows the half-time line when the first half was not 0–0", () => {
  render(<ScoreLine home={team("Valur", 14, 13, 27)} away={team("Haukar", 12, 13, 25)} />);
  expect(screen.getByText("Half-time 14–12")).toBeInTheDocument();
});

test("hides the half-time line when the first half was 0–0", () => {
  render(<ScoreLine home={team("Valur", 0, 27, 27)} away={team("Haukar", 0, 25, 25)} />);
  expect(screen.queryByText(/half-time/i)).not.toBeInTheDocument();
});

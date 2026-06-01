import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { MatchTeam } from "../api/types";
import { LineScoreTable } from "./LineScoreTable";

const team = (name: string, fh: number, sh: number, final: number): MatchTeam => ({
  teamId: name,
  clubId: name,
  clubName: name,
  score: { firstHalf: fh, secondHalf: sh, final },
  players: [],
});

test("renders both teams with half and final scores", () => {
  render(<LineScoreTable home={team("Valur", 14, 13, 27)} away={team("Haukar", 12, 13, 25)} />);
  expect(screen.getByText("Valur")).toBeInTheDocument();
  expect(screen.getByText("Haukar")).toBeInTheDocument();
  expect(screen.getByText("27")).toBeInTheDocument();
  expect(screen.getByText("25")).toBeInTheDocument();
});

import { fireEvent, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { MyGameweekScore } from "../../api/types";
import { renderWithProviders } from "../../test/renderWithQuery";
import { GameweekScoreRow } from "./GameweekScoreRow";
import { PlayerScoreLine } from "./PlayerScoreLine";

test("renders a captain line with multiplier badge and final points", () => {
  renderWithProviders(
    <PlayerScoreLine
      name="Aron Pálmarsson"
      position="GK"
      rawPoints={9}
      points={18}
      played
      autoSubbedIn={false}
      captainApplied
      multiplier={2}
    />,
  );
  expect(screen.getByText("Aron Pálmarsson")).toBeInTheDocument();
  expect(screen.getByText("C ×2")).toBeInTheDocument();
  expect(screen.getByText("18")).toBeInTheDocument();
});

test("renders an auto-sub badge", () => {
  renderWithProviders(
    <PlayerScoreLine
      name="Gísli Kristjánsson"
      position="CB"
      rawPoints={8}
      points={8}
      played
      autoSubbedIn
      captainApplied={false}
      multiplier={1}
    />,
  );
  expect(screen.getByText("↑ sub")).toBeInTheDocument();
});

test("renders a DNP starter dimmed with zero points", () => {
  renderWithProviders(
    <PlayerScoreLine
      name="Bjarki Már Elísson"
      position="RB"
      rawPoints={0}
      points={0}
      played={false}
      autoSubbedIn={false}
      captainApplied={false}
      multiplier={1}
    />,
  );
  expect(screen.getByText("DNP")).toBeInTheDocument();
  expect(screen.getByText("Bjarki Már Elísson").closest(".gwsc-line")).toHaveClass("gwsc-line--dnp");
});

const sampleScore: MyGameweekScore = {
  roundLabel: "15. umferð",
  points: 58,
  captainPlayerId: "p1",
  breakdown: [
    { playerId: "p1", rawPoints: 9, points: 18, played: true, autoSubbedIn: false, captainApplied: true, multiplier: 2 },
    { playerId: "p2", rawPoints: 11, points: 11, played: true, autoSubbedIn: false, captainApplied: false, multiplier: 1 },
    { playerId: "p3", rawPoints: 0, points: 0, played: false, autoSubbedIn: false, captainApplied: false, multiplier: 1 },
    { playerId: "p4", rawPoints: 8, points: 8, played: true, autoSubbedIn: true, captainApplied: false, multiplier: 1 },
  ],
};

const nameOf = (id: string) =>
  ({
    p1: { name: "Aron", position: "GK" },
    p2: { name: "Ómar", position: "LW" },
    p4: { name: "Gísli", position: "CB" },
  })[id] ?? { name: "Unknown player", position: null };

test("row header shows GW number, round label and total points", () => {
  renderWithProviders(<GameweekScoreRow score={sampleScore} number={6} nameOf={nameOf} defaultOpen />);
  expect(screen.getByText("GW 6")).toBeInTheDocument();
  expect(screen.getByText("Umferð 15. umferð")).toBeInTheDocument();
  expect(screen.getByText("58")).toBeInTheDocument();
});

test("breakdown sorts by points desc with DNP last and resolves names", () => {
  renderWithProviders(<GameweekScoreRow score={sampleScore} number={6} nameOf={nameOf} defaultOpen />);
  const names = screen.getAllByTestId("gwsc-line-name").map((n) => n.textContent);
  // Aron 18 (captain), Ómar 11, Gísli 8 (sub), then DNP p3 (Unknown) last.
  expect(names[0]).toContain("Aron");
  expect(names[1]).toContain("Ómar");
  expect(names[2]).toContain("Gísli");
  expect(names[3]).toContain("Unknown player");
});

test("row is collapsible", () => {
  renderWithProviders(<GameweekScoreRow score={sampleScore} number={6} nameOf={nameOf} defaultOpen={false} />);
  expect(screen.queryByText("Aron")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button"));
  expect(screen.getByText("Aron")).toBeInTheDocument();
});

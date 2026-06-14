import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../../api/endpoints";
import type { MyGameweekScore, MyGameweeks, Squad } from "../../api/types";
import { renderWithProviders } from "../../test/renderWithQuery";
import { GameweekScoreRow } from "./GameweekScoreRow";
import { GameweekScores } from "./GameweekScores";
import { PlayerScoreLine } from "./PlayerScoreLine";

afterEach(() => vi.restoreAllMocks());

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

const squadFixture = {
  flavor: "fantasy",
  players: [
    { playerId: "p1", name: "Aron", clubId: null, clubName: null, position: "GK", gender: null, price: null, pricePaid: 0, rating: 0 },
    { playerId: "p2", name: "Ómar", clubId: null, clubName: null, position: "LW", gender: null, price: null, pricePaid: 0, rating: 0 },
  ],
  budgetUsed: 0,
  remainingBudget: 0,
  squadValue: 0,
} as unknown as Squad;

const twoGameweeks: MyGameweeks = {
  runningTotal: 105,
  gameweeks: [
    { roundLabel: "14. umferð", points: 47, captainPlayerId: "p1", breakdown: [
      { playerId: "p1", rawPoints: 5, points: 10, played: true, autoSubbedIn: false, captainApplied: true, multiplier: 2 },
    ] },
    { roundLabel: "15. umferð", points: 58, captainPlayerId: "p2", breakdown: [
      { playerId: "p2", rawPoints: 11, points: 11, played: true, autoSubbedIn: false, captainApplied: false, multiplier: 1 },
    ] },
  ],
};

test("shows running total, settled count and newest gameweek first", async () => {
  vi.spyOn(api, "getMyGameweeks").mockResolvedValue(twoGameweeks);
  renderWithProviders(<GameweekScores squad={squadFixture} />, { auth: { status: "authenticated" } });
  expect(await screen.findByText("105")).toBeInTheDocument();
  expect(screen.getByText("My gameweek scores")).toBeInTheDocument();
  expect(screen.getByText("2 gameweeks settled")).toBeInTheDocument();
  // Newest first: GW2 (15. umferð) renders before GW1 (14. umferð).
  const heads = screen.getAllByText(/^GW \d+$/).map((n) => n.textContent);
  expect(heads).toEqual(["GW 2", "GW 1"]);
});

test("resolves a player missing from the squad to the fallback label", async () => {
  vi.spyOn(api, "getMyGameweeks").mockResolvedValue({
    runningTotal: 10,
    gameweeks: [
      { roundLabel: "1. umferð", points: 10, captainPlayerId: null, breakdown: [
        { playerId: "sold", rawPoints: 10, points: 10, played: true, autoSubbedIn: false, captainApplied: false, multiplier: 1 },
      ] },
    ],
  });
  renderWithProviders(<GameweekScores squad={squadFixture} />, { auth: { status: "authenticated" } });
  expect(await screen.findByText("Unknown player")).toBeInTheDocument();
});

test("renders the empty note and no running total when nothing is settled", async () => {
  vi.spyOn(api, "getMyGameweeks").mockResolvedValue({ runningTotal: 0, gameweeks: [] });
  renderWithProviders(<GameweekScores squad={squadFixture} />, { auth: { status: "authenticated" } });
  expect(await screen.findByText("No gameweeks scored yet")).toBeInTheDocument();
  expect(screen.queryByText("Running total")).not.toBeInTheDocument();
});

test("renders nothing on error (section is supplementary)", async () => {
  vi.spyOn(api, "getMyGameweeks").mockRejectedValue(new Error("boom"));
  const { container } = renderWithProviders(<GameweekScores squad={squadFixture} />, { auth: { status: "authenticated" } });
  await waitFor(() => expect(api.getMyGameweeks).toHaveBeenCalled());
  expect(container.querySelector(".gwsc")).toBeNull();
});

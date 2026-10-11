import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import { ApiError } from "../api/client";
import type { AuthUser, MemberGameweek, MemberGameweeks, MiniLeague } from "../api/types";
import LeagueMemberPage from "./LeagueMemberPage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, isAdmin: false, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };

const league: MiniLeague = {
  id: "abc", name: "Office Olís", season: "2026-27", creatorUserId: "u1", memberCount: 2, role: "creator", createdAt: "2026-06-08T00:00:00Z",
  members: [
    { userId: "u1", role: "creator", joinedAt: "2026-06-08T00:00:00Z", teamId: "u1:fantasy", teamName: "Alpha", favoriteClubId: null },
    { userId: "u2", role: "member", joinedAt: "2026-06-08T00:00:00Z", teamId: "u2:fantasy", teamName: "Bravo", favoriteClubId: null },
  ],
};

const settledRound: MemberGameweek = {
  number: 1, roundLabel: "1", deadline: "2026-09-10T18:00:00Z", settled: true, points: 23, captainPlayerId: "p1",
  lineup: [
    { playerId: "p1", name: "Max Emil Stenlund", position: "RB", role: "Captain", benchOrder: null },
    { playerId: "p2", name: "Aron Pálmarsson", position: "CB", role: "Starter", benchOrder: null },
  ],
  breakdown: [
    { playerId: "p2", name: "Aron Pálmarsson", position: "CB", rawPoints: 0, points: 0, played: false, autoSubbedIn: false, captainApplied: false, multiplier: 1 },
    { playerId: "p1", name: "Max Emil Stenlund", position: "RB", rawPoints: 9, points: 18, played: true, autoSubbedIn: false, captainApplied: true, multiplier: 2 },
    { playerId: "p3", name: "Bench Hero", position: "LW", rawPoints: 5, points: 5, played: true, autoSubbedIn: true, captainApplied: false, multiplier: 1 },
  ],
};

const lockedRound: MemberGameweek = {
  number: 2, roundLabel: "2", deadline: "2026-09-17T18:00:00Z", settled: false, points: null, captainPlayerId: null,
  lineup: [
    { playerId: "p9", name: "Bench Second", position: "GK", role: "Bench", benchOrder: 1 },
    { playerId: "p1", name: "Max Emil Stenlund", position: "RB", role: "Starter", benchOrder: null },
    { playerId: "p2", name: "Aron Pálmarsson", position: "CB", role: "Vice", benchOrder: null },
    { playerId: "p8", name: "Bench First", position: "LP", role: "Bench", benchOrder: 0 },
  ],
  breakdown: [],
};

function gameweeks(rounds: MemberGameweek[], runningTotal = 23): MemberGameweeks {
  return { runningTotal, gameweeks: rounds };
}

beforeEach(() => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue(league);
});

function render(userId = "u2") {
  return renderWithProviders(
    <Routes><Route path="/leagues/:id/members/:userId" element={<LeagueMemberPage />} /></Routes>,
    { initialEntries: [`/leagues/abc/members/${userId}`], auth: authed },
  );
}

test("shows a loading state while the team loads", () => {
  const neverSettles = new Promise<never>(() => {
    // Deliberately never resolves, so the query stays pending.
  });
  vi.spyOn(api, "getLeagueMemberGameweeks").mockReturnValue(neverSettles);
  render();
  expect(screen.getByText("Loading…")).toBeInTheDocument();
});

test("shows not found when the API hides the team (404)", async () => {
  vi.spyOn(api, "getLeagueMemberGameweeks").mockRejectedValue(new ApiError(404, "not_found", "HTTP 404"));
  render();
  expect(await screen.findByText("Team not found in this league")).toBeInTheDocument();
});

test("shows an error for other failures", async () => {
  vi.spyOn(api, "getLeagueMemberGameweeks").mockRejectedValue(new ApiError(500, "boom", "HTTP 500"));
  render();
  expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
});

test("explains that nothing is shown until a round locks", async () => {
  vi.spyOn(api, "getLeagueMemberGameweeks").mockResolvedValue(gameweeks([], 0));
  render();
  expect(await screen.findByText("No rounds have locked yet.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Bravo" })).toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});

test("defaults to the newest locked round and shows its frozen lineup while awaiting results", async () => {
  vi.spyOn(api, "getLeagueMemberGameweeks").mockResolvedValue(gameweeks([settledRound, lockedRound]));
  render();
  expect(await screen.findByText(/awaiting results/i)).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Round" })).toHaveValue("2");
  expect(screen.getByText("23")).toBeInTheDocument(); // running total
  expect(screen.getByLabelText("Vice-captain")).toBeInTheDocument();
  const namesIn = (listName: string) =>
    within(screen.getByRole("list", { name: listName })).getAllByRole("listitem").map((item) => item.textContent);
  expect(namesIn("Starting lineup")).toEqual(["RBMax Emil Stenlund", "CBAron PálmarssonV"]);
  expect(namesIn("Bench")).toEqual(["LPBench First", "GKBench Second"]); // substitution order
});

test("switching to a settled round shows its points breakdown", async () => {
  vi.spyOn(api, "getLeagueMemberGameweeks").mockResolvedValue(gameweeks([settledRound, lockedRound]));
  render();
  await userEvent.selectOptions(await screen.findByRole("combobox", { name: "Round" }), "1");
  expect(screen.getByText("23 pts")).toBeInTheDocument();
  const lines = screen.getAllByTestId("gwsc-line-name").map((element) => element.firstChild?.textContent);
  expect(lines).toEqual(["Max Emil Stenlund", "Bench Hero", "Aron Pálmarsson"]); // played by points, DNP last
  expect(screen.getByLabelText("Captain, 2 times points")).toBeInTheDocument();
  expect(screen.getByLabelText("Auto-substituted in")).toBeInTheDocument();
  expect(screen.queryByText(/awaiting results/i)).not.toBeInTheDocument();
});

test("links back to the league and marks my own team", async () => {
  vi.spyOn(api, "getLeagueMemberGameweeks").mockResolvedValue(gameweeks([settledRound]));
  render("u1");
  expect(await screen.findByRole("heading", { name: "Alpha (you)" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "← Office Olís" })).toHaveAttribute("href", "/leagues/abc");
  expect(within(screen.getByRole("combobox", { name: "Round" })).getAllByRole("option")).toHaveLength(1);
});

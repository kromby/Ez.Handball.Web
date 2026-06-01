import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import LeaderboardPage from "./LeaderboardPage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

function leaderboard(entries = 1) {
  return {
    metric: "goals",
    total: entries,
    offset: 0,
    limit: 50,
    entries: Array.from({ length: entries }, (_, i) => ({
      rank: i + 1,
      playerId: `p${i}`,
      name: `Player ${i}`,
      clubId: "c",
      clubName: "Club",
      gender: "karlar",
      games: 10,
      goals: 100 - i,
      yellowCards: 0,
      twoMinuteSuspensions: 0,
      redCards: 0,
      avgGoals: 5,
    })),
  };
}

test("renders fetched entries", async () => {
  vi.spyOn(api, "getLeaderboard").mockResolvedValue(leaderboard(2));
  renderWithProviders(<LeaderboardPage />, ["/"]);
  await waitFor(() => expect(screen.getByText("Player 0")).toBeInTheDocument());
  expect(screen.getByText("Player 1")).toBeInTheDocument();
});

test("switching metric refetches with the new metric", async () => {
  const spy = vi.spyOn(api, "getLeaderboard").mockResolvedValue(leaderboard(1));
  renderWithProviders(<LeaderboardPage />, ["/"]);
  await waitFor(() => expect(screen.getByText("Player 0")).toBeInTheDocument());
  await userEvent.click(screen.getByRole("tab", { name: "Games" }));
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ metric: "games" })),
  );
});

test("shows an error view on failure", async () => {
  vi.spyOn(api, "getLeaderboard").mockRejectedValue(new Error("boom"));
  renderWithProviders(<LeaderboardPage />, ["/"]);
  await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument());
});

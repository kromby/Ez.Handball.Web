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

function stubFacets() {
  vi.spyOn(api, "getSeasons").mockResolvedValue([
    { label: "2025-26", isCurrent: true },
    { label: "2024-25", isCurrent: false },
  ]);
  vi.spyOn(api, "getTournaments").mockResolvedValue([
    { tournamentId: "8444", name: "Olís deild karla", gender: "karlar" },
  ]);
  vi.spyOn(api, "getGenders").mockResolvedValue([
    { value: "karlar", label: "Karlar" },
    { value: "kvenna", label: "Kvenna" },
  ]);
}

test("renders fetched entries", async () => {
  stubFacets();
  vi.spyOn(api, "getLeaderboard").mockResolvedValue(leaderboard(2));
  renderWithProviders(<LeaderboardPage />, { initialEntries: ["/"] });
  await waitFor(() => expect(screen.getByText("Player 0")).toBeInTheDocument());
  expect(screen.getByText("Player 1")).toBeInTheDocument();
});

test("switching metric refetches with the new metric", async () => {
  stubFacets();
  const spy = vi.spyOn(api, "getLeaderboard").mockResolvedValue(leaderboard(1));
  renderWithProviders(<LeaderboardPage />, { initialEntries: ["/"] });
  await waitFor(() => expect(screen.getByText("Player 0")).toBeInTheDocument());
  await userEvent.click(screen.getByRole("tab", { name: "Games" }));
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ metric: "games" })),
  );
});

test("shows an error view on failure", async () => {
  stubFacets();
  vi.spyOn(api, "getLeaderboard").mockRejectedValue(new Error("boom"));
  renderWithProviders(<LeaderboardPage />, { initialEntries: ["/"] });
  await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument());
});

test("pre-selects the current season and fetches it", async () => {
  stubFacets();
  const spy = vi.spyOn(api, "getLeaderboard").mockResolvedValue(leaderboard(1));
  renderWithProviders(<LeaderboardPage />, { initialEntries: ["/"] });
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ season: "2025-26" })),
  );
});

test("honors a season from the URL over the current default", async () => {
  stubFacets();
  const spy = vi.spyOn(api, "getLeaderboard").mockResolvedValue(leaderboard(1));
  renderWithProviders(<LeaderboardPage />, { initialEntries: ["/?season=2024-25"] });
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ season: "2024-25" })),
  );
});

test("changing season resets the tournament and refetches", async () => {
  stubFacets();
  const spy = vi.spyOn(api, "getLeaderboard").mockResolvedValue(leaderboard(1));
  renderWithProviders(<LeaderboardPage />, { initialEntries: ["/?tournamentId=8444"] });
  await waitFor(() => expect(screen.getByText("Player 0")).toBeInTheDocument());
  await userEvent.click(screen.getByRole("button", { name: "2024-25" }));
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ season: "2024-25", tournamentId: undefined }),
    ),
  );
});

test("selecting a gender filters the leaderboard", async () => {
  stubFacets();
  const spy = vi.spyOn(api, "getLeaderboard").mockResolvedValue(leaderboard(1));
  renderWithProviders(<LeaderboardPage />, { initialEntries: ["/"] });
  await waitFor(() => expect(screen.getByText("Player 0")).toBeInTheDocument());
  await userEvent.click(screen.getByRole("button", { name: "Kvenna" }));
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ gender: "kvenna" })),
  );
});

test("empty seasons still loads the leaderboard unfiltered", async () => {
  vi.spyOn(api, "getSeasons").mockResolvedValue([]);
  vi.spyOn(api, "getGenders").mockResolvedValue([]);
  vi.spyOn(api, "getTournaments").mockResolvedValue([]);
  const spy = vi.spyOn(api, "getLeaderboard").mockResolvedValue(leaderboard(1));
  renderWithProviders(<LeaderboardPage />, { initialEntries: ["/"] });
  await waitFor(() => expect(screen.getByText("Player 0")).toBeInTheDocument());
  expect(spy).toHaveBeenCalledWith(expect.objectContaining({ season: undefined }));
});

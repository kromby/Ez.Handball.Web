import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import PlayerPage from "./PlayerPage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

function setup() {
  return renderWithProviders(
    <Routes>
      <Route path="/players/:playerId" element={<PlayerPage />} />
    </Routes>,
    { initialEntries: ["/players/7"] },
  );
}

test("renders profile, history, and the player's match list", async () => {
  vi.spyOn(api, "getPlayer").mockResolvedValue({
    playerId: "7",
    name: "Ólafur Stefánsson",
    jerseyNumber: "7",
    dateOfBirth: "1973-07-03",
    age: 52,
    teamId: "tm",
    clubId: "c1",
    clubName: "Valur",
    gender: "karlar",
  });
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({
    playerId: "7",
    history: [
      {
        season: "2025-26",
        tournamentId: "t1",
        tournamentName: "Olís deild karla",
        clubId: "c1",
        clubName: "Valur",
        games: 2,
        totalGoals: 12,
        totalYellowCards: 0,
        totalTwoMinuteSuspensions: 1,
        totalRedCards: 0,
        avgGoals: 6,
        avgYellowCards: 0,
        avgTwoMinuteSuspensions: 0.5,
        avgRedCards: 0,
      },
    ],
    totals: null,
  });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({
    playerId: "7",
    stats: [
      {
        matchId: "m1",
        tournamentId: "t1",
        tournamentName: "Olís deild karla",
        season: "2025-26",
        teamId: "tm",
        clubName: "Valur",
        goals: 7,
        yellowCards: 0,
        twoMinuteSuspensions: 0,
        redCards: 0,
      },
    ],
  });

  setup();
  await waitFor(() => expect(screen.getByText("Ólafur Stefánsson")).toBeInTheDocument());
  expect(screen.getAllByText("Olís deild karla").length).toBeGreaterThan(0);
  expect(screen.getByRole("link", { name: "View" })).toHaveAttribute("href", "/matches/m1");
});

test("renders not-found when the player 404s", async () => {
  const { ApiError } = await import("../api/client");
  vi.spyOn(api, "getPlayer").mockRejectedValue(new ApiError(404, "player_not_found", "x"));
  vi.spyOn(api, "getPlayerHistory").mockRejectedValue(new ApiError(404, "player_not_found", "x"));
  vi.spyOn(api, "getPlayerStats").mockRejectedValue(new ApiError(404, "player_not_found", "x"));
  setup();
  await waitFor(() => expect(screen.getByText(/player not found/i)).toBeInTheDocument());
});

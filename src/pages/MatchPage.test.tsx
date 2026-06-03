import { screen, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import MatchPage from "./MatchPage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

function team(name: string) {
  return {
    teamId: name,
    clubId: name,
    clubName: name,
    score: { firstHalf: 14, secondHalf: 13, final: 27 },
    players: [
      {
        playerId: `${name}-p1`,
        name: `${name} Player`,
        jerseyNumber: "7",
        position: "CB",
        goals: 7,
        yellowCards: 0,
        twoMinuteSuspensions: 0,
        redCards: 0,
      },
    ],
  };
}

function setup() {
  return renderWithProviders(
    <Routes>
      <Route path="/matches/:matchId" element={<MatchPage />} />
    </Routes>,
    { initialEntries: ["/matches/m1"] },
  );
}

test("renders match metadata, line score, and both rosters", async () => {
  vi.spyOn(api, "getMatch").mockResolvedValue({
    matchId: "m1",
    tournamentId: "t1",
    tournamentName: "Olís deild karla",
    season: "2025-26",
    date: "2026-01-15T19:00:00+00:00",
    venue: "Vodafonehöllin",
    attendance: 1200,
    status: "final",
    homeTeam: team("Valur"),
    awayTeam: team("Haukar"),
  });
  setup();
  await waitFor(() => expect(screen.getByText(/Vodafonehöllin/)).toBeInTheDocument());
  expect(screen.getByText("Valur Player")).toBeInTheDocument();
  expect(screen.getByText("Haukar Player")).toBeInTheDocument();
  expect(screen.getAllByText("27").length).toBeGreaterThan(0);
});

test("renders not-found when the match 404s", async () => {
  const { ApiError } = await import("../api/client");
  vi.spyOn(api, "getMatch").mockRejectedValue(new ApiError(404, "match_not_found", "x"));
  setup();
  await waitFor(() => expect(screen.getByText(/match not found/i)).toBeInTheDocument());
});

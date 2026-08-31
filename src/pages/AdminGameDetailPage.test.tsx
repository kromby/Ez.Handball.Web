import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AdminTournamentGames, AuthUser } from "../api/types";
import AdminGameDetailPage from "./AdminGameDetailPage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

const admin: AuthUser = {
  id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385",
  emailVerified: true, isAdmin: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
};

const tournaments: AdminTournamentGames[] = [
  {
    tournamentId: "8444", name: "Olís deild karla", competitionName: "Olís deild karla",
    lastSyncedAt: "2026-06-01T12:00:00Z",
    rounds: [
      {
        round: "1",
        games: [
          {
            matchId: "103414", date: "2025-09-03T19:30:00Z", venue: "Ásgarður",
            homeTeamName: "Stjarnan", awayTeamName: "Breiðablik", status: "played", ingested: true, hbStatzIngested: false,
          },
        ],
      },
    ],
  },
];

function renderPage(path = "/admin/games/8444?season=2025-26") {
  return renderWithProviders(
    <Routes>
      <Route path="/admin/games" element={<div>games list</div>} />
      <Route path="/admin/games/:tournamentId" element={<AdminGameDetailPage />} />
    </Routes>,
    { initialEntries: [path], auth: { status: "authenticated", user: admin } },
  );
}

test("renders the matching tournament's rounds and games", async () => {
  vi.spyOn(api, "getAdminGameStatus").mockResolvedValue(tournaments);

  renderPage();

  expect(await screen.findByText("Round 1")).toBeInTheDocument();
  expect(screen.getByText("Stjarnan")).toBeInTheDocument();
  expect(screen.getByText("Breiðablik")).toBeInTheDocument();
  expect(api.getAdminGameStatus).toHaveBeenCalledWith("2025-26");
});

test("offers a sync button alongside the tournament's games", async () => {
  vi.spyOn(api, "getAdminGameStatus").mockResolvedValue(tournaments);

  renderPage();

  expect(await screen.findByRole("button", { name: "Sync now" })).toBeInTheDocument();
});

test("offers round- and game-level HBStatz sync actions", async () => {
  vi.spyOn(api, "getAdminGameStatus").mockResolvedValue(tournaments);

  renderPage();

  expect(await screen.findByRole("button", { name: "Sync round 1" })).toBeInTheDocument();
  // The per-game action only shows while that game's HBStatz badge is off.
  expect(screen.getByRole("button", { name: "Sync" })).toBeInTheDocument();
});

test("back link returns to the games list with the season preserved", async () => {
  vi.spyOn(api, "getAdminGameStatus").mockResolvedValue(tournaments);

  renderPage();

  const back = await screen.findByRole("link", { name: /back to tournaments/i });
  expect(back).toHaveAttribute("href", "/admin/games?season=2025-26");
});

test("shows a not-found message when the tournament id isn't in the response", async () => {
  vi.spyOn(api, "getAdminGameStatus").mockResolvedValue(tournaments);

  renderPage("/admin/games/9999?season=2025-26");

  expect(await screen.findByText("Tournament not found for this season")).toBeInTheDocument();
});

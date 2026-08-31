import { screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AdminTournamentGames, AuthUser, Season } from "../api/types";
import AdminGamesPage from "./AdminGamesPage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

const admin: AuthUser = {
  id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385",
  emailVerified: true, isAdmin: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
};

const seasons: Season[] = [{ label: "2024-25", isCurrent: false }, { label: "2025-26", isCurrent: true }];

function renderPage() {
  vi.spyOn(api, "getSeasons").mockResolvedValue(seasons);
  return renderWithProviders(<AdminGamesPage />, { auth: { status: "authenticated", user: admin } });
}

test("lists one row per tournament, linking to its detail page with the resolved season", async () => {
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
            {
              matchId: "103415", date: "2025-09-10T19:30:00Z", venue: null,
              homeTeamName: "Valur", awayTeamName: "KA", status: "upcoming", ingested: false, hbStatzIngested: false,
            },
          ],
        },
      ],
    },
  ];
  vi.spyOn(api, "getAdminGameStatus").mockResolvedValue(tournaments);

  renderPage();

  const link = await screen.findByRole("link", { name: "Olís deild karla" });
  expect(link).toHaveAttribute("href", "/admin/games/8444?season=2025-26");
  expect(screen.getByRole("cell", { name: "2" })).toBeInTheDocument(); // total games
  expect(screen.getByRole("cell", { name: "1" })).toBeInTheDocument(); // not-ingested count
});

test("shows never-synced for a tournament with no rounds", async () => {
  vi.spyOn(api, "getAdminGameStatus").mockResolvedValue([
    { tournamentId: "8444", name: "Olís deild karla", competitionName: "Olís deild karla", lastSyncedAt: null, rounds: [] },
  ]);

  renderPage();

  expect(await screen.findByText("Never synced")).toBeInTheDocument();
});

test("shows an empty message when there are no active tournaments", async () => {
  vi.spyOn(api, "getAdminGameStatus").mockResolvedValue([]);

  renderPage();

  expect(await screen.findByText("No active tournaments for this season.")).toBeInTheDocument();
});

test("shows an error message when the request fails", async () => {
  vi.spyOn(api, "getAdminGameStatus").mockRejectedValue(new Error("boom"));

  renderPage();

  expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
});

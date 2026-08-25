import { screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser, TournamentStatus } from "../api/types";
import AdminTournamentsPage from "./AdminTournamentsPage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

const admin: AuthUser = {
  id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385",
  emailVerified: true, isAdmin: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
};

function renderPage() {
  return renderWithProviders(<AdminTournamentsPage />, { auth: { status: "authenticated", user: admin } });
}

test("renders one row per tournament with its status", async () => {
  const tournaments: TournamentStatus[] = [
    {
      tournamentId: "8444", name: "Olís deild karla", gender: "karlar", type: "league",
      competitionId: "olis-karla", competitionName: "Olís deild karla", season: "2025-26",
      active: true, ingest: true, priority: 10,
    },
    {
      tournamentId: "8427", name: "Olís deild úrslit karla", gender: "karlar", type: "playoffs",
      competitionId: "olis-karla", competitionName: "Olís deild karla", season: "2025-26",
      active: false, ingest: false, priority: 20,
    },
  ];
  vi.spyOn(api, "getAdminTournamentStatus").mockResolvedValue(tournaments);

  renderPage();

  // "Olís deild karla" appears as the competition name in both rows, plus the first row's tournament name.
  expect(await screen.findAllByText("Olís deild karla")).toHaveLength(3);
  expect(screen.getByText("Olís deild úrslit karla")).toBeInTheDocument();
  expect(screen.getAllByText("On")).toHaveLength(2); // one active row's Active + Ingest badges
  expect(screen.getAllByText("Off")).toHaveLength(2);
});

test("shows an empty message when there are no tournaments", async () => {
  vi.spyOn(api, "getAdminTournamentStatus").mockResolvedValue([]);

  renderPage();

  expect(await screen.findByText("No tournaments found.")).toBeInTheDocument();
});

test("shows an error message when the request fails", async () => {
  vi.spyOn(api, "getAdminTournamentStatus").mockRejectedValue(new Error("boom"));

  renderPage();

  expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
});

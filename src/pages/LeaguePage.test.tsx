import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser } from "../api/types";
import { ApiError } from "../api/client";
import LeaguePage from "./LeaguePage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());
const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, isAdmin: false, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };

function render(id = "abc") {
  return renderWithProviders(
    <Routes><Route path="/leagues/:id" element={<LeaguePage />} /></Routes>,
    { initialEntries: [`/leagues/${id}`], auth: authed },
  );
}

test("renders the league with the current user marked '(you)'", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue({
    id: "abc", name: "Office Olís", season: "2025-26", creatorUserId: "u1", memberCount: 2, role: "creator", createdAt: "2026-06-08T00:00:00Z",
    members: [
      { userId: "u1", role: "creator", joinedAt: "2026-06-08T00:00:00Z", teamName: "Alpha" },
      { userId: "u2abcdefghij", role: "member", joinedAt: "2026-06-08T00:00:00Z", teamName: null },
    ],
  });
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue({ total: 0, offset: 0, limit: 50, latestRoundLabel: null, entries: [] });
  vi.spyOn(api, "getInvite").mockRejectedValue(new ApiError(404, "no_invite", "HTTP 404"));
  render();
  expect(await screen.findByText("Office Olís")).toBeInTheDocument();
  expect(screen.getByText("Jon (you)")).toBeInTheDocument();
  // a member with no team name yet falls back to a shortened (first-8) id, not the full one
  expect(screen.getByText("Member u2abcdef")).toBeInTheDocument();
  expect(screen.queryByText(/u2abcdefghij/)).not.toBeInTheDocument();
  expect(screen.getByText("You · creator")).toBeInTheDocument();
});

test("shows real team names and standings points per member", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue({
    id: "abc", name: "Office Olís", season: "2025-26", creatorUserId: "u1", memberCount: 2, role: "creator", createdAt: "2026-06-08T00:00:00Z",
    members: [
      { userId: "u1", role: "creator", joinedAt: "2026-06-08T00:00:00Z", teamName: "Alpha" },
      { userId: "u2", role: "member", joinedAt: "2026-06-08T00:00:00Z", teamName: "Bravo" },
    ],
  });
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue({
    total: 2, offset: 0, limit: 50, latestRoundLabel: "1",
    entries: [
      { rank: 1, previousRank: null, rankDelta: null, teamId: "u2:fantasy", teamName: "Bravo", color: "#abcdef", totalPoints: 70, roundPoints: 70 },
      { rank: 2, previousRank: null, rankDelta: null, teamId: "u1:fantasy", teamName: "Alpha", color: "#123456", totalPoints: 30, roundPoints: 30 },
    ],
  });
  vi.spyOn(api, "getInvite").mockRejectedValue(new ApiError(404, "no_invite", "HTTP 404"));
  render();
  expect(await screen.findByText("Bravo")).toBeInTheDocument();
  expect(screen.getByText("30 pts")).toBeInTheDocument();
  expect(screen.getByText("70 pts")).toBeInTheDocument();
});

test("maps 404 to a not-found message", async () => {
  vi.spyOn(api, "getMiniLeague").mockRejectedValue(new ApiError(404, "league_not_found", "HTTP 404"));
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue({ total: 0, offset: 0, limit: 50, latestRoundLabel: null, entries: [] });
  render();
  expect(await screen.findByText("League not found")).toBeInTheDocument();
});


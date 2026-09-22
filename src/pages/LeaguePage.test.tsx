import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser, MiniLeague, MiniLeagueMember } from "../api/types";
import { ApiError } from "../api/client";
import LeaguePage from "./LeaguePage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());
beforeEach(() => {
  vi.spyOn(api, "getInvite").mockRejectedValue(new ApiError(404, "no_invite", "HTTP 404"));
  vi.spyOn(api, "getClubs").mockResolvedValue([
    { clubId: "385", name: "Valur", logoUrl: "https://example.test/valur.png" },
    { clubId: "106", name: "FH", logoUrl: null },
  ]);
});

const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, isAdmin: false, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };

function member(userId: string, overrides: Partial<MiniLeagueMember> = {}): MiniLeagueMember {
  return { userId, role: "member", joinedAt: "2026-06-08T00:00:00Z", teamId: `${userId}:fantasy`, teamName: null, favoriteClubId: null, ...overrides };
}

function league(members: MiniLeagueMember[]): MiniLeague {
  return { id: "abc", name: "Office Olís", season: "2025-26", creatorUserId: "u1", memberCount: members.length, role: "creator", createdAt: "2026-06-08T00:00:00Z", members };
}

const noStandings = { total: 0, offset: 0, limit: 50, latestRoundLabel: null, entries: [] };

function render(id = "abc") {
  return renderWithProviders(
    <Routes><Route path="/leagues/:id" element={<LeaguePage />} /></Routes>,
    { initialEntries: [`/leagues/${id}`], auth: authed },
  );
}

function rowOf(text: string) {
  const row = screen.getByText(text).closest("li");
  if (!row) throw new Error(`no row for ${text}`);
  return within(row);
}

test("shows my own team name, marked as me", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue(league([
    member("u1", { role: "creator", teamName: "Alpha" }),
    member("u2", { teamName: "Bravo" }),
  ]));
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue(noStandings);
  render();
  expect(await screen.findByText("Alpha (you)")).toBeInTheDocument();
  expect(screen.getByText("Bravo")).toBeInTheDocument();
  expect(screen.queryByText("Jon (you)")).not.toBeInTheDocument();
  expect(screen.getByText("You · creator")).toBeInTheDocument();
});

test("falls back to my display name, or a short id for others, when there is no team name", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue(league([
    member("u1", { role: "creator" }),
    member("u2abcdefghij"),
  ]));
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue(noStandings);
  render();
  expect(await screen.findByText("Jon (you)")).toBeInTheDocument();
  expect(screen.getByText("Member u2abcdef")).toBeInTheDocument();
  expect(screen.queryByText(/u2abcdefghij/)).not.toBeInTheDocument();
});

test("shows standings points per member, joined by team id", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue(league([
    member("u1", { role: "creator", teamName: "Alpha" }),
    member("u2", { teamName: "Bravo" }),
  ]));
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue({
    total: 2, offset: 0, limit: 50, latestRoundLabel: "1",
    entries: [
      // standings names can differ from the member's (e.g. mid-rename); the id is the join key
      { rank: 1, previousRank: null, rankDelta: null, teamId: "u2:fantasy", teamName: "Bravo Old", color: "#abcdef", totalPoints: 70, roundPoints: 70 },
      { rank: 2, previousRank: null, rankDelta: null, teamId: "u1:fantasy", teamName: "Alpha", color: "#123456", totalPoints: 30, roundPoints: 30 },
    ],
  });
  render();
  await screen.findByText("70 pts");
  expect(rowOf("Alpha (you)").getByText("30 pts")).toBeInTheDocument();
  expect(rowOf("Bravo").getByText("70 pts")).toBeInTheDocument();
});

test("shows 0 points for a member without a standings entry", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue(league([member("u1", { role: "creator", teamName: "Alpha" })]));
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue(noStandings);
  render();
  expect(await screen.findByText("0 pts")).toBeInTheDocument();
});

test("shows the favorite club's logo, and no logo when the club has none or is unset", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue(league([
    member("u1", { role: "creator", teamName: "Alpha", favoriteClubId: "385" }),
    member("u2", { teamName: "Bravo", favoriteClubId: "106" }),
    member("u3", { teamName: "Charlie" }),
  ]));
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue(noStandings);
  render();
  const logo = await screen.findByRole("img", { name: "Valur" });
  expect(logo).toHaveAttribute("src", "https://example.test/valur.png");
  // FH has no logo and Charlie has no club: both fall back to the (decorative) ball
  expect(screen.getAllByRole("img")).toHaveLength(1);
});

test("maps 404 to a not-found message", async () => {
  vi.spyOn(api, "getMiniLeague").mockRejectedValue(new ApiError(404, "league_not_found", "HTTP 404"));
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue(noStandings);
  render();
  expect(await screen.findByText("League not found")).toBeInTheDocument();
});

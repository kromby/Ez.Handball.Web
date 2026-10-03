import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser, ManagerStanding, MiniLeague, MiniLeagueMember } from "../api/types";
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

function standing(userId: string, overrides: Partial<ManagerStanding> = {}): ManagerStanding {
  return {
    rank: 1, previousRank: null, rankDelta: null, teamId: `${userId}:fantasy`, teamName: "Alpha", color: "#123456",
    totalPoints: 70, roundPoints: 40, roundsPlayed: 2, averagePoints: 35,
    rounds: [{ roundLabel: "1", points: 30, totalPoints: 30 }, { roundLabel: "2", points: 40, totalPoints: 70 }],
    ...overrides,
  };
}

function standings(entries: ManagerStanding[]) {
  return { total: entries.length, offset: 0, limit: 50, latestRoundLabel: entries.length ? "2" : null, entries };
}

function rowOf(text: string) {
  // Team names also appear in the chart legend, so look only inside the table.
  const row = within(screen.getByRole("table")).getByText(text).closest("tr");
  if (!row) throw new Error(`no row for ${text}`);
  return within(row);
}

test("shows the standings table with rounds, total, average and last round, marking my team", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue(league([
    member("u1", { role: "creator", teamName: "Alpha" }),
    member("u2", { teamName: "Bravo" }),
  ]));
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue(standings([
    standing("u2", { rank: 1, teamName: "Bravo", totalPoints: 85, roundPoints: 35, averagePoints: 42.5 }),
    standing("u1", { rank: 2, teamName: "Alpha" }),
  ]));
  render();
  expect(await screen.findByRole("columnheader", { name: "Avg / round" })).toBeInTheDocument();
  const mine = rowOf("Alpha (you)");
  expect(mine.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["2", "Alpha (you)", "2", "70", "35.0", "40"]);
  expect(rowOf("Bravo").getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["1", "Bravo", "2", "85", "42.5", "35"]);
});

test("shows each team's favorite club logo, and no logo when the club has none or is unset", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue(league([
    member("u1", { role: "creator", teamName: "Alpha", favoriteClubId: "385" }),
    member("u2", { teamName: "Bravo", favoriteClubId: "106" }),
    member("u3", { teamName: "Charlie" }),
  ]));
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue(standings([
    standing("u1"), standing("u2", { teamName: "Bravo" }), standing("u3", { teamName: "Charlie" }),
  ]));
  render();
  const logo = await screen.findByRole("img", { name: "Valur" });
  expect(logo).toHaveAttribute("src", "https://example.test/valur.png");
  // FH has no logo and Charlie has no club: both fall back to the (decorative) ball.
  // The chart is an img too, so count only images inside the table.
  expect(within(screen.getByRole("table")).getAllByRole("img")).toHaveLength(1);
});

test("lists a member with no settled rounds at zero", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue(league([member("u1", { role: "creator", teamName: "Alpha" })]));
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue(standings([
    standing("u1", { totalPoints: 0, roundPoints: 0, roundsPlayed: 0, averagePoints: 0, rounds: [] }),
  ]));
  render();
  const mine = await screen.findByText("Alpha (you)");
  expect(within(mine.closest("tr")!).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["1", "Alpha (you)", "0", "0", "0.0", "0"]);
  expect(screen.getByText("No rounds have been settled yet.")).toBeInTheDocument();
  expect(screen.getByText("Just you so far.")).toBeInTheDocument();
});

test("draws a line chart of accumulated points with a legend entry per team", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue(league([
    member("u1", { role: "creator", teamName: "Alpha" }),
    member("u2", { teamName: "Bravo" }),
  ]));
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue(standings([
    standing("u1"),
    standing("u2", { rank: 2, teamName: "Bravo", rounds: [{ roundLabel: "2", points: 20, totalPoints: 20 }] }),
  ]));
  render();
  const chart = await screen.findByRole("img", { name: "Total points after each round, per team" });
  expect(within(chart as unknown as HTMLElement).getByText("Alpha · Round 2: 70")).toBeInTheDocument();
  // Bravo only scored in round 2, so it sits at 0 in round 1
  expect(within(chart as unknown as HTMLElement).getByText("Bravo · Round 1: 0")).toBeInTheDocument();
  const legend = screen.getByRole("list");
  expect(within(legend).getByText("Bravo")).toBeInTheDocument();
});

test("puts the invite panel below the standings and the chart", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue(league([member("u1", { role: "creator", teamName: "Alpha" })]));
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue(standings([standing("u1")]));
  render();
  const invite = await screen.findByRole("heading", { name: "Invite link" });
  const chartTitle = screen.getByRole("heading", { name: "Points after each round" });
  expect(chartTitle.compareDocumentPosition(invite) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test("shows a message when the standings fail to load, while the league still renders", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue(league([member("u1", { role: "creator", teamName: "Alpha" })]));
  vi.spyOn(api, "getMiniLeagueStandings").mockRejectedValue(new ApiError(500, "boom", "HTTP 500"));
  render();
  expect(await screen.findByText("Couldn't load the standings.")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Office Olís" })).toBeInTheDocument();
});

test("maps 404 to a not-found message", async () => {
  vi.spyOn(api, "getMiniLeague").mockRejectedValue(new ApiError(404, "league_not_found", "HTTP 404"));
  vi.spyOn(api, "getMiniLeagueStandings").mockResolvedValue(noStandings);
  render();
  expect(await screen.findByText("League not found")).toBeInTheDocument();
});

import { screen, waitFor, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser } from "../api/types";
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

test("shows the shortlist star on the player header when authenticated", async () => {
  const user = {
    id: "u1", email: "a@b.is", displayName: "Jon", language: "is" as const,
    favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
  };
  vi.spyOn(api, "getPlayer").mockResolvedValue({
    playerId: "7", name: "Ólafur Stefánsson", jerseyNumber: "7", dateOfBirth: null,
    age: null, teamId: "tm", clubId: "c1", clubName: "Valur", gender: "karlar",
  });
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({ playerId: "7", history: [], totals: null });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({ playerId: "7", stats: [] });
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 0, max: 20 });

  renderWithProviders(
    <Routes>
      <Route path="/players/:playerId" element={<PlayerPage />} />
    </Routes>,
    { initialEntries: ["/players/7"], auth: { status: "authenticated", user } },
  );

  await waitFor(() => expect(screen.getByText("Ólafur Stefánsson")).toBeInTheDocument());
  expect(await screen.findByRole("button", { name: /add ólafur stefánsson to shortlist/i })).toBeInTheDocument();
});

test("renders not-found when the player 404s", async () => {
  const { ApiError } = await import("../api/client");
  vi.spyOn(api, "getPlayer").mockRejectedValue(new ApiError(404, "player_not_found", "x"));
  vi.spyOn(api, "getPlayerHistory").mockRejectedValue(new ApiError(404, "player_not_found", "x"));
  vi.spyOn(api, "getPlayerStats").mockRejectedValue(new ApiError(404, "player_not_found", "x"));
  setup();
  await waitFor(() => expect(screen.getByText(/player not found/i)).toBeInTheDocument());
});

const authed = {
  status: "authenticated" as const,
  user: { id: "u1", email: "a@b.is", displayName: "Jon", language: "is" as const, favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null } as AuthUser,
};

function mockPlayerPageQueries(owned: boolean) {
  vi.spyOn(api, "getPlayer").mockResolvedValue({ playerId: "7", name: "Vik", jerseyNumber: null, dateOfBirth: null, age: null, teamId: "tm", clubId: "c1", clubName: "Aalvik", gender: "karlar", position: "LB", price: { amount: 9_000_000, currency: "ISK" } } as never);
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({ playerId: "7", history: [], totals: null });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({ playerId: "7", stats: [] });
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 0, max: 20 });
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue({ ruleSetVersion: 1, maxSquadSize: 15, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: { LB: 3 } });
  vi.spyOn(api, "getSquad").mockResolvedValue({
    flavor: "fantasy",
    players: owned ? [{ playerId: "7", name: "Vik", clubId: "c1", clubName: "Aalvik", position: "LB", gender: "karlar", price: { amount: 9_000_000, currency: "ISK" }, rating: 70, pricePaid: { amount: 9_000_000, currency: "ISK" } }] : [],
    budgetUsed: { amount: owned ? 9_000_000 : 0, currency: "ISK" },
    remainingBudget: { amount: owned ? 91_000_000 : 100_000_000, currency: "ISK" },
    squadValue: { amount: owned ? 9_000_000 : 0, currency: "ISK" },
  });
}

function renderPlayer() {
  return renderWithProviders(
    <Routes>
      <Route path="/players/:playerId" element={<PlayerPage />} />
    </Routes>,
    { initialEntries: ["/players/7"], auth: authed },
  );
}

test("shows an enabled Buy button when the player is not owned", async () => {
  mockPlayerPageQueries(false);
  renderPlayer();
  expect(await screen.findByRole("button", { name: /buy/i })).toBeEnabled();
});

test("shows a Sell button when the player is owned", async () => {
  mockPlayerPageQueries(true);
  renderPlayer();
  expect(await screen.findByRole("button", { name: /sell/i })).toBeInTheDocument();
});

test("shows the fantasy rating and price when present", async () => {
  vi.spyOn(api, "getPlayer").mockResolvedValue({ playerId: "7", name: "Vik", jerseyNumber: null, dateOfBirth: null, age: null, teamId: "t", clubId: "c1", clubName: "Aalvik", gender: "karlar", position: "LB", price: { amount: 12_000_000, currency: "ISK" }, rating: 128 } as never);
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({ playerId: "7", history: [], totals: null });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({ playerId: "7", stats: [] });
  renderWithProviders(<Routes><Route path="/players/:playerId" element={<PlayerPage />} /></Routes>, { initialEntries: ["/players/7"] });
  expect(await screen.findByText("Fantasy · this season")).toBeInTheDocument();
  expect(screen.getByText("128")).toBeInTheDocument();
  expect(screen.getByText(/12M ISK/)).toBeInTheDocument();
});

test("renders rating 0 as '0' and a null price as '—'", async () => {
  vi.spyOn(api, "getPlayer").mockResolvedValue({ playerId: "7", name: "Vik", jerseyNumber: null, dateOfBirth: null, age: null, teamId: "t", clubId: "c1", clubName: "Aalvik", gender: "karlar", position: "LB", price: null, rating: 0 } as never);
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({ playerId: "7", history: [], totals: null });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({ playerId: "7", stats: [] });
  renderWithProviders(<Routes><Route path="/players/:playerId" element={<PlayerPage />} /></Routes>, { initialEntries: ["/players/7"] });
  const strip = (await screen.findByText("Fantasy · this season")).closest("div")!;
  expect(within(strip).getByText("0")).toBeInTheDocument();
  expect(within(strip).getByText("—")).toBeInTheDocument();
});

test("omits the fantasy strip when both rating and price are absent", async () => {
  vi.spyOn(api, "getPlayer").mockResolvedValue({ playerId: "7", name: "Vik", jerseyNumber: null, dateOfBirth: null, age: null, teamId: "t", clubId: "c1", clubName: "Aalvik", gender: "karlar" } as never);
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({ playerId: "7", history: [], totals: null });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({ playerId: "7", stats: [] });
  renderWithProviders(<Routes><Route path="/players/:playerId" element={<PlayerPage />} /></Routes>, { initialEntries: ["/players/7"] });
  await screen.findByText("Vik");
  expect(screen.queryByText("Fantasy · this season")).not.toBeInTheDocument();
});

test("shows the Retired badge when the player is retired", async () => {
  vi.spyOn(api, "getPlayer").mockResolvedValue({ playerId: "7", name: "Vik", jerseyNumber: null, dateOfBirth: null, age: null, teamId: "tm", clubId: "c1", clubName: "Aalvik", gender: "karlar", retired: true } as never);
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({ playerId: "7", history: [], totals: null });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({ playerId: "7", stats: [] });
  renderWithProviders(<Routes><Route path="/players/:playerId" element={<PlayerPage />} /></Routes>, { initialEntries: ["/players/7"] });
  expect(await screen.findByText("Retired")).toBeInTheDocument();
});

test("does not show the Retired badge for an active player", async () => {
  vi.spyOn(api, "getPlayer").mockResolvedValue({ playerId: "7", name: "Vik", jerseyNumber: null, dateOfBirth: null, age: null, teamId: "tm", clubId: "c1", clubName: "Aalvik", gender: "karlar" } as never);
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({ playerId: "7", history: [], totals: null });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({ playerId: "7", stats: [] });
  renderWithProviders(<Routes><Route path="/players/:playerId" element={<PlayerPage />} /></Routes>, { initialEntries: ["/players/7"] });
  await screen.findByText("Vik");
  expect(screen.queryByText("Retired")).not.toBeInTheDocument();
});

test("suppresses the Buy button for an unowned retired player", async () => {
  vi.spyOn(api, "getPlayer").mockResolvedValue({ playerId: "7", name: "Vik", jerseyNumber: null, dateOfBirth: null, age: null, teamId: "tm", clubId: "c1", clubName: "Aalvik", gender: "karlar", position: "LB", price: { amount: 9_000_000, currency: "ISK" }, retired: true } as never);
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({ playerId: "7", history: [], totals: null });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({ playerId: "7", stats: [] });
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 0, max: 20 });
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue({ ruleSetVersion: 1, maxSquadSize: 15, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: { LB: 3 } });
  vi.spyOn(api, "getSquad").mockResolvedValue({ flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 100_000_000, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } });
  renderPlayer();
  await screen.findByText("Vik");
  // Wait for squad + constraints to settle (BuyButton returns null while loading,
  // so a synchronous assertion here would pass even if the gate were absent).
  await waitFor(() => expect(api.getSquad).toHaveBeenCalled());
  await waitFor(() => expect(screen.queryByRole("button", { name: /buy/i })).not.toBeInTheDocument());
});

test("still shows the Sell button for an owned retired player", async () => {
  vi.spyOn(api, "getPlayer").mockResolvedValue({ playerId: "7", name: "Vik", jerseyNumber: null, dateOfBirth: null, age: null, teamId: "tm", clubId: "c1", clubName: "Aalvik", gender: "karlar", position: "LB", price: { amount: 9_000_000, currency: "ISK" }, retired: true } as never);
  vi.spyOn(api, "getPlayerHistory").mockResolvedValue({ playerId: "7", history: [], totals: null });
  vi.spyOn(api, "getPlayerStats").mockResolvedValue({ playerId: "7", stats: [] });
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 0, max: 20 });
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue({ ruleSetVersion: 1, maxSquadSize: 15, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: { LB: 3 } });
  vi.spyOn(api, "getSquad").mockResolvedValue({ flavor: "fantasy", players: [{ playerId: "7", name: "Vik", clubId: "c1", clubName: "Aalvik", position: "LB", gender: "karlar", price: { amount: 9_000_000, currency: "ISK" }, rating: 70, pricePaid: { amount: 9_000_000, currency: "ISK" } }], budgetUsed: { amount: 9_000_000, currency: "ISK" }, remainingBudget: { amount: 91_000_000, currency: "ISK" }, squadValue: { amount: 9_000_000, currency: "ISK" } });
  renderPlayer();
  expect(await screen.findByRole("button", { name: /sell/i })).toBeInTheDocument();
});

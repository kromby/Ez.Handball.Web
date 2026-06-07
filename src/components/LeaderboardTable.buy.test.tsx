import { screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser, LeaderboardEntry } from "../api/types";
import { LeaderboardTable } from "./LeaderboardTable";
import { ToastProvider } from "./Toast";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());
const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };

const entry: LeaderboardEntry = { rank: 1, playerId: "p1", name: "Vik", clubId: "1", clubName: "Aalvik", gender: "karlar", games: 5, goals: 30, yellowCards: 0, twoMinuteSuspensions: 0, redCards: 0, avgGoals: 6 };

test("renders an enabled Buy button when the player is in the pool lookup", async () => {
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue({ ruleSetVersion: 1, maxSquadSize: 15, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: { LB: 3 } });
  vi.spyOn(api, "getSquad").mockResolvedValue({ flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 100_000_000, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } });
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 0, max: 20 });
  const lookup = new Map([["p1", { position: "LB", price: { amount: 9_000_000, currency: "ISK" } }]]);
  renderWithProviders(
    <ToastProvider><LeaderboardTable entries={[entry]} metric="goals" buyLookup={(id) => lookup.get(id)} /></ToastProvider>,
    { auth: authed },
  );
  expect(await screen.findByRole("button", { name: /buy/i })).toBeEnabled();
});

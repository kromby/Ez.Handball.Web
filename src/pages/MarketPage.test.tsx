import { screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser } from "../api/types";
import MarketPage from "./MarketPage";
import { ToastProvider } from "../components/Toast";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());
const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };

function mock() {
  vi.spyOn(api, "getSeasons").mockResolvedValue([{ label: "2025-26", isCurrent: true }]);
  vi.spyOn(api, "getTournaments").mockResolvedValue([]);
  vi.spyOn(api, "getGenders").mockResolvedValue([{ value: "karlar", label: "Karlar" }, { value: "kvenna", label: "Kvenna" }]);
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 0, max: 20 });
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue({ ruleSetVersion: 1, maxSquadSize: 15, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: { GK: 2, CB: 3 } });
  vi.spyOn(api, "getSquad").mockResolvedValue({ flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 100_000_000, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } });
  vi.spyOn(api, "getPlayerPool").mockResolvedValue({
    sort: "Rating", total: 1, offset: 0, limit: 50,
    entries: [{ rank: 1, playerId: "p1", name: "Bergström", clubId: "1", clubName: "Catalunya", gender: "karlar", position: "CB", price: { amount: 11_000_000, currency: "ISK" }, rating: 49, pickPercentage: null }],
  });
}

test("renders the priced pool with a Buy button", async () => {
  mock();
  renderWithProviders(<ToastProvider><MarketPage /></ToastProvider>, { auth: authed, initialEntries: ["/market"] });
  expect(await screen.findByText("Bergström")).toBeInTheDocument();
  expect(screen.getAllByText(/11M ISK/).length).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: /buy/i })).toBeEnabled();
});

test("does not render an Owned sort option", async () => {
  mock();
  renderWithProviders(<ToastProvider><MarketPage /></ToastProvider>, { auth: authed, initialEntries: ["/market"] });
  await screen.findByText("Bergström");
  expect(screen.queryByRole("button", { name: /owned/i })).not.toBeInTheDocument();
});

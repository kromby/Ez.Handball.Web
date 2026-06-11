import { screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser, ShortlistItem } from "../api/types";
import ShortlistPage from "./ShortlistPage";
import { renderWithProviders } from "../test/renderWithQuery";
import { ToastProvider } from "../components/Toast";

afterEach(() => vi.restoreAllMocks());

const user: AuthUser = {
  id: "u1", email: "a@b.is", displayName: "Jon", language: "is",
  favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
};
const authed = { status: "authenticated" as const, user };

const item = (over: Partial<ShortlistItem>): ShortlistItem => ({
  playerId: "p1", name: "Aron Pálmarsson", clubId: "c1", clubName: "Stjarnan",
  position: "VS", gender: "karlar", price: null, pickPercentage: null, createdAt: "", ...over,
});

const emptyPool = { sort: "Rating" as const, total: 0, offset: 0, limit: 200, entries: [] };
const emptySquad = { flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 100_000_000, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } };
const emptyConstraints = { ruleSetVersion: 1, maxSquadSize: 15, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: {} };

test("renders the shortlisted players and the count header", async () => {
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [item({})], count: 1, max: 20 });
  vi.spyOn(api, "getPlayers").mockResolvedValue(emptyPool);
  vi.spyOn(api, "getSquad").mockResolvedValue(emptySquad);
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue(emptyConstraints);
  renderWithProviders(<ShortlistPage />, { auth: authed });
  expect(await screen.findByRole("link", { name: "Aron Pálmarsson" })).toHaveAttribute("href", "/players/p1");
  expect(screen.getByText("Stjarnan")).toBeInTheDocument();
  expect(screen.getByText("VS")).toBeInTheDocument();
  expect(screen.getByText("1 / 20")).toBeInTheDocument();
});

test("shows the empty state when the shortlist is empty", async () => {
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 0, max: 20 });
  vi.spyOn(api, "getPlayers").mockResolvedValue(emptyPool);
  renderWithProviders(<ShortlistPage />, { auth: authed });
  expect(await screen.findByText(/No players yet/i)).toBeInTheDocument();
});

test("shows an error view when the shortlist request fails", async () => {
  vi.spyOn(api, "getShortlist").mockRejectedValue(new Error("boom"));
  vi.spyOn(api, "getPlayers").mockResolvedValue(emptyPool);
  renderWithProviders(<ShortlistPage />, { auth: authed });
  expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
});

test("removing a player calls the remove endpoint", async () => {
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [item({})], count: 1, max: 20 });
  vi.spyOn(api, "getPlayers").mockResolvedValue(emptyPool);
  vi.spyOn(api, "getSquad").mockResolvedValue(emptySquad);
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue(emptyConstraints);
  const remove = vi.spyOn(api, "removeFromShortlist").mockResolvedValue(undefined);
  renderWithProviders(<ShortlistPage />, { auth: authed });
  const star = await screen.findByRole("button", { name: /remove aron pálmarsson from shortlist/i });
  fireEvent.click(star);
  await waitFor(() => expect(remove).toHaveBeenCalledWith("p1"));
});

test("renders a Buy button for a shortlisted player found in the pool", async () => {
  vi.spyOn(api, "getShortlist").mockResolvedValue({
    items: [{ playerId: "p1", name: "Vik", clubId: "1", clubName: "Aalvik", position: "LB", gender: "karlar", price: null, pickPercentage: null, createdAt: "" }],
    count: 1, max: 20,
  });
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue({ ruleSetVersion: 1, maxSquadSize: 15, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: { LB: 3 } });
  vi.spyOn(api, "getSquad").mockResolvedValue({ flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 100_000_000, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } });
  vi.spyOn(api, "getPlayers").mockResolvedValue({
    sort: "Rating", total: 1, offset: 0, limit: 200,
    entries: [{ rank: 1, playerId: "p1", name: "Vik", clubId: "1", clubName: "Aalvik", gender: "karlar", position: "LB", games: 0, goals: 0, yellowCards: 0, twoMinuteSuspensions: 0, redCards: 0, avgGoals: 0, price: { amount: 9_000_000, currency: "ISK" }, rating: 30, pickPercentage: null }],
  });
  renderWithProviders(
    <ToastProvider><ShortlistPage /></ToastProvider>,
    { auth: { status: "authenticated", user: { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null } } },
  );
  expect(await screen.findByRole("button", { name: /buy/i })).toBeEnabled();
});

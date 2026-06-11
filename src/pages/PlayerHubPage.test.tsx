import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser, PoolEntry } from "../api/types";
import PlayerHubPage from "./PlayerHubPage";
import { ToastProvider } from "../components/Toast";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null };

const entry: PoolEntry = {
  rank: 1, playerId: "p1", name: "Bergström", clubId: "1", clubName: "Catalunya",
  gender: "karlar", position: "CB", games: 8, goals: 20, yellowCards: 3,
  twoMinuteSuspensions: 2, redCards: 1, avgGoals: 2.5,
  price: { amount: 11_000_000, currency: "ISK" }, rating: 49, pickPercentage: null,
};

function mock() {
  vi.spyOn(api, "getSeasons").mockResolvedValue([{ label: "2025-26", isCurrent: true }]);
  vi.spyOn(api, "getTournaments").mockResolvedValue([]);
  vi.spyOn(api, "getGenders").mockResolvedValue([{ value: "karlar", label: "Karlar" }, { value: "kvenna", label: "Kvenna" }]);
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue({ ruleSetVersion: 1, maxSquadSize: 7, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: { GK: 1, CB: 1 } });
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 0, max: 20 });
  vi.spyOn(api, "getSquad").mockResolvedValue({ flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 100_000_000, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } });
  vi.spyOn(api, "getClubs").mockResolvedValue([
    { clubId: "1", name: "Catalunya", logoUrl: null },
    { clubId: "385", name: "Akureyri", logoUrl: null },
  ]);
  return vi.spyOn(api, "getPlayers").mockResolvedValue({ sort: "Goals", total: 1, offset: 0, limit: 50, entries: [entry] });
}

test("renders public for an anonymous visitor without a buy column or budget chip", async () => {
  mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, { initialEntries: ["/players"] });
  expect(await screen.findByText("Bergström")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /buy/i })).not.toBeInTheDocument();
  expect(screen.queryByText(/Budget left/i)).not.toBeInTheDocument();
});

test("authenticated visitor sees the buy column and budget chip", async () => {
  mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, {
    auth: { status: "authenticated", user }, initialEntries: ["/players"],
  });
  expect(await screen.findByRole("button", { name: /buy/i })).toBeInTheDocument();
  expect(screen.getByText(/Budget left/i)).toBeInTheDocument();
});

test("clicking a column header re-queries getPlayers with that sort", async () => {
  const spy = mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, { initialEntries: ["/players"] });
  await screen.findByText("Bergström");
  await userEvent.click(screen.getByRole("button", { name: /Price/i }));
  expect(spy.mock.calls.some(([p]) => p.sort === "Price")).toBe(true);
});

test("no standalone 'Sort by' dropdown is rendered", async () => {
  mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, { initialEntries: ["/players"] });
  await screen.findByText("Bergström");
  expect(screen.queryByRole("combobox", { name: /Sort by/i })).not.toBeInTheDocument();
});

test("typing a name re-queries getPlayers with the name filter", async () => {
  const spy = mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, { initialEntries: ["/players"] });
  await screen.findByText("Bergström");
  await userEvent.type(screen.getByRole("searchbox", { name: /Search players/i }), "berg");
  await waitFor(() => expect(spy.mock.calls.some(([p]) => p.name === "berg")).toBe(true));
});

test("selecting a team re-queries getPlayers with that clubId", async () => {
  const spy = mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, { initialEntries: ["/players"] });
  await screen.findByText("Bergström");
  await userEvent.selectOptions(screen.getByRole("combobox", { name: /Team/i }), "385");
  await waitFor(() => expect(spy.mock.calls.some(([p]) => p.clubId === "385")).toBe(true));
});

test("name seeds from the URL and composes with an existing filter", async () => {
  const spy = mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, {
    initialEntries: ["/players?name=berg&position=CB"],
  });
  await screen.findByText("Bergström");
  await waitFor(() =>
    expect(spy.mock.calls.some(([p]) => p.name === "berg" && p.position === "CB")).toBe(true),
  );
  expect((screen.getByRole("searchbox", { name: /Search players/i }) as HTMLInputElement).value).toBe("berg");
});

test("changing the team resets the pagination offset", async () => {
  const spy = mock();
  renderWithProviders(<ToastProvider><PlayerHubPage /></ToastProvider>, {
    initialEntries: ["/players?offset=50"],
  });
  await screen.findByText("Bergström");
  await userEvent.selectOptions(screen.getByRole("combobox", { name: /Team/i }), "385");
  await waitFor(() =>
    expect(spy.mock.calls.some(([p]) => p.clubId === "385" && (p.offset ?? 0) === 0)).toBe(true),
  );
});

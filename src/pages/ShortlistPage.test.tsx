import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser, PoolEntry } from "../api/types";
import ShortlistPage from "./ShortlistPage";
import { renderWithProviders } from "../test/renderWithQuery";
import { ToastProvider } from "../components/Toast";

afterEach(() => vi.restoreAllMocks());

const user: AuthUser = {
  id: "u1", email: "a@b.is", displayName: "Jon", language: "is",
  favoriteClubId: "385", emailVerified: true, isAdmin: false, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
};
const authed = { status: "authenticated" as const, user };

const entry = (over: Partial<PoolEntry> = {}): PoolEntry => ({
  rank: 1, playerId: "p1", name: "Aron Pálmarsson", clubId: "c1", clubName: "Stjarnan",
  gender: "karlar", position: "VS", positionSecondary: null, games: 10, goals: 25, yellowCards: 2,
  twoMinuteSuspensions: 1, redCards: 0, avgGoals: 2.5,
  price: { amount: 9_000_000, currency: "ISK" }, rating: 60, pickPercentage: null,
  assists: 6, steals: 3, blocks: 0, saves: 0, turnovers: 4, legalStops: 0, shots: 40,
  expectedGoals: 22.1, shotsFaced: 0, savePct: null, expectedSaves: 0,
  gradeTotal: 6.5, gradeOffense: 6.9, gradeDefense: 5.8, gradeGoalkeeping: null,
  ...over,
});

const emptySquad = { flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 100_000_000, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } };
const emptyConstraints = { ruleSetVersion: 1, maxSquadSize: 15, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: { VS: 3 } };

function mock() {
  vi.spyOn(api, "getSeasons").mockResolvedValue([{ label: "2025-26", isCurrent: true }]);
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue(emptyConstraints);
  vi.spyOn(api, "getSquad").mockResolvedValue(emptySquad);
  vi.spyOn(api, "getClubs").mockResolvedValue([
    { clubId: "c1", name: "Stjarnan", logoUrl: null },
    { clubId: "385", name: "Akureyri", logoUrl: null },
  ]);
}

test("renders the shortlisted players in the same grid as the players page", async () => {
  mock();
  vi.spyOn(api, "getShortlist").mockResolvedValue({
    items: [{ playerId: "p1", name: "Aron Pálmarsson", clubId: "c1", clubName: "Stjarnan", position: "VS", gender: "karlar", price: null, pickPercentage: null, createdAt: "", positionSecondary: null, games: null, goals: null, yellowCards: null, twoMinuteSuspensions: null, redCards: null, assists: null, steals: null, blocks: null, saves: null, turnovers: null, legalStops: null, shots: null, expectedGoals: null, shotsFaced: null, savePct: null, expectedSaves: null, gradeTotal: null, gradeOffense: null, gradeDefense: null, gradeGoalkeeping: null }],
    count: 1, max: 20,
  });
  const players = vi.spyOn(api, "getPlayers").mockResolvedValue({ sort: "Goals", total: 1, offset: 0, limit: 50, entries: [entry()] });

  renderWithProviders(<ToastProvider><ShortlistPage /></ToastProvider>, { auth: authed });

  expect(await screen.findByRole("link", { name: "Aron Pálmarsson" })).toHaveAttribute("href", "/players/p1");
  expect(screen.getByRole("link", { name: "Stjarnan" })).toBeInTheDocument();
  expect(screen.getByText("1 / 20")).toBeInTheDocument();
  await waitFor(() => expect(players.mock.calls.some(([p]) => p.playerIds?.includes("p1"))).toBe(true));
});

test("shows the same filter controls as the players page — no gender or tournament filter", async () => {
  mock();
  vi.spyOn(api, "getShortlist").mockResolvedValue({
    items: [{ playerId: "p1", name: "Aron Pálmarsson", clubId: "c1", clubName: "Stjarnan", position: "VS", gender: "karlar", price: null, pickPercentage: null, createdAt: "", positionSecondary: null, games: null, goals: null, yellowCards: null, twoMinuteSuspensions: null, redCards: null, assists: null, steals: null, blocks: null, saves: null, turnovers: null, legalStops: null, shots: null, expectedGoals: null, shotsFaced: null, savePct: null, expectedSaves: null, gradeTotal: null, gradeOffense: null, gradeDefense: null, gradeGoalkeeping: null }],
    count: 1, max: 20,
  });
  vi.spyOn(api, "getPlayers").mockResolvedValue({ sort: "Goals", total: 1, offset: 0, limit: 50, entries: [entry()] });

  renderWithProviders(<ToastProvider><ShortlistPage /></ToastProvider>, { auth: authed });
  await screen.findByText("Aron Pálmarsson");

  expect(screen.getByRole("searchbox", { name: /Search players/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /Season/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /Position/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /Team/i })).toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: /Gender/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: /Tournament/i })).not.toBeInTheDocument();
});

test("shows the empty state and never calls getPlayers when the shortlist is empty", async () => {
  mock();
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 0, max: 20 });
  const players = vi.spyOn(api, "getPlayers").mockResolvedValue({ sort: "Goals", total: 0, offset: 0, limit: 50, entries: [] });

  renderWithProviders(<ToastProvider><ShortlistPage /></ToastProvider>, { auth: authed });

  expect(await screen.findByText(/No players yet/i)).toBeInTheDocument();
  expect(players).not.toHaveBeenCalled();
});

test("shows an error view when the shortlist request fails", async () => {
  mock();
  vi.spyOn(api, "getShortlist").mockRejectedValue(new Error("boom"));
  vi.spyOn(api, "getPlayers").mockResolvedValue({ sort: "Goals", total: 0, offset: 0, limit: 50, entries: [] });

  renderWithProviders(<ToastProvider><ShortlistPage /></ToastProvider>, { auth: authed });

  expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
});

test("removing a player calls the remove endpoint", async () => {
  mock();
  vi.spyOn(api, "getShortlist").mockResolvedValue({
    items: [{ playerId: "p1", name: "Aron Pálmarsson", clubId: "c1", clubName: "Stjarnan", position: "VS", gender: "karlar", price: null, pickPercentage: null, createdAt: "", positionSecondary: null, games: null, goals: null, yellowCards: null, twoMinuteSuspensions: null, redCards: null, assists: null, steals: null, blocks: null, saves: null, turnovers: null, legalStops: null, shots: null, expectedGoals: null, shotsFaced: null, savePct: null, expectedSaves: null, gradeTotal: null, gradeOffense: null, gradeDefense: null, gradeGoalkeeping: null }],
    count: 1, max: 20,
  });
  vi.spyOn(api, "getPlayers").mockResolvedValue({ sort: "Goals", total: 1, offset: 0, limit: 50, entries: [entry()] });
  const remove = vi.spyOn(api, "removeFromShortlist").mockResolvedValue(undefined);

  renderWithProviders(<ToastProvider><ShortlistPage /></ToastProvider>, { auth: authed });

  const star = await screen.findByRole("button", { name: /remove aron pálmarsson from shortlist/i });
  fireEvent.click(star);
  await waitFor(() => expect(remove).toHaveBeenCalledWith("p1"));
});

test("renders a Buy button for a shortlisted player, like the players grid", async () => {
  mock();
  vi.spyOn(api, "getShortlist").mockResolvedValue({
    items: [{ playerId: "p1", name: "Aron Pálmarsson", clubId: "c1", clubName: "Stjarnan", position: "VS", gender: "karlar", price: null, pickPercentage: null, createdAt: "", positionSecondary: null, games: null, goals: null, yellowCards: null, twoMinuteSuspensions: null, redCards: null, assists: null, steals: null, blocks: null, saves: null, turnovers: null, legalStops: null, shots: null, expectedGoals: null, shotsFaced: null, savePct: null, expectedSaves: null, gradeTotal: null, gradeOffense: null, gradeDefense: null, gradeGoalkeeping: null }],
    count: 1, max: 20,
  });
  vi.spyOn(api, "getPlayers").mockResolvedValue({ sort: "Goals", total: 1, offset: 0, limit: 50, entries: [entry()] });

  renderWithProviders(<ToastProvider><ShortlistPage /></ToastProvider>, { auth: authed });

  expect(await screen.findByRole("button", { name: /buy/i })).toBeEnabled();
});

test("selecting a team re-queries getPlayers with that clubId, scoped to the shortlist", async () => {
  mock();
  vi.spyOn(api, "getShortlist").mockResolvedValue({
    items: [{ playerId: "p1", name: "Aron Pálmarsson", clubId: "c1", clubName: "Stjarnan", position: "VS", gender: "karlar", price: null, pickPercentage: null, createdAt: "", positionSecondary: null, games: null, goals: null, yellowCards: null, twoMinuteSuspensions: null, redCards: null, assists: null, steals: null, blocks: null, saves: null, turnovers: null, legalStops: null, shots: null, expectedGoals: null, shotsFaced: null, savePct: null, expectedSaves: null, gradeTotal: null, gradeOffense: null, gradeDefense: null, gradeGoalkeeping: null }],
    count: 1, max: 20,
  });
  const players = vi.spyOn(api, "getPlayers").mockResolvedValue({ sort: "Goals", total: 1, offset: 0, limit: 50, entries: [entry()] });

  renderWithProviders(<ToastProvider><ShortlistPage /></ToastProvider>, { auth: authed });
  await screen.findByText("Aron Pálmarsson");

  await userEvent.selectOptions(screen.getByRole("combobox", { name: /Team/i }), "385");
  await waitFor(() =>
    expect(players.mock.calls.some(([p]) => p.clubId === "385" && p.playerIds?.includes("p1"))).toBe(true),
  );
});

test("clicking a column header re-queries getPlayers with that sort, scoped to the shortlist", async () => {
  mock();
  vi.spyOn(api, "getShortlist").mockResolvedValue({
    items: [{ playerId: "p1", name: "Aron Pálmarsson", clubId: "c1", clubName: "Stjarnan", position: "VS", gender: "karlar", price: null, pickPercentage: null, createdAt: "", positionSecondary: null, games: null, goals: null, yellowCards: null, twoMinuteSuspensions: null, redCards: null, assists: null, steals: null, blocks: null, saves: null, turnovers: null, legalStops: null, shots: null, expectedGoals: null, shotsFaced: null, savePct: null, expectedSaves: null, gradeTotal: null, gradeOffense: null, gradeDefense: null, gradeGoalkeeping: null }],
    count: 1, max: 20,
  });
  const players = vi.spyOn(api, "getPlayers").mockResolvedValue({ sort: "Goals", total: 1, offset: 0, limit: 50, entries: [entry()] });

  renderWithProviders(<ToastProvider><ShortlistPage /></ToastProvider>, { auth: authed });
  await screen.findByText("Aron Pálmarsson");

  await userEvent.click(screen.getByRole("button", { name: /Price/i }));
  await waitFor(() => expect(players.mock.calls.some(([p]) => p.sort === "Price")).toBe(true));
});

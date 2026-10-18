import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser, PlayerMissingPosition, PoolEntry } from "../api/types";
import AdminPlayersPage from "./AdminPlayersPage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

const admin: AuthUser = {
  id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385",
  emailVerified: true, isAdmin: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
};

const poolEntry: PoolEntry = {
  rank: 1, playerId: "p0", name: "", clubId: "385", clubName: "Stjarnan", gender: "karlar",
  position: "CB", positionSecondary: null, games: 0, goals: 0, yellowCards: 0, twoMinuteSuspensions: 0,
  redCards: 0, avgGoals: 0, price: { amount: 0, currency: "ISK" }, rating: 0, pickPercentage: null, assists: 0, steals: 0,
  blocks: 0, saves: 0, turnovers: 0, legalStops: 0, shots: 0, expectedGoals: 0, shotsFaced: 0,
  savePct: null, expectedSaves: 0, gradeTotal: null, gradeOffense: null, gradeDefense: null, gradeGoalkeeping: null,
};

function renderPage() {
  return renderWithProviders(<AdminPlayersPage />, { auth: { status: "authenticated", user: admin } });
}

test("lists players missing a position with their club and gender", async () => {
  const players: PlayerMissingPosition[] = [
    { playerId: "p1", name: "Jón Jónsson", clubId: "c1", clubName: "Stjarnan", gender: "male", position: null, positionSecondary: null },
    { playerId: "p2", name: "Anna Ó.", clubId: "c2", clubName: null, gender: "female", position: "Leikmaður", positionSecondary: null },
  ];
  vi.spyOn(api, "getPlayersMissingPosition").mockResolvedValue(players);

  renderPage();

  expect(await screen.findByText("Jón Jónsson")).toBeInTheDocument();
  expect(screen.getByText("Stjarnan")).toBeInTheDocument();
  expect(screen.getByText("Anna Ó.")).toBeInTheDocument();
  expect(screen.getByText("—")).toBeInTheDocument();
});

test("shows an empty message when no players are missing a position", async () => {
  vi.spyOn(api, "getPlayersMissingPosition").mockResolvedValue([]);

  renderPage();

  expect(await screen.findByText("No players are missing a position.")).toBeInTheDocument();
});

test("shows an error message when the request fails", async () => {
  vi.spyOn(api, "getPlayersMissingPosition").mockRejectedValue(new Error("boom"));

  renderPage();

  expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
});

test("saving a position from the worklist sends both positions and the row drops off immediately", async () => {
  const players: PlayerMissingPosition[] = [
    { playerId: "p1", name: "Jón Jónsson", clubId: "c1", clubName: "Stjarnan", gender: "male", position: null, positionSecondary: "LB" },
  ];
  // The list endpoint keeps returning the same (stale) data on every call, simulating
  // a backend that hasn't caught up to the write yet — the UI must not depend on it.
  vi.spyOn(api, "getPlayersMissingPosition").mockResolvedValue(players);
  const setPosition = vi.spyOn(api, "setPlayerPosition").mockResolvedValue();

  renderPage();

  const row = await screen.findByRole("row", { name: /Jón Jónsson/ });
  await userEvent.selectOptions(within(row).getByRole("combobox", { name: "Position" }), "LW");
  await userEvent.click(within(row).getByRole("button", { name: "Save" }));

  expect(setPosition).toHaveBeenCalledWith("p1", "LW", "LB");
  await waitFor(() => expect(screen.queryByText("Jón Jónsson")).not.toBeInTheDocument());
});

test("the placeholder option is not disabled, so browsers can select it as the controlled value", async () => {
  const players: PlayerMissingPosition[] = [
    { playerId: "p1", name: "Jón Jónsson", clubId: "c1", clubName: "Stjarnan", gender: "male", position: null, positionSecondary: null },
  ];
  vi.spyOn(api, "getPlayersMissingPosition").mockResolvedValue(players);

  renderPage();

  const select = await screen.findByRole("combobox", { name: "Position" });
  const placeholder = within(select).getByText("Choose position") as HTMLOptionElement;
  expect(placeholder.disabled).toBe(false);
});

test("searching finds any player and lets the admin edit both positions", async () => {
  vi.spyOn(api, "getPlayersMissingPosition").mockResolvedValue([]);
  const getPlayers = vi.spyOn(api, "getPlayers").mockResolvedValue({
    sort: "Goals", total: 1, offset: 0, limit: 20,
    entries: [{ ...poolEntry, playerId: "p9", name: "Aron Pálmarsson", position: "CB", positionSecondary: "LB" }],
  });
  const setPosition = vi.spyOn(api, "setPlayerPosition").mockResolvedValue();

  renderPage();

  await userEvent.type(screen.getByRole("searchbox", { name: "Find a player" }), "Aron");
  const row = await screen.findByRole("row", { name: /Aron Pálmarsson/ });
  expect(getPlayers).toHaveBeenCalledWith(expect.objectContaining({ name: "Aron", limit: 20 }));

  await userEvent.selectOptions(within(row).getByRole("combobox", { name: "Secondary position" }), "RB");
  await userEvent.click(within(row).getByRole("button", { name: "Save" }));

  expect(setPosition).toHaveBeenCalledWith("p9", "CB", "RB");
});

test("search waits for at least two characters", async () => {
  vi.spyOn(api, "getPlayersMissingPosition").mockResolvedValue([]);
  const getPlayers = vi.spyOn(api, "getPlayers");

  renderPage();

  await userEvent.type(screen.getByRole("searchbox", { name: "Find a player" }), "A");
  await new Promise((resolve) => setTimeout(resolve, 400));

  expect(getPlayers).not.toHaveBeenCalled();
});

test("shows a message when the search finds nobody", async () => {
  vi.spyOn(api, "getPlayersMissingPosition").mockResolvedValue([]);
  vi.spyOn(api, "getPlayers").mockResolvedValue({ sort: "Goals", total: 0, offset: 0, limit: 20, entries: [] });

  renderPage();

  await userEvent.type(screen.getByRole("searchbox", { name: "Find a player" }), "Zz");

  expect(await screen.findByText("No players match that name.")).toBeInTheDocument();
});

test("shows an inline error if saving a position fails", async () => {
  const players: PlayerMissingPosition[] = [
    { playerId: "p1", name: "Jón Jónsson", clubId: "c1", clubName: "Stjarnan", gender: "male", position: null, positionSecondary: null },
  ];
  vi.spyOn(api, "getPlayersMissingPosition").mockResolvedValue(players);
  vi.spyOn(api, "setPlayerPosition").mockRejectedValue(new Error("boom"));

  renderPage();

  const select = await screen.findByRole("combobox", { name: "Position" });
  await userEvent.selectOptions(select, "LW");
  await userEvent.click(screen.getByRole("button", { name: "Save" }));

  expect(await screen.findByText("Couldn't save this position. Please try again.")).toBeInTheDocument();
});

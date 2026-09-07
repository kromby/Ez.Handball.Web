import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser, PlayerMissingPosition } from "../api/types";
import AdminPlayersPage from "./AdminPlayersPage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

const admin: AuthUser = {
  id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385",
  emailVerified: true, isAdmin: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
};

function renderPage() {
  return renderWithProviders(<AdminPlayersPage />, { auth: { status: "authenticated", user: admin } });
}

test("lists players missing a position with their club and gender", async () => {
  const players: PlayerMissingPosition[] = [
    { playerId: "p1", name: "Jón Jónsson", clubId: "c1", clubName: "Stjarnan", gender: "male", position: null },
    { playerId: "p2", name: "Anna Ó.", clubId: "c2", clubName: null, gender: "female", position: "Leikmaður" },
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

test("picking a position saves it and the row drops off the list immediately", async () => {
  const players: PlayerMissingPosition[] = [
    { playerId: "p1", name: "Jón Jónsson", clubId: "c1", clubName: "Stjarnan", gender: "male", position: null },
  ];
  // The list endpoint keeps returning the same (stale) data on every call, simulating
  // a backend that hasn't caught up to the write yet — the UI must not depend on it.
  vi.spyOn(api, "getPlayersMissingPosition").mockResolvedValue(players);
  const setPosition = vi.spyOn(api, "setPlayerPosition").mockResolvedValue();

  renderPage();

  const select = await screen.findByRole("combobox", { name: "Position" });
  await userEvent.selectOptions(select, "LW");

  expect(setPosition).toHaveBeenCalledWith("p1", "LW");
  await waitFor(() => expect(screen.queryByText("Jón Jónsson")).not.toBeInTheDocument());
});

test("the placeholder option is not disabled, so browsers can select it as the controlled value", async () => {
  const players: PlayerMissingPosition[] = [
    { playerId: "p1", name: "Jón Jónsson", clubId: "c1", clubName: "Stjarnan", gender: "male", position: null },
  ];
  vi.spyOn(api, "getPlayersMissingPosition").mockResolvedValue(players);

  renderPage();

  const select = await screen.findByRole("combobox", { name: "Position" });
  const placeholder = within(select).getByText("Choose position") as HTMLOptionElement;
  expect(placeholder.disabled).toBe(false);
});

test("shows an inline error if saving a position fails", async () => {
  const players: PlayerMissingPosition[] = [
    { playerId: "p1", name: "Jón Jónsson", clubId: "c1", clubName: "Stjarnan", gender: "male", position: null },
  ];
  vi.spyOn(api, "getPlayersMissingPosition").mockResolvedValue(players);
  vi.spyOn(api, "setPlayerPosition").mockRejectedValue(new Error("boom"));

  renderPage();

  const select = await screen.findByRole("combobox", { name: "Position" });
  await userEvent.selectOptions(select, "LW");

  expect(await screen.findByText("Couldn't save this position. Please try again.")).toBeInTheDocument();
});

import { screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import * as api from "../../api/endpoints";
import type { AuthUser, Gameweek, MiniLeague } from "../../api/types";
import { ApiError } from "../../api/client";
import { StartRoundPanel } from "./StartRoundPanel";
import { renderWithProviders } from "../../test/renderWithQuery";

const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, isAdmin: false, createdAt: "", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };
const gw = (number: number, roundLabel: string): Gameweek =>
  ({ number, roundLabel, tournamentId: "9142", deadline: "2026-09-01T18:00:00Z", status: "Settled", matches: [] });
const league = (role: string | null, startRound: string | null = null): MiniLeague =>
  ({ id: "L1", name: "Office", season: "2025-26", startRound, creatorUserId: "u1", memberCount: 2, role, createdAt: "", members: [] });

afterEach(() => vi.restoreAllMocks());
beforeEach(() => {
  vi.spyOn(api, "getGameweeks").mockResolvedValue([gw(1, "1"), gw(5, "5"), gw(6, "6")]);
});

test("renders nothing for a member who isn't the creator", async () => {
  renderWithProviders(<StartRoundPanel league={league("member", "1")} />, { auth: authed });
  await waitFor(() => expect(api.getGameweeks).toHaveBeenCalled());
  expect(screen.queryByLabelText("Count points from")).not.toBeInTheDocument();
});

test("shows the saved start round, with save disabled until it changes", async () => {
  renderWithProviders(<StartRoundPanel league={league("creator", "5")} />, { auth: authed });
  expect(await screen.findByLabelText("Count points from")).toHaveValue("5");
  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
});

test("a league without a start round shows the first round", async () => {
  renderWithProviders(<StartRoundPanel league={league("creator")} />, { auth: authed });
  expect(await screen.findByLabelText("Count points from")).toHaveValue("1");
});

test("the creator saves a new start round", async () => {
  const save = vi.spyOn(api, "setMiniLeagueStartRound").mockResolvedValue({ id: "L1", startRound: "6" });
  renderWithProviders(<StartRoundPanel league={league("creator", "1")} />, { auth: authed });
  fireEvent.change(await screen.findByLabelText("Count points from"), { target: { value: "6" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith("L1", "6"));
  expect(await screen.findByRole("status")).toHaveTextContent(/saved/i);
});

test("shows an error when the save is rejected", async () => {
  vi.spyOn(api, "setMiniLeagueStartRound").mockRejectedValue(new ApiError(403, "not_creator", "HTTP 403"));
  renderWithProviders(<StartRoundPanel league={league("creator", "1")} />, { auth: authed });
  fireEvent.change(await screen.findByLabelText("Count points from"), { target: { value: "6" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i);
});

test("hides the panel when the gameweek calendar is unavailable", async () => {
  vi.spyOn(api, "getGameweeks").mockRejectedValue(new ApiError(404, "not_found", "HTTP 404"));
  renderWithProviders(<StartRoundPanel league={league("creator", "1")} />, { auth: authed });
  await waitFor(() => expect(api.getGameweeks).toHaveBeenCalled());
  expect(screen.queryByLabelText("Count points from")).not.toBeInTheDocument();
});

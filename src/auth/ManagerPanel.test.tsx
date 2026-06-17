import { screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { Manager } from "../api/types";
import { ApiError } from "../api/client";
import { ManagerPanel } from "./ManagerPanel";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

const MANAGER: Manager = {
  flavor: "fantasy", teamName: "FC Awesome", favoriteClubId: "385", color: "#1E88E5",
  onboarding: { squadComplete: false, playersOwned: 9, squadSize: 15 },
};
const authed = { status: "authenticated" as const, user: { id: "u1", email: "a@b.is", displayName: "Jon", language: "is" as const, favoriteClubId: "385", teamName: "FC Awesome", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null } };

test("renders the team name and a progress line while incomplete", async () => {
  vi.spyOn(api, "getManager").mockResolvedValue(MANAGER);
  renderWithProviders(<ManagerPanel />, { auth: authed });
  expect(await screen.findByText("FC Awesome")).toBeInTheDocument();
  expect(screen.getByText("9 / 15 players")).toBeInTheDocument();
});

test("rename success shows the saved note and updates the field", async () => {
  vi.spyOn(api, "getManager").mockResolvedValue(MANAGER);
  vi.spyOn(api, "renameTeam").mockResolvedValue({ ...MANAGER, teamName: "New FC" });
  const setTeamName = vi.fn();
  renderWithProviders(<ManagerPanel />, { auth: { ...authed, setTeamName } });
  const input = await screen.findByLabelText(/team name/i);
  fireEvent.change(input, { target: { value: "New FC" } });
  fireEvent.click(screen.getByRole("button", { name: /save/i }));
  await waitFor(() => expect(api.renameTeam).toHaveBeenCalledWith("New FC"));
  expect(await screen.findByRole("status")).toHaveTextContent(/updated/i);
  expect(setTeamName).toHaveBeenCalledWith("New FC");
});

test("surfaces the 409 taken error inline", async () => {
  vi.spyOn(api, "getManager").mockResolvedValue(MANAGER);
  vi.spyOn(api, "renameTeam").mockRejectedValue(new ApiError(409, "team_name_taken", "taken"));
  renderWithProviders(<ManagerPanel />, { auth: authed });
  const input = await screen.findByLabelText(/team name/i);
  fireEvent.change(input, { target: { value: "Taken FC" } });
  fireEvent.click(screen.getByRole("button", { name: /save/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/taken/i);
});

test("surfaces the 400 validation error inline", async () => {
  vi.spyOn(api, "getManager").mockResolvedValue(MANAGER);
  vi.spyOn(api, "renameTeam").mockRejectedValue(new ApiError(400, "validation_error", "bad"));
  renderWithProviders(<ManagerPanel />, { auth: authed });
  const input = await screen.findByLabelText(/team name/i);
  fireEvent.change(input, { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: /save/i }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/isn't allowed|allowed|too long/i);
});

import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser, MiniLeague } from "../api/types";
import { ApiError } from "../api/client";
import { InvitePanel } from "./InvitePanel";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());
const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, createdAt: "", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };
const league = (role: string | null): MiniLeague => ({ id: "L1", name: "Office", season: "2025-26", creatorUserId: "u1", memberCount: 1, role, createdAt: "", members: [] });

test("renders nothing for a non-member", () => {
  const { container } = renderWithProviders(<InvitePanel league={league(null)} />, { auth: authed });
  expect(container).toBeEmptyDOMElement();
});

test("shows Generate when there is no invite yet, and clicking it calls generateInvite", async () => {
  vi.spyOn(api, "getInvite").mockRejectedValue(new ApiError(404, "no_invite", "HTTP 404"));
  const gen = vi.spyOn(api, "generateInvite").mockResolvedValue({ token: "New", expiresAt: null });
  renderWithProviders(<InvitePanel league={league("creator")} />, { auth: authed });
  fireEvent.click(await screen.findByRole("button", { name: /generate invite link/i }));
  await waitFor(() => expect(gen).toHaveBeenCalledWith("L1"));
});

test("shows an inline error when the invite query fails (non-404)", async () => {
  vi.spyOn(api, "getInvite").mockRejectedValue(new ApiError(500, null, "HTTP 500"));
  renderWithProviders(<InvitePanel league={league("creator")} />, { auth: authed });
  expect(await screen.findByText(/couldn't load the invite link/i)).toBeInTheDocument();
});

test("copy writes the invite URL to the clipboard", async () => {
  const writeText = vi.fn(() => Promise.resolve());
  Object.assign(navigator, { clipboard: { writeText } });
  vi.spyOn(api, "getInvite").mockResolvedValue({ token: "Xy", expiresAt: null });
  renderWithProviders(<InvitePanel league={league("creator")} />, { auth: authed });
  fireEvent.click(await screen.findByRole("button", { name: /copy link/i }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/invite/Xy")));
});

test("shows the invite URL with copy + regenerate when an invite exists", async () => {
  vi.spyOn(api, "getInvite").mockResolvedValue({ token: "Xy", expiresAt: null });
  renderWithProviders(<InvitePanel league={league("creator")} />, { auth: authed });
  expect(await screen.findByText(/\/invite\/Xy$/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /regenerate/i })).toBeInTheDocument();
});

test("regenerate confirms then calls generateInvite", async () => {
  vi.spyOn(api, "getInvite").mockResolvedValue({ token: "Xy", expiresAt: null });
  const gen = vi.spyOn(api, "generateInvite").mockResolvedValue({ token: "Zz", expiresAt: null });
  renderWithProviders(<InvitePanel league={league("creator")} />, { auth: authed });
  fireEvent.click(await screen.findByRole("button", { name: /regenerate/i }));
  const dialog = screen.getByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: /regenerate/i }));
  await waitFor(() => expect(gen).toHaveBeenCalledWith("L1"));
});

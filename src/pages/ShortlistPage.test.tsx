import { screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser, ShortlistItem } from "../api/types";
import ShortlistPage from "./ShortlistPage";
import { renderWithProviders } from "../test/renderWithQuery";

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

test("renders the shortlisted players and the count header", async () => {
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [item({})], count: 1, max: 20 });
  renderWithProviders(<ShortlistPage />, { auth: authed });
  expect(await screen.findByRole("link", { name: "Aron Pálmarsson" })).toHaveAttribute("href", "/players/p1");
  expect(screen.getByText("Stjarnan")).toBeInTheDocument();
  expect(screen.getByText("VS")).toBeInTheDocument();
  expect(screen.getByText("1 / 20")).toBeInTheDocument();
});

test("shows the empty state when the shortlist is empty", async () => {
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 0, max: 20 });
  renderWithProviders(<ShortlistPage />, { auth: authed });
  expect(await screen.findByText(/No players yet/i)).toBeInTheDocument();
});

test("shows an error view when the shortlist request fails", async () => {
  vi.spyOn(api, "getShortlist").mockRejectedValue(new Error("boom"));
  renderWithProviders(<ShortlistPage />, { auth: authed });
  expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
});

test("removing a player calls the remove endpoint", async () => {
  vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [item({})], count: 1, max: 20 });
  const remove = vi.spyOn(api, "removeFromShortlist").mockResolvedValue(undefined);
  renderWithProviders(<ShortlistPage />, { auth: authed });
  const star = await screen.findByRole("button", { name: /remove from shortlist/i });
  fireEvent.click(star);
  await waitFor(() => expect(remove).toHaveBeenCalledWith("p1"));
});

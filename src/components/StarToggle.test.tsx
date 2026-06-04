import { screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser } from "../api/types";
import { StarToggle } from "./StarToggle";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

const user: AuthUser = {
  id: "u1", email: "a@b.is", displayName: "Jon", language: "is",
  favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
};
const authed = { status: "authenticated" as const, user };

function mockShortlist(over: Partial<{ ids: string[]; count: number; max: number }> = {}) {
  const ids = over.ids ?? [];
  return vi.spyOn(api, "getShortlist").mockResolvedValue({
    items: ids.map((playerId) => ({
      playerId, name: null, clubId: null, clubName: null, position: null,
      gender: null, price: null, pickPercentage: null, createdAt: "",
    })),
    count: over.count ?? ids.length,
    max: over.max ?? 20,
  });
}

test("renders nothing for anonymous users", () => {
  renderWithProviders(<StarToggle playerId="p1" />, { auth: { status: "anonymous" } });
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("shows a filled star when the player is on the shortlist", async () => {
  mockShortlist({ ids: ["p1"] });
  renderWithProviders(<StarToggle playerId="p1" />, { auth: authed });
  const btn = await screen.findByRole("button");
  expect(btn).toHaveAttribute("aria-pressed", "true");
  expect(btn).toHaveTextContent("★");
});

test("shows an empty star when the player is not on the shortlist", async () => {
  mockShortlist({ ids: ["other"] });
  renderWithProviders(<StarToggle playerId="p1" />, { auth: authed });
  const btn = await screen.findByRole("button");
  expect(btn).toHaveAttribute("aria-pressed", "false");
  expect(btn).toHaveTextContent("☆");
});

test("disables the star with a tooltip when the list is full", async () => {
  mockShortlist({ ids: ["a", "b"], count: 2, max: 2 });
  renderWithProviders(<StarToggle playerId="p1" />, { auth: authed });
  const btn = await screen.findByRole("button");
  expect(btn).toBeDisabled();
  expect(btn).toHaveAttribute("title", expect.stringContaining("Shortlist full"));
});

test("clicking an empty star adds the player and flips to filled", async () => {
  // sequenced: empty initially, then the player after the post-mutation refetch
  vi.spyOn(api, "getShortlist")
    .mockResolvedValueOnce({ items: [], count: 0, max: 20 })
    .mockResolvedValue({
      items: [{ playerId: "p1", name: null, clubId: null, clubName: null, position: null, gender: null, price: null, pickPercentage: null, createdAt: "" }],
      count: 1, max: 20,
    });
  const add = vi.spyOn(api, "addToShortlist").mockResolvedValue(undefined);
  renderWithProviders(<StarToggle playerId="p1" />, { auth: authed });
  const btn = await screen.findByRole("button");
  expect(btn).toHaveTextContent("☆");
  fireEvent.click(btn);
  expect(await screen.findByText("★")).toBeInTheDocument(); // optimistic flip, confirmed by refetch
  await waitFor(() => expect(add).toHaveBeenCalledWith("p1"));
});

test("clicking a filled star removes the player", async () => {
  mockShortlist({ ids: ["p1"] });
  const remove = vi.spyOn(api, "removeFromShortlist").mockResolvedValue(undefined);
  renderWithProviders(<StarToggle playerId="p1" />, { auth: authed });
  const btn = await screen.findByRole("button");
  fireEvent.click(btn);
  await waitFor(() => expect(remove).toHaveBeenCalledWith("p1"));
});

test("a failed add leaves the star empty (rollback)", async () => {
  const { ApiError } = await import("../api/client");
  mockShortlist({ ids: [] }); // server stays empty across refetches
  vi.spyOn(api, "addToShortlist").mockRejectedValue(new ApiError(409, "shortlist_full", "x"));
  renderWithProviders(<StarToggle playerId="p1" />, { auth: authed });
  const btn = await screen.findByRole("button");
  fireEvent.click(btn);
  // optimistic flip to ★ is rolled back on error; it must not stick as a member
  await waitFor(() => expect(btn).toHaveAttribute("aria-pressed", "false"));
});

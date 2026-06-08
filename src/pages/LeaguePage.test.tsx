import { screen, fireEvent, waitFor } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser } from "../api/types";
import { ApiError } from "../api/client";
import LeaguePage from "./LeaguePage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());
const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };

function render(id = "abc") {
  return renderWithProviders(
    <Routes><Route path="/leagues/:id" element={<LeaguePage />} /></Routes>,
    { initialEntries: [`/leagues/${id}`], auth: authed },
  );
}

test("renders the league with the current user marked '(you)'", async () => {
  vi.spyOn(api, "getMiniLeague").mockResolvedValue({
    id: "abc", name: "Office Olís", season: "2025-26", creatorUserId: "u1", memberCount: 2, role: "creator", createdAt: "2026-06-08T00:00:00Z",
    members: [
      { userId: "u1", role: "creator", joinedAt: "2026-06-08T00:00:00Z" },
      { userId: "u2longid", role: "member", joinedAt: "2026-06-08T00:00:00Z" },
    ],
  });
  render();
  expect(await screen.findByText("Office Olís")).toBeInTheDocument();
  expect(screen.getByText("Jon (you)")).toBeInTheDocument();
  expect(screen.getByText(/Member u2longid/)).toBeInTheDocument();
  expect(screen.getByText("You · creator")).toBeInTheDocument();
});

test("maps 404 to a not-found message", async () => {
  vi.spyOn(api, "getMiniLeague").mockRejectedValue(new ApiError(404, "league_not_found", "HTTP 404"));
  render();
  expect(await screen.findByText("League not found")).toBeInTheDocument();
});

test("copy-link writes the league permalink to the clipboard", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText } });
  vi.spyOn(api, "getMiniLeague").mockResolvedValue({
    id: "abc", name: "Office", season: "2025-26", creatorUserId: "u1", memberCount: 1, role: "creator", createdAt: "", members: [{ userId: "u1", role: "creator", joinedAt: "" }],
  });
  render();
  fireEvent.click(await screen.findByRole("button", { name: /copy link/i }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/leagues/abc")));
});

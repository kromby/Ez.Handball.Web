import { screen, fireEvent, waitFor } from "@testing-library/react";
import { Route, Routes, useParams } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser } from "../api/types";
import { ApiError } from "../api/client";
import LeaguesPage from "./LeaguesPage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());
const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };

function LeagueProbe() {
  const { id } = useParams();
  return <div>league-page {id}</div>;
}
function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/leagues" element={<LeaguesPage />} />
      <Route path="/leagues/:id" element={<LeagueProbe />} />
    </Routes>,
    { initialEntries: ["/leagues"], auth: authed },
  );
}

test("creating a league navigates to its detail page", async () => {
  vi.spyOn(api, "createMiniLeague").mockResolvedValue({ id: "abc", name: "Office", season: "2025-26", creatorUserId: "u1", memberCount: 1, role: "creator", createdAt: "", members: [] });
  renderPage();
  fireEvent.change(screen.getByLabelText("League name"), { target: { value: "Office" } });
  fireEvent.click(screen.getByRole("button", { name: /create league/i }));
  await waitFor(() => expect(api.createMiniLeague).toHaveBeenCalledWith("Office"));
  expect(await screen.findByText(/league-page abc/)).toBeInTheDocument();
});

test("blocks creating with a blank name", () => {
  const spy = vi.spyOn(api, "createMiniLeague");
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: /create league/i }));
  expect(spy).not.toHaveBeenCalled();
  expect(screen.getByText("1–60 characters.")).toBeInTheDocument();
});

test("shows the season message on no_current_season", async () => {
  vi.spyOn(api, "createMiniLeague").mockRejectedValue(new ApiError(409, "no_current_season", "HTTP 409"));
  renderPage();
  fireEvent.change(screen.getByLabelText("League name"), { target: { value: "Office" } });
  fireEvent.click(screen.getByRole("button", { name: /create league/i }));
  expect(await screen.findByText(/no active season yet/i)).toBeInTheDocument();
});

import { screen, fireEvent } from "@testing-library/react";
import { Route, Routes, useParams } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser } from "../api/types";
import { ApiError } from "../api/client";
import JoinPage from "./JoinPage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());
const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, createdAt: "", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };

function LeagueProbe() {
  const { id } = useParams();
  return <div>league-page {id}</div>;
}
function render(token = "tok1") {
  return renderWithProviders(
    <Routes>
      <Route path="/invite/:token" element={<JoinPage />} />
      <Route path="/leagues/:id" element={<LeagueProbe />} />
    </Routes>,
    { initialEntries: [`/invite/${token}`], auth: authed },
  );
}

test("previews the league and joins, navigating to the league", async () => {
  vi.spyOn(api, "previewInvite").mockResolvedValue({ leagueId: "L1", name: "Office Olís", season: "2025-26", memberCount: 7 });
  vi.spyOn(api, "joinMiniLeague").mockResolvedValue({ id: "L1", name: "Office Olís", season: "2025-26", creatorUserId: "u9", memberCount: 8, role: "member", createdAt: "", members: [] });
  render();
  expect(await screen.findByText("Office Olís")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /join league/i }));
  expect(await screen.findByText(/league-page L1/)).toBeInTheDocument();
});

test("shows an invalid message on 404", async () => {
  vi.spyOn(api, "previewInvite").mockRejectedValue(new ApiError(404, "invalid_invite", "HTTP 404"));
  render();
  expect(await screen.findByText(/isn't valid/i)).toBeInTheDocument();
});

test("shows an expired message on 410", async () => {
  vi.spyOn(api, "previewInvite").mockRejectedValue(new ApiError(410, "invite_expired", "HTTP 410"));
  render();
  expect(await screen.findByText(/has expired/i)).toBeInTheDocument();
});

test("shows a generic join error when joining fails non-404/410", async () => {
  vi.spyOn(api, "previewInvite").mockResolvedValue({ leagueId: "L1", name: "Office", season: "2025-26", memberCount: 3 });
  vi.spyOn(api, "joinMiniLeague").mockRejectedValue(new ApiError(500, null, "HTTP 500"));
  render();
  fireEvent.click(await screen.findByRole("button", { name: /join league/i }));
  expect(await screen.findByText(/couldn't join/i)).toBeInTheDocument();
});

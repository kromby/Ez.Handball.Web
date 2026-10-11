import { screen, fireEvent, waitFor } from "@testing-library/react";
import { Route, Routes, useParams } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser, Gameweek } from "../api/types";
import { ApiError } from "../api/client";
import LeaguesPage from "./LeaguesPage";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());
const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, isAdmin: false, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };

const gw = (number: number, roundLabel: string): Gameweek =>
  ({ number, roundLabel, tournamentId: "9142", deadline: "2026-09-01T18:00:00Z", status: "Settled", matches: [] });

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

test("shows the leagues you're a member of", async () => {
  vi.spyOn(api, "getMyMiniLeagues").mockResolvedValue([
    { id: "lg-1", name: "Klettódeildin", season: "2026-27", role: "creator", memberCount: 3 },
  ]);
  renderPage();
  expect(await screen.findByText("Klettódeildin")).toBeInTheDocument();
  expect(screen.getByText(/2026-27/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Klettódeildin" })).toHaveAttribute("href", "/leagues/lg-1");
});

test("shows a message when you're not in any leagues yet", async () => {
  vi.spyOn(api, "getMyMiniLeagues").mockResolvedValue([]);
  renderPage();
  expect(await screen.findByText(/haven't joined/i)).toBeInTheDocument();
});

test("creating a league navigates to its detail page", async () => {
  vi.spyOn(api, "getMyMiniLeagues").mockResolvedValue([]);
  vi.spyOn(api, "createMiniLeague").mockResolvedValue({ id: "abc", name: "Office", season: "2025-26", creatorUserId: "u1", memberCount: 1, role: "creator", createdAt: "", members: [] });
  renderPage();
  fireEvent.change(screen.getByLabelText("League name"), { target: { value: "Office" } });
  fireEvent.click(screen.getByRole("button", { name: /create league/i }));
  await waitFor(() => expect(api.createMiniLeague).toHaveBeenCalledWith("Office", undefined));
  expect(await screen.findByText(/league-page abc/)).toBeInTheDocument();
});

test("start round defaults to the first gameweek", async () => {
  vi.spyOn(api, "getMyMiniLeagues").mockResolvedValue([]);
  vi.spyOn(api, "getGameweeks").mockResolvedValue([gw(2, "2"), gw(1, "1"), gw(3, "3")]);
  vi.spyOn(api, "createMiniLeague").mockResolvedValue({ id: "abc", name: "Office", season: "2025-26", creatorUserId: "u1", memberCount: 1, role: "creator", createdAt: "", members: [] });
  renderPage();
  const select = await screen.findByLabelText("Count points from");
  expect(select).toHaveValue("1");
  expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Round 1", "Round 2", "Round 3"]);
  fireEvent.change(screen.getByLabelText("League name"), { target: { value: "Office" } });
  fireEvent.click(screen.getByRole("button", { name: /create league/i }));
  await waitFor(() => expect(api.createMiniLeague).toHaveBeenCalledWith("Office", "1"));
});

test("creating a league sends the picked start round", async () => {
  vi.spyOn(api, "getMyMiniLeagues").mockResolvedValue([]);
  vi.spyOn(api, "getGameweeks").mockResolvedValue([gw(1, "1"), gw(6, "6")]);
  vi.spyOn(api, "createMiniLeague").mockResolvedValue({ id: "abc", name: "Office", season: "2025-26", creatorUserId: "u1", memberCount: 1, role: "creator", createdAt: "", members: [] });
  renderPage();
  fireEvent.change(await screen.findByLabelText("Count points from"), { target: { value: "6" } });
  fireEvent.change(screen.getByLabelText("League name"), { target: { value: "Office" } });
  fireEvent.click(screen.getByRole("button", { name: /create league/i }));
  await waitFor(() => expect(api.createMiniLeague).toHaveBeenCalledWith("Office", "6"));
});

test("hides the start round picker when the gameweek calendar is unavailable", async () => {
  vi.spyOn(api, "getMyMiniLeagues").mockResolvedValue([]);
  vi.spyOn(api, "getGameweeks").mockRejectedValue(new ApiError(404, "not_found", "HTTP 404"));
  renderPage();
  expect(await screen.findByLabelText("League name")).toBeInTheDocument();
  expect(screen.queryByLabelText("Count points from")).not.toBeInTheDocument();
});

test("blocks creating with a blank name", () => {
  vi.spyOn(api, "getMyMiniLeagues").mockResolvedValue([]);
  const spy = vi.spyOn(api, "createMiniLeague");
  renderPage();
  fireEvent.click(screen.getByRole("button", { name: /create league/i }));
  expect(spy).not.toHaveBeenCalled();
  expect(screen.getByText("1–60 characters.")).toBeInTheDocument();
});

test("shows the season message on no_current_season", async () => {
  vi.spyOn(api, "getMyMiniLeagues").mockResolvedValue([]);
  vi.spyOn(api, "createMiniLeague").mockRejectedValue(new ApiError(409, "no_current_season", "HTTP 409"));
  renderPage();
  fireEvent.change(screen.getByLabelText("League name"), { target: { value: "Office" } });
  fireEvent.click(screen.getByRole("button", { name: /create league/i }));
  expect(await screen.findByText(/no active season yet/i)).toBeInTheDocument();
});

import { screen, within } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import ClubPage from "./ClubPage";
import { renderWithProviders } from "../test/renderWithQuery";
import { ApiError } from "../api/client";
import type { ClubRosterPlayer } from "../api/types";

afterEach(() => vi.restoreAllMocks());

function setup() {
  return renderWithProviders(
    <Routes>
      <Route path="/clubs/:id" element={<ClubPage />} />
      <Route path="/players/:playerId" element={<div>player page</div>} />
    </Routes>,
    { initialEntries: ["/clubs/c1"] },
  );
}

function rosterPlayer(overrides: Partial<ClubRosterPlayer>): ClubRosterPlayer {
  return {
    rank: 1, playerId: "p", name: "Player", clubId: "c1", clubName: "Valur",
    gender: "karlar", position: "CB", positionSecondary: null, games: 3, goals: 0, yellowCards: 0,
    twoMinuteSuspensions: 0, redCards: 0, avgGoals: 0,
    price: { amount: 5_000_000, currency: "ISK" }, rating: 0, pickPercentage: null,
    assists: 0, steals: 0, blocks: 0, saves: 0, turnovers: 0, legalStops: 0, shots: 0,
    expectedGoals: 0, shotsFaced: 0, savePct: null, expectedSaves: 0,
    gradeTotal: null, gradeOffense: null, gradeDefense: null, gradeGoalkeeping: null,
    jerseyNumber: null, age: null,
    ...overrides,
  };
}

test("renders club name and roster rows in server order with player stats", async () => {
  vi.spyOn(api, "getClub").mockResolvedValue({
    clubId: "c1",
    name: "Valur",
    logoUrl: "https://example.test/valur.png",
    venue: null,
    foundedYear: null,
  });
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1",
    season: "2025-2026",
    players: [
      rosterPlayer({
        playerId: "p7", name: "Jón Jónsson", jerseyNumber: "7", position: "RB", age: 24,
        games: 3, goals: 21, avgGoals: 7, rating: 64, price: { amount: 12_000_000, currency: "ISK" },
      }),
      rosterPlayer({ playerId: "p9", name: "Geir Geirsson", jerseyNumber: null, position: "Leikmaður", age: null }),
    ],
  });

  setup();

  expect(await screen.findByRole("heading", { name: "Valur" })).toBeInTheDocument();
  // Decorative logo (alt="") is excluded from the a11y tree, so assert via the DOM.
  expect(document.querySelector("img.club-logo")).toHaveAttribute("src", "https://example.test/valur.png");

  const rows = await screen.findAllByRole("row");
  const first = within(rows[1]);
  expect(first.getByRole("link", { name: "Jón Jónsson" })).toHaveAttribute("href", "/players/p7");
  expect(first.getByText("7")).toBeInTheDocument();       // jersey
  expect(first.getByText("Right back")).toBeInTheDocument(); // position label
  expect(first.getByText("24")).toBeInTheDocument();      // age
  expect(first.getByText("21")).toBeInTheDocument();      // goals
  expect(first.getByText("7.00")).toBeInTheDocument();    // avgGoals
  expect(first.getByText("64")).toBeInTheDocument();      // rating
  expect(first.getByText(/12M ISK/)).toBeInTheDocument(); // price

  const second = within(rows[2]);
  expect(second.getByRole("link", { name: "Geir Geirsson" })).toHaveAttribute("href", "/players/p9");
  expect(second.getAllByText("—").length).toBeGreaterThan(0); // missing age
});

test("renders an empty state when the club has no players", async () => {
  vi.spyOn(api, "getClub").mockResolvedValue({
    clubId: "c1", name: "Valur", logoUrl: null, venue: null, foundedYear: null,
  });
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1", season: "2025-2026", players: [],
  });

  setup();

  expect(await screen.findByText("No players on the current roster.")).toBeInTheDocument();
});

test("renders a not-found state when the club is unknown (404)", async () => {
  vi.spyOn(api, "getClub").mockRejectedValue(new ApiError(404, "club_not_found", "not found"));
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1", season: null, players: [],
  });

  setup();

  expect(await screen.findByText("Club not found")).toBeInTheDocument();
});

test("renders no logo and no subtitle when logo, venue, and founded year are all null", async () => {
  vi.spyOn(api, "getClub").mockResolvedValue({
    clubId: "c1", name: "Valur", logoUrl: null, venue: null, foundedYear: null,
  });
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1", season: "2025-2026", players: [],
  });

  setup();

  await screen.findByRole("heading", { name: "Valur" });
  // No logo image when logoUrl is null (assert via DOM — the img is decorative).
  expect(document.querySelector("img.club-logo")).toBeNull();
  // No subtitle is rendered when venue and foundedYear are both null.
  expect(screen.queryByText(/·/)).not.toBeInTheDocument();
});

function mockClubAndRoster() {
  vi.spyOn(api, "getClub").mockResolvedValue({
    clubId: "c1", name: "Valur", logoUrl: null, venue: null, foundedYear: null,
  });
  vi.spyOn(api, "getClubRoster").mockResolvedValue({
    clubId: "c1", season: "2025-2026", players: [],
  });
}

const upcomingMatch = {
  matchId: "m-up", tournamentId: "8444", tournamentName: "Olís deild karla", round: "13",
  date: "2026-03-21T17:00:00Z", venue: "Höllin", status: "upcoming" as const, isHome: true,
  opponentClubId: "c2", opponentName: "Haukar", opponentLogoUrl: null,
  clubScore: null, opponentScore: null,
};
const playedMatch = {
  matchId: "m-pl", tournamentId: "8444", tournamentName: "Olís deild karla", round: "12",
  date: "2026-03-14T17:00:00Z", venue: "Höllin", status: "played" as const, isHome: false,
  opponentClubId: "c3", opponentName: "KA", opponentLogoUrl: null,
  clubScore: 30, opponentScore: 26,
};

test("renders Upcoming above Results above Roster", async () => {
  mockClubAndRoster();
  vi.spyOn(api, "getClubMatches").mockImplementation((_, status) =>
    Promise.resolve({
      clubId: "c1", season: "2025-2026",
      matches: status === "upcoming" ? [upcomingMatch] : [playedMatch],
    }),
  );

  setup();

  const headings = await screen.findAllByRole("heading", { level: 2 });
  const titles = headings.map((h) => h.textContent);
  expect(titles).toEqual(["Upcoming", "Results", "Roster"]);
});

test("shows the played match score and links the opponent", async () => {
  mockClubAndRoster();
  vi.spyOn(api, "getClubMatches").mockImplementation((_, status) =>
    Promise.resolve({
      clubId: "c1", season: "2025-2026",
      matches: status === "played" ? [playedMatch] : [],
    }),
  );

  setup();

  expect(await screen.findByText("30–26")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "KA" })).toHaveAttribute("href", "/clubs/c3");
});

test("shows per-section empty states independently", async () => {
  mockClubAndRoster();
  vi.spyOn(api, "getClubMatches").mockImplementation((_, status) =>
    Promise.resolve({
      clubId: "c1", season: "2025-2026",
      matches: status === "upcoming" ? [upcomingMatch] : [],
    }),
  );

  setup();

  expect(await screen.findByRole("link", { name: "Haukar" })).toBeInTheDocument();
  expect(screen.getByText("No results yet.")).toBeInTheDocument();
});

test("shows an error state for a failed matches section", async () => {
  mockClubAndRoster();
  vi.spyOn(api, "getClubMatches").mockRejectedValue(new ApiError(500, "boom", "server error"));

  setup();

  expect(await screen.findAllByText("Something went wrong. Please try again.")).not.toHaveLength(0);
});

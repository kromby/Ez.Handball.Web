import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import * as api from "../../api/endpoints";
import type { AuthUser } from "../../api/types";
import type { ClubMatch, ClubMatchListing, MyGameweeks, SquadPlayer } from "../../api/types";
import { renderWithProviders } from "../../test/renderWithQuery";
import { ToastProvider } from "../Toast";
import { SelectedPlayerPanel } from "./SelectedPlayerPanel";

// useToast() is lenient (returns NOOP outside ToastProvider), but SellButton.test.tsx
// wraps in ToastProvider for correctness. We do the same here.

const player = {
  playerId: "p-1",
  name: "Dahl",
  clubId: "c1",
  clubName: "Catalunya BM",
  position: "CB",
  gender: "karlar",
  price: { amount: 10_500_000, currency: "ISK" },
  pricePaid: { amount: 9_500_000, currency: "ISK" },
  rating: 84,
} satisfies SquadPlayer;

const authenticatedUser = {
  id: "u-1",
  email: "a@b.is",
  displayName: "Aron",
  language: "is",
  favoriteClubId: "385",
  teamName: "Aron's Aces",
  emailVerified: true,
  isAdmin: false,
  createdAt: "2026-01-01T00:00:00Z",
  lastLoginAt: null,
} satisfies AuthUser;

function emptyListing(clubId: string): ClubMatchListing {
  return { clubId, season: null, matches: [] };
}

function match(overrides: Partial<ClubMatch> = {}): ClubMatch {
  return {
    matchId: "m-1",
    tournamentId: "t-1",
    tournamentName: "Olís deildin",
    round: "5",
    date: "2026-09-27T18:00:00Z",
    venue: null,
    status: "played",
    isHome: true,
    opponentClubId: "c2",
    opponentName: "Valur",
    opponentLogoUrl: "https://example.test/valur.png",
    clubScore: 28,
    opponentScore: 24,
    ...overrides,
  };
}

const noGameweeks: MyGameweeks = { runningTotal: 0, gameweeks: [] };

beforeEach(() => {
  vi.spyOn(api, "getClub").mockResolvedValue({
    clubId: "c1",
    name: "Catalunya BM",
    logoUrl: null,
    venue: null,
    foundedYear: null,
  });
  vi.spyOn(api, "getClubMatches").mockImplementation((id) => Promise.resolve(emptyListing(id)));
  vi.spyOn(api, "getMyGameweeks").mockResolvedValue(noGameweeks);
});

afterEach(() => vi.restoreAllMocks());

function renderPanel(selected: SquadPlayer | null = player) {
  return renderWithProviders(
    <ToastProvider>
      <SelectedPlayerPanel player={selected} />
    </ToastProvider>,
    { auth: { status: "authenticated", user: authenticatedUser } },
  );
}

test("no player shows tap-prompt", () => {
  renderPanel(null);
  expect(screen.getByText("tap a player to see their card")).toBeInTheDocument();
});

test("player shows name, rating, club, and profile link", () => {
  renderPanel();
  expect(screen.getByText("Dahl")).toBeInTheDocument();
  expect(screen.getByText("84")).toBeInTheDocument();
  expect(screen.getByText(/Catalunya BM/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute(
    "href",
    "/players/p-1",
  );
});

test("price > pricePaid renders drift-up", () => {
  renderPanel();
  const drift = screen.getByTestId("drift");
  expect(drift.className).toMatch(/drift-up/);
});

test("null price hides the drift element", () => {
  renderPanel({ ...player, price: null });
  expect(screen.queryByTestId("drift")).not.toBeInTheDocument();
});

test("shows the club crest in place of the ball icon when the club has a logo", async () => {
  vi.spyOn(api, "getClub").mockResolvedValue({
    clubId: "c1",
    name: "Catalunya BM",
    logoUrl: "https://example.test/catalunya.png",
    venue: null,
    foundedYear: null,
  });
  renderPanel();
  // Decorative logo (alt="") is excluded from the a11y tree, so assert via the DOM.
  await waitFor(() => expect(document.querySelector("img.panel-crest")).not.toBeNull());
  expect(document.querySelector("img.panel-crest")).toHaveAttribute(
    "src",
    "https://example.test/catalunya.png",
  );
  expect(document.querySelector("svg.ball-avatar")).not.toBeInTheDocument();
});

test("falls back to the ball icon when the club has no logo", () => {
  renderPanel();
  expect(document.querySelector("svg.ball-avatar")).toBeInTheDocument();
  expect(document.querySelector("img.panel-crest")).not.toBeInTheDocument();
});

test("shows last round points and opponent when a gameweek is settled", async () => {
  vi.spyOn(api, "getClubMatches").mockImplementation((id, status) =>
    Promise.resolve({
      clubId: id,
      season: null,
      matches: status === "played" ? [match({ round: "5" })] : [],
    }),
  );
  vi.spyOn(api, "getMyGameweeks").mockResolvedValue({
    runningTotal: 12,
    gameweeks: [
      {
        roundLabel: "5",
        points: 12,
        captainPlayerId: null,
        breakdown: [
          { playerId: "p-1", rawPoints: 12, points: 12, played: true, autoSubbedIn: false, captainApplied: false, multiplier: 1 },
        ],
      },
    ],
  });
  renderPanel();
  expect(await screen.findByText(/12/)).toBeInTheDocument();
  expect(screen.getByText(/Valur/)).toBeInTheDocument();
});

test("hides the last-round row when no gameweek has settled yet", () => {
  renderPanel();
  expect(screen.queryByText(/Síðasta umferð|Last round/i)).not.toBeInTheDocument();
});

test("shows DNP when the player didn't play in the last settled round", async () => {
  vi.spyOn(api, "getMyGameweeks").mockResolvedValue({
    runningTotal: 0,
    gameweeks: [
      {
        roundLabel: "5",
        points: 0,
        captainPlayerId: null,
        breakdown: [
          { playerId: "p-1", rawPoints: 0, points: 0, played: false, autoSubbedIn: false, captainApplied: false, multiplier: 1 },
        ],
      },
    ],
  });
  renderPanel();
  expect(await screen.findByText("DNP")).toBeInTheDocument();
});

test("shows next opponent when the club has an upcoming fixture", async () => {
  vi.spyOn(api, "getClubMatches").mockImplementation((id, status) =>
    Promise.resolve({
      clubId: id,
      season: null,
      matches: status === "upcoming" ? [match({ status: "upcoming", opponentName: "ÍBV", clubScore: null, opponentScore: null })] : [],
    }),
  );
  renderPanel();
  expect(await screen.findByText(/ÍBV/)).toBeInTheDocument();
});

test("hides the next-match row when the club has no upcoming fixture", () => {
  renderPanel();
  expect(screen.queryByText(/Næsti leikur|Next match/i)).not.toBeInTheDocument();
});

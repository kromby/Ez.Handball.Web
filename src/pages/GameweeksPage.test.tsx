import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { CurrentGameweek, Gameweek, RoundListing } from "../api/types";
import { ApiError } from "../api/client";
import { renderWithProviders } from "../test/renderWithQuery";
import GameweeksPage from "./GameweeksPage";

afterEach(() => vi.restoreAllMocks());

function gw(number: number, status: Gameweek["status"]): Gameweek {
  return {
    number, roundLabel: String(number), tournamentId: "8444",
    deadline: "2099-06-20T18:00:00Z", status, matches: [],
  };
}

function rounds(): RoundListing {
  return {
    tournamentId: "8444", tournamentName: "Olís", season: "2025-26",
    rounds: [
      {
        round: "18", startDate: "2026-06-20", endDate: "2026-06-21",
        matches: [{
          matchId: "m1", played: false, date: "2026-06-20T16:00:00Z", venue: null,
          home: { teamId: "h", clubId: "h", name: "Valur", logoSrc: null, score: null },
          away: { teamId: "a", clubId: "a", name: "Haukar", logoSrc: null, score: null },
        }],
      },
    ],
  };
}

function setup() {
  return renderWithProviders(
    <Routes>
      <Route path="/gameweeks" element={<GameweeksPage />} />
    </Routes>,
    { initialEntries: ["/gameweeks"] },
  );
}

test("renders header, hero with fixtures, and the section labels", async () => {
  vi.spyOn(api, "getGameweeks").mockResolvedValue([gw(17, "Settled"), gw(18, "Open"), gw(19, "Open")]);
  vi.spyOn(api, "getCurrentGameweek").mockResolvedValue({ current: gw(18, "Open"), lastSettled: gw(17, "Settled") } satisfies CurrentGameweek);
  vi.spyOn(api, "getRounds").mockResolvedValue(rounds());

  setup();

  expect(await screen.findByText("Gameweek 18")).toBeInTheDocument();
  expect(screen.getByText("Valur")).toBeInTheDocument();
  expect(screen.getByText("Round 18 of 3")).toBeInTheDocument();
  expect(screen.getByText("Coming up")).toBeInTheDocument();
  expect(screen.getByText("Results")).toBeInTheDocument();
});

test("shows the not-configured empty state on gameweek_config_missing", async () => {
  vi.spyOn(api, "getGameweeks").mockRejectedValue(new ApiError(400, "gameweek_config_missing", "bad"));
  vi.spyOn(api, "getCurrentGameweek").mockRejectedValue(new ApiError(400, "gameweek_config_missing", "bad"));

  setup();

  expect(await screen.findByText("Gameweeks aren't set up yet")).toBeInTheDocument();
});

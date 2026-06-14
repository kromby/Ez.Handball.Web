import { screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../../api/endpoints";
import type { CurrentGameweek } from "../../api/types";
import { renderWithProviders } from "../../test/renderWithQuery";
import { CurrentGameweekStrip } from "./CurrentGameweekStrip";

afterEach(() => vi.restoreAllMocks());

function current(): CurrentGameweek {
  return {
    current: {
      number: 18,
      roundLabel: "18",
      tournamentId: "8444",
      deadline: "2099-06-20T18:00:00Z",
      status: "Open",
      matches: [
        { matchId: "a", date: "2099-06-20T18:00:00Z", isFinal: false, homeTeamId: "1-karlar", awayTeamId: "2-karlar" },
        { matchId: "b", date: "2099-06-21T14:00:00Z", isFinal: false, homeTeamId: "3-karlar", awayTeamId: "4-karlar" },
      ],
    },
    lastSettled: null,
  };
}

test("renders round label, status, match count and a countdown", async () => {
  vi.spyOn(api, "getCurrentGameweek").mockResolvedValue(current());
  renderWithProviders(<CurrentGameweekStrip />);
  expect(await screen.findByText("Umferð 18")).toBeInTheDocument();
  expect(screen.getByText("Open")).toBeInTheDocument();
  expect(screen.getByText(/2 matches/)).toBeInTheDocument();
});

test("renders nothing when there is no current gameweek", async () => {
  vi.spyOn(api, "getCurrentGameweek").mockResolvedValue({ current: null, lastSettled: null });
  const { container } = renderWithProviders(<CurrentGameweekStrip />);
  await waitFor(() => expect(api.getCurrentGameweek).toHaveBeenCalled());
  expect(container.querySelector(".gw-strip")).toBeNull();
});

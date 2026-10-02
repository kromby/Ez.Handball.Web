import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../../api/endpoints";
import { ApiError } from "../../api/client";
import type { AdminGameStatus } from "../../api/types";
import { GameStatusCell } from "./GameStatusCell";
import { renderWithProviders } from "../../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

function game(overrides: Partial<AdminGameStatus> = {}): AdminGameStatus {
  return {
    matchId: "111453", date: "2026-09-25T19:30:00Z", venue: "N1 höllin", homeTeamName: "Valur", awayTeamName: "KA",
    status: "upcoming", ingested: true, hbStatzIngested: false, hsiStatus: "U", finalOverride: false, ...overrides,
  };
}

test("a final game shows Played with no override action", () => {
  renderWithProviders(<GameStatusCell game={game({ status: "played", hsiStatus: "S" })} />);
  expect(screen.getByText("Played")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("a future game shows Upcoming with no override action", () => {
  renderWithProviders(<GameStatusCell game={game({ date: "2999-01-01T00:00:00Z", hsiStatus: "" })} />);
  expect(screen.getByText("Upcoming")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("a played game hsi.is never finalised shows its code and can be marked final", async () => {
  vi.spyOn(api, "setMatchFinalOverride").mockResolvedValue();
  renderWithProviders(<GameStatusCell game={game()} />);

  expect(screen.getByText("Not final (U)")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Mark final" }));

  await waitFor(() => expect(api.setMatchFinalOverride).toHaveBeenCalledWith("111453", true));
});

test("an overridden game shows the override and can be undone", async () => {
  vi.spyOn(api, "setMatchFinalOverride").mockResolvedValue();
  renderWithProviders(<GameStatusCell game={game({ finalOverride: true })} />);

  expect(screen.getByText("Final (override)")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Undo" }));

  await waitFor(() => expect(api.setMatchFinalOverride).toHaveBeenCalledWith("111453", false));
});

test("reports a failed update", async () => {
  vi.spyOn(api, "setMatchFinalOverride").mockRejectedValue(new ApiError(500, "internal", "HTTP 500"));
  renderWithProviders(<GameStatusCell game={game()} />);

  await userEvent.click(screen.getByRole("button", { name: "Mark final" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't update. Please try again.");
});

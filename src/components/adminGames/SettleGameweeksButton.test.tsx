import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../../api/endpoints";
import { ApiError } from "../../api/client";
import type { AdminSettleGameweeksResult } from "../../api/types";
import { SettleGameweeksButton } from "./SettleGameweeksButton";
import { renderWithProviders } from "../../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

test("settles and reports each round", async () => {
  vi.spyOn(api, "settleAdminGameweeks").mockResolvedValue({
    rounds: [
      { round: "1", teamsConsidered: 12, settled: 11, notReady: 0, skipped: 1 },
      { round: "2", teamsConsidered: 12, settled: 12, notReady: 0, skipped: 0 },
    ],
  });
  renderWithProviders(<SettleGameweeksButton />);

  await userEvent.click(screen.getByRole("button", { name: "Settle gameweeks" }));

  expect(await screen.findByText("Round 1: 11 of 12 team(s) settled, 0 not ready, 1 skipped.")).toBeInTheDocument();
  expect(screen.getByText("Round 2: 12 of 12 team(s) settled, 0 not ready, 0 skipped.")).toBeInTheDocument();
  expect(api.settleAdminGameweeks).toHaveBeenCalledTimes(1);
});

test("says so when there is nothing to settle", async () => {
  vi.spyOn(api, "settleAdminGameweeks").mockResolvedValue({ rounds: [] });
  renderWithProviders(<SettleGameweeksButton />);

  await userEvent.click(screen.getByRole("button", { name: "Settle gameweeks" }));

  expect(await screen.findByText("No completed gameweeks to settle yet.")).toBeInTheDocument();
});

test("explains a missing gameweek config", async () => {
  vi.spyOn(api, "settleAdminGameweeks").mockRejectedValue(new ApiError(400, "gameweek_config_missing", "HTTP 400"));
  renderWithProviders(<SettleGameweeksButton />);

  await userEvent.click(screen.getByRole("button", { name: "Settle gameweeks" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Gameweek config is missing — seed it first.");
});

test("shows a generic error for anything else", async () => {
  vi.spyOn(api, "settleAdminGameweeks").mockRejectedValue(new ApiError(500, "internal", "HTTP 500"));
  renderWithProviders(<SettleGameweeksButton />);

  await userEvent.click(screen.getByRole("button", { name: "Settle gameweeks" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Settling failed. Please try again.");
});

test("disables the button while settling", async () => {
  let resolve!: (value: AdminSettleGameweeksResult) => void;
  vi.spyOn(api, "settleAdminGameweeks").mockReturnValue(new Promise((r) => { resolve = r; }));
  renderWithProviders(<SettleGameweeksButton />);

  await userEvent.click(screen.getByRole("button", { name: "Settle gameweeks" }));

  expect(screen.getByRole("button", { name: "Settling gameweeks…" })).toBeDisabled();
  resolve({ rounds: [] });
  await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
});

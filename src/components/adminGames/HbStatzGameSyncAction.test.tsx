import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../../api/endpoints";
import { ApiError } from "../../api/client";
import { HbStatzGameSyncAction } from "./HbStatzGameSyncAction";
import { renderWithProviders } from "../../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

test("triggers a sync scoped to this exact match", async () => {
  vi.spyOn(api, "triggerAdminHbStatzSync").mockResolvedValue({
    matchesChecked: 1, matchesSynced: 1, unmatched: [], failed: [],
  });
  renderWithProviders(<HbStatzGameSyncAction tournamentId="9142" matchId="103414" />);

  await userEvent.click(screen.getByRole("button", { name: "Sync" }));

  await waitFor(() =>
    expect(api.triggerAdminHbStatzSync).toHaveBeenCalledWith({ tournamentId: "9142", matchId: "103414" }));
});

test("disables the button and shows a syncing label while pending", async () => {
  let resolve!: (value: { matchesChecked: number; matchesSynced: number; unmatched: string[]; failed: string[] }) => void;
  vi.spyOn(api, "triggerAdminHbStatzSync").mockReturnValue(new Promise((r) => { resolve = r; }));
  renderWithProviders(<HbStatzGameSyncAction tournamentId="9142" matchId="103414" />);

  await userEvent.click(screen.getByRole("button", { name: "Sync" }));

  expect(screen.getByRole("button", { name: "Syncing HBStatz…" })).toBeDisabled();
  resolve({ matchesChecked: 1, matchesSynced: 1, unmatched: [], failed: [] });
  await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
});

test("switches to a retry label after a failed request", async () => {
  vi.spyOn(api, "triggerAdminHbStatzSync").mockRejectedValue(new ApiError(502, "ingestion_unreachable", "HTTP 502"));
  renderWithProviders(<HbStatzGameSyncAction tournamentId="9142" matchId="103414" />);

  await userEvent.click(screen.getByRole("button", { name: "Sync" }));

  expect(await screen.findByRole("button", { name: "Retry" })).toBeInTheDocument();
});

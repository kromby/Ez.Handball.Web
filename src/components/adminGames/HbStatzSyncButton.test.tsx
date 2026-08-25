import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../../api/endpoints";
import { ApiError } from "../../api/client";
import { HbStatzSyncButton } from "./HbStatzSyncButton";
import { renderWithProviders } from "../../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

test("triggers a sync and shows the resulting counts", async () => {
  vi.spyOn(api, "triggerAdminHbStatzSync").mockResolvedValue({
    matchesChecked: 5, matchesSynced: 5, unmatched: [], failed: [],
  });
  renderWithProviders(<HbStatzSyncButton />);

  await userEvent.click(screen.getByRole("button", { name: "Sync HBStatz" }));

  expect(await screen.findByText("Checked 5 match(es), synced 5.")).toBeInTheDocument();
  expect(api.triggerAdminHbStatzSync).toHaveBeenCalledWith({ tournamentId: undefined, round: undefined });
});

test("passes the tournamentId through when scoped to one tournament", async () => {
  vi.spyOn(api, "triggerAdminHbStatzSync").mockResolvedValue({
    matchesChecked: 1, matchesSynced: 1, unmatched: [], failed: [],
  });
  renderWithProviders(<HbStatzSyncButton tournamentId="9142" />);

  await userEvent.click(screen.getByRole("button", { name: "Sync HBStatz" }));

  await waitFor(() => expect(api.triggerAdminHbStatzSync).toHaveBeenCalledWith({ tournamentId: "9142", round: undefined }));
});

test("shows a round-specific label and passes the round through when scoped to a round", async () => {
  vi.spyOn(api, "triggerAdminHbStatzSync").mockResolvedValue({
    matchesChecked: 1, matchesSynced: 1, unmatched: [], failed: [],
  });
  renderWithProviders(<HbStatzSyncButton tournamentId="9142" round="3" />);

  await userEvent.click(screen.getByRole("button", { name: "Sync round 3" }));

  await waitFor(() =>
    expect(api.triggerAdminHbStatzSync).toHaveBeenCalledWith({ tournamentId: "9142", round: "3" }));
});

test("reports unmatched and failed counts", async () => {
  vi.spyOn(api, "triggerAdminHbStatzSync").mockResolvedValue({
    matchesChecked: 5, matchesSynced: 3, unmatched: ["999"], failed: ["888"],
  });
  renderWithProviders(<HbStatzSyncButton />);

  await userEvent.click(screen.getByRole("button", { name: "Sync HBStatz" }));

  expect(await screen.findByText("Checked 5 match(es), synced 3 — 1 unmatched, 1 failed.")).toBeInTheDocument();
});

test("shows a specific message when the ingestion service is unreachable", async () => {
  vi.spyOn(api, "triggerAdminHbStatzSync").mockRejectedValue(new ApiError(502, "ingestion_unreachable", "HTTP 502"));
  renderWithProviders(<HbStatzSyncButton />);

  await userEvent.click(screen.getByRole("button", { name: "Sync HBStatz" }));

  expect(await screen.findByText("Couldn't reach the ingestion service — is it running?")).toBeInTheDocument();
});

test("disables the button while the sync is pending", async () => {
  let resolve!: (value: { matchesChecked: number; matchesSynced: number; unmatched: string[]; failed: string[] }) => void;
  vi.spyOn(api, "triggerAdminHbStatzSync").mockReturnValue(new Promise((r) => { resolve = r; }));
  renderWithProviders(<HbStatzSyncButton />);

  await userEvent.click(screen.getByRole("button", { name: "Sync HBStatz" }));

  expect(screen.getByRole("button", { name: "Syncing HBStatz…" })).toBeDisabled();
  resolve({ matchesChecked: 0, matchesSynced: 0, unmatched: [], failed: [] });
  await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
});

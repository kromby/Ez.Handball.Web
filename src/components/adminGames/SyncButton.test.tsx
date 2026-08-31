import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../../api/endpoints";
import { ApiError } from "../../api/client";
import { SyncButton } from "./SyncButton";
import { renderWithProviders } from "../../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

test("triggers a sync and shows the resulting counts", async () => {
  vi.spyOn(api, "triggerAdminSync").mockResolvedValue({ synced: 6, failed: [] });
  renderWithProviders(<SyncButton />);

  await userEvent.click(screen.getByRole("button", { name: "Sync now" }));

  expect(await screen.findByText("Synced 6 tournament(s).")).toBeInTheDocument();
});

test("reports partial failures", async () => {
  vi.spyOn(api, "triggerAdminSync").mockResolvedValue({ synced: 5, failed: ["8437"] });
  renderWithProviders(<SyncButton />);

  await userEvent.click(screen.getByRole("button", { name: "Sync now" }));

  expect(await screen.findByText("Synced 5 tournament(s) — 1 failed.")).toBeInTheDocument();
});

test("shows a specific message when the ingestion service is unreachable", async () => {
  vi.spyOn(api, "triggerAdminSync").mockRejectedValue(new ApiError(502, "ingestion_unreachable", "HTTP 502"));
  renderWithProviders(<SyncButton />);

  await userEvent.click(screen.getByRole("button", { name: "Sync now" }));

  expect(await screen.findByText("Couldn't reach the ingestion service — is it running?")).toBeInTheDocument();
});

test("shows a generic error for any other failure", async () => {
  vi.spyOn(api, "triggerAdminSync").mockRejectedValue(new Error("boom"));
  renderWithProviders(<SyncButton />);

  await userEvent.click(screen.getByRole("button", { name: "Sync now" }));

  expect(await screen.findByText("Sync failed. Please try again.")).toBeInTheDocument();
});

test("disables the button while the sync is pending", async () => {
  let resolve!: (value: { synced: number; failed: string[] }) => void;
  vi.spyOn(api, "triggerAdminSync").mockReturnValue(new Promise((r) => { resolve = r; }));
  renderWithProviders(<SyncButton />);

  await userEvent.click(screen.getByRole("button", { name: "Sync now" }));

  expect(screen.getByRole("button", { name: "Syncing…" })).toBeDisabled();
  resolve({ synced: 1, failed: [] });
  await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
});

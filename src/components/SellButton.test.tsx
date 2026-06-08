import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser } from "../api/types";
import { SellButton } from "./SellButton";
import { ToastProvider } from "./Toast";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());
const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };

test("opens a confirm dialog and sells on confirm", async () => {
  const sell = vi.spyOn(api, "sellPlayer").mockResolvedValue({ flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 10, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } });
  renderWithProviders(
    <ToastProvider><SellButton player={{ playerId: "p1", name: "Vik" }} /></ToastProvider>,
    { auth: authed },
  );
  fireEvent.click(screen.getByRole("button", { name: /sell/i }));     // trigger (only one before open)
  const dialog = screen.getByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: /sell/i })); // confirm, scoped to dialog
  await waitFor(() => expect(sell).toHaveBeenCalledWith("p1", "fantasy"));
});

test("cancel closes the dialog without selling", async () => {
  const sell = vi.spyOn(api, "sellPlayer");
  renderWithProviders(<ToastProvider><SellButton player={{ playerId: "p1", name: "Vik" }} /></ToastProvider>, { auth: authed });
  fireEvent.click(screen.getByRole("button", { name: /sell/i }));
  fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(sell).not.toHaveBeenCalled();
});

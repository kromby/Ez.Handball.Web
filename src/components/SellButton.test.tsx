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
  const sell = vi.spyOn(api, "sellPlayer").mockResolvedValue({ squad: { flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 10, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } }, gameweek: { appliedToGameweek: 3, currentGameweekLocked: false } });
  renderWithProviders(
    <ToastProvider><SellButton player={{ playerId: "p1", name: "Vik" }} /></ToastProvider>,
    { auth: authed },
  );
  fireEvent.click(screen.getByRole("button", { name: /sell/i }));     // trigger (only one before open)
  const dialog = screen.getByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: /sell/i })); // confirm, scoped to dialog
  await waitFor(() => expect(sell).toHaveBeenCalledWith("p1", "fantasy"));
});

test("toasts a deferral notice when the gameweek locked between load and sell", async () => {
  // applied(4) != baseline(3) → the gameweek the user saw locked, so the sell deferred.
  vi.spyOn(api, "sellPlayer").mockResolvedValue({ squad: { flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 10, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } }, gameweek: { appliedToGameweek: 4, currentGameweekLocked: false } });
  vi.spyOn(api, "getCurrentGameweek").mockResolvedValue({ current: { number: 3, roundLabel: "3", tournamentId: "t", deadline: "2026-06-14T18:00:00Z", status: "Open", matches: [] }, lastSettled: null });
  renderWithProviders(
    <ToastProvider><SellButton player={{ playerId: "p1", name: "Vik" }} /></ToastProvider>,
    { auth: authed },
  );
  // Let the current-gameweek baseline query resolve before we submit, so the notice
  // sees a non-null baseline (mirrors a page that's been open a while).
  await waitFor(() => expect(api.getCurrentGameweek).toHaveBeenCalled());
  fireEvent.click(screen.getByRole("button", { name: /sell/i }));     // trigger
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: /sell/i })); // confirm
  expect(await screen.findByRole("status")).toHaveTextContent(/Gameweek 3/);
});

test("cancel closes the dialog without selling", async () => {
  const sell = vi.spyOn(api, "sellPlayer");
  renderWithProviders(<ToastProvider><SellButton player={{ playerId: "p1", name: "Vik" }} /></ToastProvider>, { auth: authed });
  fireEvent.click(screen.getByRole("button", { name: /sell/i }));
  fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(sell).not.toHaveBeenCalled();
});

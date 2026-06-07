import { screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser } from "../api/types";
import { BuyButton } from "./BuyButton";
import { ToastProvider } from "./Toast";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());

const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };

function mockBackend(over: { players?: { playerId: string; position: string }[]; remaining?: number } = {}) {
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue({ ruleSetVersion: 1, maxSquadSize: 15, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: { GK: 2, CB: 3 } });
  vi.spyOn(api, "getSquad").mockResolvedValue({
    flavor: "fantasy",
    players: (over.players ?? []).map((p) => ({ playerId: p.playerId, name: null, clubId: null, clubName: null, position: p.position, gender: null, price: null, pricePaid: { amount: 1, currency: "ISK" } })),
    budgetUsed: { amount: 0, currency: "ISK" },
    remainingBudget: { amount: over.remaining ?? 100_000_000, currency: "ISK" },
    squadValue: { amount: 0, currency: "ISK" },
  });
}

function renderBtn(player: { playerId: string; name?: string | null; position: string | null; price: { amount: number; currency: string } | null }) {
  return renderWithProviders(
    <ToastProvider><BuyButton player={{ name: null, ...player }} /></ToastProvider>,
    { auth: authed },
  );
}

test("renders nothing for anonymous users", () => {
  mockBackend();
  renderWithProviders(<ToastProvider><BuyButton player={{ playerId: "p1", name: null, position: "GK", price: { amount: 1, currency: "ISK" } }} /></ToastProvider>, { auth: { status: "anonymous" } });
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

test("shows 'In squad' (disabled) when owned", async () => {
  mockBackend({ players: [{ playerId: "p1", position: "GK" }] });
  renderBtn({ playerId: "p1", position: "GK", price: { amount: 1, currency: "ISK" } });
  const btn = await screen.findByRole("button");
  expect(btn).toBeDisabled();
  expect(btn).toHaveTextContent(/In squad/i);
});

test("disables with a budget reason when unaffordable", async () => {
  mockBackend({ remaining: 5_000_000 });
  renderBtn({ playerId: "p2", position: "GK", price: { amount: 50_000_000, currency: "ISK" } });
  const btn = await screen.findByRole("button");
  expect(btn).toBeDisabled();
  expect(btn).toHaveAttribute("title", expect.stringMatching(/budget/i));
});

test("is enabled and labelled with the price when buyable", async () => {
  mockBackend();
  vi.spyOn(api, "buyPlayer").mockResolvedValue({ flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 0, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } });
  renderBtn({ playerId: "p2", position: "GK", price: { amount: 12_000_000, currency: "ISK" } });
  const btn = await screen.findByRole("button");
  expect(btn).toBeEnabled();
  expect(btn).toHaveTextContent(/12M ISK/);
});

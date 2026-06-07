import { screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { AuthUser } from "../api/types";
import SquadPage from "./SquadPage";
import { ToastProvider } from "../components/Toast";
import { renderWithProviders } from "../test/renderWithQuery";

afterEach(() => vi.restoreAllMocks());
const user: AuthUser = { id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null };
const authed = { status: "authenticated" as const, user };

test("groups owned players by position and shows the budget meter", async () => {
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue({ ruleSetVersion: 1, maxSquadSize: 15, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: { GK: 2, CB: 3 } });
  vi.spyOn(api, "getSquad").mockResolvedValue({
    flavor: "fantasy",
    players: [
      { playerId: "g1", name: "Keeper", clubId: "1", clubName: "Aalvik", position: "GK", gender: "karlar", price: { amount: 12_000_000, currency: "ISK" }, pricePaid: { amount: 11_000_000, currency: "ISK" } },
    ],
    budgetUsed: { amount: 11_000_000, currency: "ISK" },
    remainingBudget: { amount: 89_000_000, currency: "ISK" },
    squadValue: { amount: 12_000_000, currency: "ISK" },
  });
  renderWithProviders(<ToastProvider><SquadPage /></ToastProvider>, { auth: authed });
  expect(await screen.findByText("Keeper")).toBeInTheDocument();
  expect(screen.getByText(/89M ISK/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /sell/i })).toBeInTheDocument();
});

test("shows an empty prompt when the squad is empty", async () => {
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue({ ruleSetVersion: 1, maxSquadSize: 15, startingCap: { amount: 100_000_000, currency: "ISK" }, posLimits: { GK: 2 } });
  vi.spyOn(api, "getSquad").mockResolvedValue({ flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 100_000_000, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } });
  renderWithProviders(<ToastProvider><SquadPage /></ToastProvider>, { auth: authed });
  expect(await screen.findByRole("link", { name: /market/i })).toBeInTheDocument();
});

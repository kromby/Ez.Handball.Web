import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import * as api from "../api/endpoints";
import { renderWithProviders } from "../test/renderWithQuery";
import type { AuthUser, Squad, SquadConstraints } from "../api/types";
import SquadPage from "./SquadPage";

afterEach(() => vi.restoreAllMocks());

const constraints = {
  startingCap: { amount: 100_000_000, currency: "ISK" },
  maxSquadSize: 7,
  currency: "ISK",
  posLimits: { GK: 1, LW: 1, RW: 1, LP: 1, LB: 1, RB: 1, CB: 1 },
} as SquadConstraints;

const squad = {
  flavor: "fantasy",
  players: [
    { playerId: "p-1", name: "Lúkas Dahl", clubId: "c", clubName: "Catalunya BM", position: "CB",
      gender: "karlar", price: { amount: 10_500_000, currency: "ISK" }, pricePaid: { amount: 9_500_000, currency: "ISK" }, rating: 84 },
  ],
  budgetUsed: { amount: 9_500_000, currency: "ISK" },
  remainingBudget: { amount: 90_500_000, currency: "ISK" },
  squadValue: { amount: 10_500_000, currency: "ISK" },
} as Squad;

const user = { id: "u-1", email: "a@b.is", displayName: "Aron", language: "is",
  favoriteClubId: "385", teamName: "Aron's Aces", emailVerified: true } as AuthUser;

const renderPage = (squadData: Squad) => {
  vi.spyOn(api, "getSquad").mockResolvedValue(squadData);
  vi.spyOn(api, "getSquadConstraints").mockResolvedValue(constraints);
  return renderWithProviders(<Routes><Route path="/squad" element={<SquadPage />} /></Routes>, {
    initialEntries: ["/squad"],
    auth: { status: "authenticated", user },
  });
};

describe("SquadPage", () => {
  it("renders the team name title and manager-name scribble from the auth user", async () => {
    renderPage(squad);
    expect(await screen.findByText("Aron's Aces")).toBeInTheDocument();
    expect(screen.getByText("Aron")).toBeInTheDocument();
  });

  it("auto-selects the first owned player into the panel (full name shown)", async () => {
    renderPage(squad);
    expect(await screen.findByText("Lúkas Dahl")).toBeInTheDocument();
  });

  it("renders ghost slots linking to the market when the squad is empty", async () => {
    renderPage({ ...squad, players: [] });
    await waitFor(() => expect(screen.getAllByRole("link").length).toBeGreaterThan(0));
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/market")).toBe(true);
  });
});

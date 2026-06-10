import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { SquadPlayer } from "../../api/types";
import { renderWithProviders } from "../../test/renderWithQuery";
import { ToastProvider } from "../Toast";
import { SelectedPlayerPanel } from "./SelectedPlayerPanel";

// useToast() is lenient (returns NOOP outside ToastProvider), but SellButton.test.tsx
// wraps in ToastProvider for correctness. We do the same here.

const player = {
  playerId: "p-1",
  name: "Dahl",
  clubId: "c1",
  clubName: "Catalunya BM",
  position: "CB",
  gender: "karlar",
  price: { amount: 10_500_000, currency: "ISK" },
  pricePaid: { amount: 9_500_000, currency: "ISK" },
  rating: 84,
} satisfies SquadPlayer;

test("no player shows tap-prompt", () => {
  renderWithProviders(
    <ToastProvider>
      <SelectedPlayerPanel player={null} />
    </ToastProvider>,
  );
  expect(screen.getByText("tap a player to see their card")).toBeInTheDocument();
});

test("player shows name, rating, club, and profile link", () => {
  renderWithProviders(
    <ToastProvider>
      <SelectedPlayerPanel player={player} />
    </ToastProvider>,
  );
  expect(screen.getByText("Dahl")).toBeInTheDocument();
  expect(screen.getByText("84")).toBeInTheDocument();
  expect(screen.getByText(/Catalunya BM/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /profile/i })).toHaveAttribute(
    "href",
    "/players/p-1",
  );
});

test("price > pricePaid renders drift-up", () => {
  renderWithProviders(
    <ToastProvider>
      <SelectedPlayerPanel player={player} />
    </ToastProvider>,
  );
  const drift = screen.getByTestId("drift");
  expect(drift.className).toMatch(/drift-up/);
});

test("null price hides the drift element", () => {
  const noPrice: SquadPlayer = { ...player, price: null };
  renderWithProviders(
    <ToastProvider>
      <SelectedPlayerPanel player={noPrice} />
    </ToastProvider>,
  );
  expect(screen.queryByTestId("drift")).not.toBeInTheDocument();
});

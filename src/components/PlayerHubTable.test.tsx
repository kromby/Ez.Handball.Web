import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import type { PoolEntry } from "../api/types";
import { PlayerHubTable } from "./PlayerHubTable";
import { ToastProvider } from "./Toast";
import { renderWithProviders } from "../test/renderWithQuery";

const entry: PoolEntry = {
  rank: 1, playerId: "p1", name: "Bergström", clubId: "1", clubName: "Catalunya",
  gender: "karlar", position: "CB", positionSecondary: null, games: 8, goals: 20, yellowCards: 3,
  twoMinuteSuspensions: 2, redCards: 1, avgGoals: 2.5,
  price: { amount: 11_000_000, currency: "ISK" }, rating: 49, pickPercentage: null,
  assists: 5, steals: 4, blocks: 1, saves: 0, turnovers: 3, legalStops: 0, shots: 30,
  expectedGoals: 18.4, shotsFaced: 0, savePct: null, expectedSaves: 0,
  gradeTotal: 7.2, gradeOffense: 7.5, gradeDefense: 6.8, gradeGoalkeeping: null,
};

test("shows stats + rating + price; clicking a header sorts", async () => {
  const onSort = vi.fn();
  renderWithProviders(
    <ToastProvider><PlayerHubTable entries={[entry]} sort="Goals" onSort={onSort} authed={false} /></ToastProvider>,
  );
  expect(screen.getByText("Bergström")).toBeInTheDocument();
  expect(screen.getByText("20")).toBeInTheDocument();   // goals
  expect(screen.getByText("5")).toBeInTheDocument();    // assists
  expect(screen.getByText("2.50")).toBeInTheDocument(); // avgGoals (toFixed(2))
  expect(screen.getByText("7.2")).toBeInTheDocument();  // gradeTotal form badge
  expect(screen.getByText(/11M ISK/)).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Rating/ }));
  expect(onSort).toHaveBeenCalledWith("Rating");
});

test("hides the Buy column when not authed", () => {
  renderWithProviders(
    <ToastProvider><PlayerHubTable entries={[entry]} sort="Goals" onSort={vi.fn()} authed={false} /></ToastProvider>,
  );
  expect(screen.queryByRole("button", { name: /buy/i })).not.toBeInTheDocument();
});

test("without sort props, headers are plain labels in server order", () => {
  renderWithProviders(
    <ToastProvider><PlayerHubTable entries={[entry]} authed={false} /></ToastProvider>,
  );
  expect(screen.getByRole("columnheader", { name: "Rating" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Rating/ })).not.toBeInTheDocument();
});

test("leading and after-position columns replace the rank column", () => {
  renderWithProviders(
    <ToastProvider>
      <PlayerHubTable
        entries={[entry]}
        authed={false}
        leadingColumns={[{ key: "jersey", header: "#", align: "right", render: () => "77" }]}
        afterPositionColumns={[{ key: "age", header: "Age", align: "right", render: () => "31" }]}
      />
    </ToastProvider>,
  );
  const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
  expect(headers.slice(1, 6)).toEqual(["#", "Player", "Club", "Pos", "Age"]);
  expect(screen.getByText("77")).toBeInTheDocument();
  expect(screen.getByText("31")).toBeInTheDocument();
});

import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { useLocation } from "react-router-dom";
import App from "./App";
import { renderWithProviders } from "./test/renderWithQuery";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="pathname">{location.pathname}</div>;
}

test("renders the nav banner and leaderboard at /", () => {
  renderWithProviders(<App />, { initialEntries: ["/"] });
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Leaderboard" })).toBeInTheDocument();
});

test("legacy ?playerId redirects to the player route", () => {
  renderWithProviders(
    <>
      <App />
      <LocationProbe />
    </>,
    { initialEntries: ["/?playerId=42"] },
  );
  expect(screen.getByTestId("pathname")).toHaveTextContent("/players/42");
});

test("renders the match page at /matches/:id", () => {
  renderWithProviders(<App />, { initialEntries: ["/matches/99"] });
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

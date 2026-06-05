import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { useLocation } from "react-router-dom";
import App from "./App";
import { renderWithProviders } from "./test/renderWithQuery";
import { LANG_STORAGE_KEY } from "./i18n/languageStorage";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="pathname">{location.pathname}</div>;
}

test("renders the nav banner and leaderboard at /", () => {
  // Persist English preference so useLanguageSync resolves to English.
  localStorage.setItem(LANG_STORAGE_KEY, "en");
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
  // Persist English preference so the loading text resolves to English.
  localStorage.setItem(LANG_STORAGE_KEY, "en");
  renderWithProviders(<App />, { initialEntries: ["/matches/99"] });
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

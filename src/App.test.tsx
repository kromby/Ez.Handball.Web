import { screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useLocation } from "react-router-dom";
import App from "./App";
import { renderWithProviders } from "./test/renderWithQuery";
import { LANG_STORAGE_KEY } from "./i18n/languageStorage";
import * as api from "./api/endpoints";

afterEach(() => vi.restoreAllMocks());

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="pathname">{location.pathname}</div>;
}

test("renders the nav banner and player hub at /", () => {
  // Persist English preference so useLanguageSync resolves to English.
  localStorage.setItem(LANG_STORAGE_KEY, "en");
  renderWithProviders(<App />, { initialEntries: ["/"] });
  expect(screen.getByRole("banner")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Players" })).toBeInTheDocument();
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

test("navigates to the public gameweeks page", async () => {
  localStorage.setItem(LANG_STORAGE_KEY, "en");
  vi.spyOn(api, "getGameweeks").mockResolvedValue([
    { number: 18, roundLabel: "18", tournamentId: "8444", deadline: "2099-06-20T18:00:00Z", status: "Open", matches: [] },
  ]);
  vi.spyOn(api, "getCurrentGameweek").mockResolvedValue({
    current: { number: 18, roundLabel: "18", tournamentId: "8444", deadline: "2099-06-20T18:00:00Z", status: "Open", matches: [] },
    lastSettled: null,
  });
  vi.spyOn(api, "getRounds").mockResolvedValue({ tournamentId: "8444", tournamentName: null, season: "2025-26", rounds: [] });

  renderWithProviders(<App />, { initialEntries: ["/gameweeks"] });

  expect(await screen.findByText("Gameweek 18")).toBeInTheDocument();
});

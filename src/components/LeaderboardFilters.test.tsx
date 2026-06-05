import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { LeaderboardFilters } from "./LeaderboardFilters";
import { renderWithProviders } from "../test/renderWithQuery";

const seasons = [
  { label: "2025-26", isCurrent: true },
  { label: "2024-25", isCurrent: false },
];
const tournaments = [{ tournamentId: "8444", name: "Olís deild karla", gender: "karlar" }];
const genders = [
  { value: "karlar", label: "Karlar" },
  { value: "kvenna", label: "Kvenna" },
];

function setup(overrides = {}) {
  const props = {
    seasons,
    tournaments,
    genders,
    season: "2025-26" as string | undefined,
    tournamentId: undefined as string | undefined,
    gender: undefined as string | undefined,
    onSeasonChange: vi.fn(),
    onTournamentChange: vi.fn(),
    onGenderChange: vi.fn(),
    ...overrides,
  };
  renderWithProviders(<LeaderboardFilters {...props} />);
  return props;
}

test("renders season, tournament (with All), and gender (with All) groups", () => {
  setup();
  expect(screen.getByRole("button", { name: "2025-26" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Olís deild karla" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "All tournaments" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Kvenna" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
});

test("hides the season group when there are no seasons", () => {
  setup({ seasons: [] });
  expect(screen.queryByRole("button", { name: "2025-26" })).not.toBeInTheDocument();
});

test("hides the tournament group until a season is selected", () => {
  setup({ season: undefined });
  expect(screen.queryByRole("button", { name: "All tournaments" })).not.toBeInTheDocument();
});

test("invokes the season handler on click", async () => {
  const props = setup();
  await userEvent.click(screen.getByRole("button", { name: "2024-25" }));
  expect(props.onSeasonChange).toHaveBeenCalledWith("2024-25");
});

test("invokes the tournament handler with the tournament id", async () => {
  const props = setup();
  await userEvent.click(screen.getByRole("button", { name: "Olís deild karla" }));
  expect(props.onTournamentChange).toHaveBeenCalledWith("8444");
});

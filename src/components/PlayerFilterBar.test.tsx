import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { PlayerFilterBar } from "./PlayerFilterBar";

const seasons = [{ label: "2025-26", isCurrent: true }, { label: "2024-25", isCurrent: false }];
const clubs = [{ clubId: "2", name: "Valur", logoUrl: null }, { clubId: "1", name: "Akureyri", logoUrl: null }];

function renderBar(overrides: Partial<Parameters<typeof PlayerFilterBar>[0]> = {}) {
  return render(
    <PlayerFilterBar
      name=""
      onNameChange={vi.fn()}
      season="2025-26"
      seasons={seasons}
      onSeasonChange={vi.fn()}
      position=""
      positionCodes={["GK", "CB"]}
      onPositionChange={vi.fn()}
      clubId=""
      clubs={clubs}
      onClubIdChange={vi.fn()}
      {...overrides}
    />,
  );
}

test("renders exactly the search, season, position, and team controls", () => {
  renderBar();
  expect(screen.getByRole("searchbox", { name: /Search players/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /Season/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /Position/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: /Team/i })).toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: /Gender/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox", { name: /Tournament/i })).not.toBeInTheDocument();
});

test("sorts team options alphabetically with an 'all teams' option first", () => {
  renderBar();
  const options = screen.getAllByRole("option", { name: /Akureyri|Valur|All teams/i });
  expect(options.map((o) => o.textContent)).toEqual(["All teams", "Akureyri", "Valur"]);
});

test("calls the matching callback when each filter changes", async () => {
  const onSeasonChange = vi.fn();
  const onPositionChange = vi.fn();
  const onClubIdChange = vi.fn();
  renderBar({ onSeasonChange, onPositionChange, onClubIdChange });

  await userEvent.selectOptions(screen.getByRole("combobox", { name: /Season/i }), "2024-25");
  expect(onSeasonChange).toHaveBeenCalledWith("2024-25");

  await userEvent.selectOptions(screen.getByRole("combobox", { name: /Position/i }), "CB");
  expect(onPositionChange).toHaveBeenCalledWith("CB");

  await userEvent.selectOptions(screen.getByRole("combobox", { name: /Team/i }), "1");
  expect(onClubIdChange).toHaveBeenCalledWith("1");
});

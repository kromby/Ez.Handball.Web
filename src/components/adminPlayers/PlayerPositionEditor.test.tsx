import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../../api/endpoints";
import { renderWithProviders } from "../../test/renderWithQuery";
import { PlayerPositionEditor } from "./PlayerPositionEditor";

afterEach(() => vi.restoreAllMocks());

function renderEditor(position: string | null, positionSecondary: string | null) {
  return renderWithProviders(
    <PlayerPositionEditor playerId="p1" position={position} positionSecondary={positionSecondary} />,
  );
}

const saveButton = () => screen.getByRole("button", { name: "Save" });

test("save is disabled until something changes", async () => {
  renderEditor("CB", "LB");

  expect(saveButton()).toBeDisabled();
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Secondary position" }), "RB");
  expect(saveButton()).toBeEnabled();
});

test("saving sends both positions so the secondary is never cleared by accident", async () => {
  const setPosition = vi.spyOn(api, "setPlayerPosition").mockResolvedValue();
  renderEditor("Leikmaður", "LB");

  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Position" }), "CB");
  await userEvent.click(saveButton());

  expect(setPosition).toHaveBeenCalledWith("p1", "CB", "LB");
});

test("choosing None clears the secondary deliberately", async () => {
  const setPosition = vi.spyOn(api, "setPlayerPosition").mockResolvedValue();
  renderEditor("CB", "LB");

  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Secondary position" }), "");
  await userEvent.click(saveButton());

  expect(setPosition).toHaveBeenCalledWith("p1", "CB", null);
});

test("a secondary equal to the primary can't be saved", async () => {
  renderEditor("CB", null);

  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Secondary position" }), "CB");

  expect(saveButton()).toBeDisabled();
  expect(screen.getByText("The secondary position must differ from the primary.")).toBeInTheDocument();
});

test("save needs a known primary position", async () => {
  renderEditor("Leikmaður", null);

  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Secondary position" }), "LB");

  expect(saveButton()).toBeDisabled();
});

test("a blank stored secondary shows as None", () => {
  renderEditor("CB", "");

  expect(screen.getByRole("combobox", { name: "Secondary position" })).toHaveValue("");
});

test("shows an inline error if saving fails", async () => {
  vi.spyOn(api, "setPlayerPosition").mockRejectedValue(new Error("boom"));
  renderEditor("CB", null);

  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Secondary position" }), "LB");
  await userEvent.click(saveButton());

  expect(await screen.findByText("Couldn't save this position. Please try again.")).toBeInTheDocument();
});

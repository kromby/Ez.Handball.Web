import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { FilterSelect } from "./FilterSelect";

test("renders options and reports the chosen value", async () => {
  const onChange = vi.fn();
  render(
    <FilterSelect
      label="Season"
      value="2025-26"
      options={[{ value: "2025-26", label: "2025-26" }, { value: "2024-25", label: "2024-25" }]}
      onChange={onChange}
    />,
  );
  const select = screen.getByRole("combobox", { name: "Season" });
  expect(select).toHaveValue("2025-26");
  await userEvent.selectOptions(select, "2024-25");
  expect(onChange).toHaveBeenCalledWith("2024-25");
});

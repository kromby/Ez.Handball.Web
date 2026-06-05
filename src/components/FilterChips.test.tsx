import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { FilterChips } from "./FilterChips";

const options = [
  { value: "", label: "All" },
  { value: "karlar", label: "Karlar" },
];

test("marks the selected option with aria-pressed", () => {
  render(<FilterChips label="Gender" options={options} selected="karlar" onSelect={() => {}} />);
  expect(screen.getByRole("button", { name: "Karlar" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
});

test("calls onSelect with the chosen value", async () => {
  const onSelect = vi.fn();
  render(<FilterChips label="Gender" options={options} selected="" onSelect={onSelect} />);
  await userEvent.click(screen.getByRole("button", { name: "Karlar" }));
  expect(onSelect).toHaveBeenCalledWith("karlar");
});

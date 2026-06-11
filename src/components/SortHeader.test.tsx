import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { SortHeader } from "./SortHeader";

test("marks the active sort and fires onSort with its key", async () => {
  const onSort = vi.fn();
  const { rerender } = render(
    <SortHeader label="Goals" sortKey="Goals" active="Rating" onSort={onSort} />,
  );
  const btn = screen.getByRole("button", { name: /Goals/ });
  expect(btn).toHaveAttribute("aria-pressed", "false");
  await userEvent.click(btn);
  expect(onSort).toHaveBeenCalledWith("Goals");

  rerender(<SortHeader label="Goals" sortKey="Goals" active="Goals" onSort={onSort} />);
  expect(screen.getByRole("button", { name: /Goals/ })).toHaveAttribute("aria-pressed", "true");
});

test("renders a caret element only when active", () => {
  const onSort = vi.fn();
  const { rerender, container } = render(
    <SortHeader label="Goals" sortKey="Goals" active="Rating" onSort={onSort} />,
  );
  expect(container.querySelector(".sort-caret")).toBeNull();

  rerender(<SortHeader label="Goals" sortKey="Goals" active="Goals" onSort={onSort} />);
  expect(container.querySelector(".sort-caret")).not.toBeNull();
});

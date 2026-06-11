import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { SearchInput } from "./SearchInput";

afterEach(() => vi.restoreAllMocks());

test("fires onSearch once after the user stops typing", async () => {
  const onSearch = vi.fn();
  render(<SearchInput initialValue="" placeholder="Search" clearLabel="Clear" onSearch={onSearch} />);
  await userEvent.type(screen.getByPlaceholderText("Search"), "berg");
  await waitFor(() => expect(onSearch).toHaveBeenCalledWith("berg"));
  expect(onSearch).toHaveBeenCalledTimes(1);
});

test("clear button empties the input and fires onSearch with empty string", async () => {
  const onSearch = vi.fn();
  render(<SearchInput initialValue="berg" placeholder="Search" clearLabel="Clear search" onSearch={onSearch} />);
  const input = screen.getByPlaceholderText("Search") as HTMLInputElement;
  expect(input.value).toBe("berg");
  await userEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(input.value).toBe("");
  await waitFor(() => expect(onSearch).toHaveBeenCalledWith(""));
});

test("seeds the input from initialValue and re-syncs when it changes", () => {
  const onSearch = vi.fn();
  const { rerender } = render(
    <SearchInput initialValue="abc" placeholder="Search" clearLabel="Clear" onSearch={onSearch} />,
  );
  expect((screen.getByPlaceholderText("Search") as HTMLInputElement).value).toBe("abc");
  rerender(<SearchInput initialValue="xyz" placeholder="Search" clearLabel="Clear" onSearch={onSearch} />);
  expect((screen.getByPlaceholderText("Search") as HTMLInputElement).value).toBe("xyz");
  expect(onSearch).not.toHaveBeenCalled();
});

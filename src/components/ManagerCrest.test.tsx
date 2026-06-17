import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ManagerCrest, crestInitials } from "./ManagerCrest";

test("crestInitials takes the first letters of the first two words", () => {
  expect(crestInitials("FC Awesome")).toBe("FA");
});

test("crestInitials uses the first two letters of a single word", () => {
  expect(crestInitials("Pivot")).toBe("PI");
});

test("crestInitials falls back to '?' for an empty name", () => {
  expect(crestInitials("   ")).toBe("?");
});

test("ManagerCrest renders the initials and applies the color", () => {
  render(<ManagerCrest teamName="FC Awesome" color="#1E88E5" />);
  const crest = screen.getByText("FA");
  expect(crest).toBeInTheDocument();
});

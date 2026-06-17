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
  expect(crest).toHaveStyle({ background: "#1E88E5" });
});

test("ManagerCrest uses dark text on a light background and light text on a dark background", () => {
  const { rerender } = render(<ManagerCrest teamName="Ab" color="#ffffff" />);
  expect(screen.getByText("AB")).toHaveStyle({ color: "rgb(26, 26, 26)" }); // #1a1a1a
  rerender(<ManagerCrest teamName="Ab" color="#000000" />);
  expect(screen.getByText("AB")).toHaveStyle({ color: "rgb(255, 255, 255)" }); // #fff
});

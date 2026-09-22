import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { MemberCrest } from "./MemberCrest";

test("shows the club logo when there is one", () => {
  render(<MemberCrest logoUrl="https://example.test/valur.png" clubName="Valur" />);
  expect(screen.getByRole("img", { name: "Valur" })).toHaveAttribute("src", "https://example.test/valur.png");
});

test("falls back to the decorative ball without a logo", () => {
  const { container } = render(<MemberCrest logoUrl={null} />);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(container.querySelector("svg use")).toHaveAttribute("href", "#pivot-ball");
});

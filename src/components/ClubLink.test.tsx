import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import { ClubLink } from "./ClubLink";

function renderLink(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

test("renders a link to the encoded club route when clubId is present", () => {
  renderLink(<ClubLink clubId="c 1" name="Valur" />);
  expect(screen.getByRole("link", { name: "Valur" })).toHaveAttribute("href", "/clubs/c%201");
});

test("renders plain text with no link when clubId is null", () => {
  renderLink(<ClubLink clubId={null} name="Valur" />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
  expect(screen.getByText("Valur")).toBeInTheDocument();
});

test("renders plain text with no link when clubId is empty", () => {
  renderLink(<ClubLink clubId="" name="Valur" />);
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

test("renders children instead of name when provided", () => {
  renderLink(
    <ClubLink clubId="c1" name="ignored">
      <img alt="" src="/logo.png" />
      <span>Haukar</span>
    </ClubLink>,
  );
  expect(screen.getByRole("link", { name: "Haukar" })).toHaveAttribute("href", "/clubs/c1");
});

test("falls back to em dash when name is null and no children", () => {
  renderLink(<ClubLink clubId={null} name={null} />);
  expect(screen.getByText("—")).toBeInTheDocument();
});

test("merges the extra className", () => {
  renderLink(<ClubLink clubId="c1" name="Valur" className="club-match-opp" />);
  const link = screen.getByRole("link", { name: "Valur" });
  expect(link).toHaveClass("club-link");
  expect(link).toHaveClass("club-match-opp");
});

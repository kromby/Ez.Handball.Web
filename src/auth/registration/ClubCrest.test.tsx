import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ClubCrest } from "./ClubCrest";
import type { Club } from "../../api/types";

describe("ClubCrest", () => {
  test("renders the real logo when logoUrl is set", () => {
    const club: Club = { clubId: "385", name: "Afturelding", logoUrl: "https://example.test/a.png" };
    render(<ClubCrest club={club} />);
    expect(screen.getByRole("img", { name: "Afturelding" })).toHaveAttribute("src", "https://example.test/a.png");
  });

  test("draws a monogram crest fallback when there is no logo", () => {
    const club: Club = { clubId: "412", name: "Fram Reykjavik", logoUrl: null };
    render(<ClubCrest club={club} />);
    expect(screen.getByRole("img", { name: "Fram Reykjavik" })).toBeInTheDocument();
    expect(screen.getByText("FR")).toBeInTheDocument();
  });
});

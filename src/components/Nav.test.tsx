import { screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Nav } from "./Nav";
import { renderWithProviders } from "../test/renderWithQuery";
import type { AuthUser } from "../api/types";

const user: AuthUser = {
  id: "u1", email: "a@b.is", displayName: "Jon", language: "is",
  favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
};

describe("Nav", () => {
  test("shows login and register links when anonymous", () => {
    renderWithProviders(<Nav />, { auth: { status: "anonymous" } });
    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
  });

  test("shows the display name linking to the account when authenticated", () => {
    renderWithProviders(<Nav />, { auth: { status: "authenticated", user } });
    const accountLink = screen.getByRole("link", { name: "Jon" });
    expect(accountLink).toHaveAttribute("href", "/account");
  });

  test("renders no auth controls while loading", () => {
    renderWithProviders(<Nav />, { auth: { status: "loading" } });
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument();
  });
});

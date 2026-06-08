import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Nav } from "./Nav";
import { renderWithProviders } from "../test/renderWithQuery";
import type { AuthUser } from "../api/types";
import * as api from "../api/endpoints";

afterEach(() => vi.restoreAllMocks());

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
    vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 3, max: 20 });
    renderWithProviders(<Nav />, { auth: { status: "authenticated", user } });
    const accountLink = screen.getByRole("link", { name: "Jon" });
    expect(accountLink).toHaveAttribute("href", "/account");
  });

  test("renders no auth controls while loading", () => {
    renderWithProviders(<Nav />, { auth: { status: "loading" } });
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Register" })).not.toBeInTheDocument();
  });

  test("shows a Shortlist link with the count when authenticated", async () => {
    vi.spyOn(api, "getShortlist").mockResolvedValue({ items: [], count: 3, max: 20 });
    renderWithProviders(<Nav />, { auth: { status: "authenticated", user } });
    const link = await screen.findByRole("link", { name: /Shortlist/ });
    expect(link).toHaveAttribute("href", "/shortlist");
    await waitFor(() => expect(link).toHaveTextContent("3"));
  });

  test("shows no Shortlist link when anonymous", () => {
    renderWithProviders(<Nav />, { auth: { status: "anonymous" } });
    expect(screen.queryByRole("link", { name: /Shortlist/ })).not.toBeInTheDocument();
  });

  test("shows a Leagues link to /leagues when authenticated", () => {
    renderWithProviders(<Nav />, { auth: { status: "authenticated", user } });
    expect(screen.getByRole("link", { name: "Leagues" })).toHaveAttribute("href", "/leagues");
  });

  test("renders the language toggle for everyone", () => {
    renderWithProviders(<Nav />, { auth: { status: "anonymous" } });
    expect(screen.getByRole("button", { name: "IS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "EN" })).toBeInTheDocument();
  });

  test("shows the new brand wordmark", () => {
    renderWithProviders(<Nav />, { auth: { status: "anonymous" } });
    expect(screen.getByText("Olís league - Fantasy")).toBeInTheDocument();
  });
});

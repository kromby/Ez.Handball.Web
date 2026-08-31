import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { AdminRoute, ProtectedRoute } from "./ProtectedRoute";
import { renderWithProviders } from "../test/renderWithQuery";
import type { AuthUser } from "../api/types";

const user: AuthUser = {
  id: "u1", email: "a@b.is", displayName: "Jon", language: "is", favoriteClubId: "385",
  emailVerified: true, isAdmin: false, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
};

function tree() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<p>account body</p>} />
      </Route>
      <Route path="/login" element={<p>login screen</p>} />
    </Routes>
  );
}

function adminTree() {
  return (
    <Routes>
      <Route element={<AdminRoute />}>
        <Route path="/admin/tournaments" element={<p>admin body</p>} />
      </Route>
      <Route path="/login" element={<p>login screen</p>} />
      <Route path="/" element={<p>home screen</p>} />
    </Routes>
  );
}

describe("ProtectedRoute", () => {
  test("shows loading while auth is resolving", () => {
    renderWithProviders(tree(), { initialEntries: ["/account"], auth: { status: "loading" } });
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  test("redirects to /login when anonymous", () => {
    renderWithProviders(tree(), { initialEntries: ["/account"], auth: { status: "anonymous" } });
    expect(screen.getByText("login screen")).toBeInTheDocument();
  });

  test("renders the protected content when authenticated", () => {
    renderWithProviders(tree(), { initialEntries: ["/account"], auth: { status: "authenticated" } });
    expect(screen.getByText("account body")).toBeInTheDocument();
  });
});

describe("AdminRoute", () => {
  test("shows loading while auth is resolving", () => {
    renderWithProviders(adminTree(), { initialEntries: ["/admin/tournaments"], auth: { status: "loading" } });
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  test("redirects to /login when anonymous", () => {
    renderWithProviders(adminTree(), { initialEntries: ["/admin/tournaments"], auth: { status: "anonymous" } });
    expect(screen.getByText("login screen")).toBeInTheDocument();
  });

  test("redirects home when authenticated but not an admin", () => {
    renderWithProviders(adminTree(), {
      initialEntries: ["/admin/tournaments"],
      auth: { status: "authenticated", user },
    });
    expect(screen.getByText("home screen")).toBeInTheDocument();
  });

  test("renders the admin content when authenticated as an admin", () => {
    renderWithProviders(adminTree(), {
      initialEntries: ["/admin/tournaments"],
      auth: { status: "authenticated", user: { ...user, isAdmin: true } },
    });
    expect(screen.getByText("admin body")).toBeInTheDocument();
  });
});

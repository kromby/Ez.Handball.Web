import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { renderWithProviders } from "../test/renderWithQuery";

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

import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Route, Routes } from "react-router-dom";
import LoginPage from "./LoginPage";
import { renderWithProviders } from "../test/renderWithQuery";
import { ApiError } from "../api/client";
import * as api from "../api/endpoints";
import type { Manager } from "../api/types";

afterEach(() => vi.restoreAllMocks());

describe("LoginPage", () => {
  test("submits email and password", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<LoginPage />, { auth: { login } });

    await userEvent.type(screen.getByLabelText("Email"), "a@b.is");
    await userEvent.type(screen.getByLabelText("Password"), "hunter2hunter2");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(login).toHaveBeenCalledWith("a@b.is", "hunter2hunter2");
  });

  test("shows a generic error on any failure", async () => {
    const login = vi.fn().mockRejectedValue(new ApiError(401, "invalid_credentials", "x"));
    renderWithProviders(<LoginPage />, { auth: { login } });

    await userEvent.type(screen.getByLabelText("Email"), "a@b.is");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpassword");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("That email or password didn't match.")).toBeInTheDocument();
  });

  test("returns to the page the user came from after login", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/account" element={<p>account page</p>} />
      </Routes>,
      { initialEntries: [{ pathname: "/login", state: { from: { pathname: "/account" } } }], auth: { login } },
    );
    await userEvent.type(screen.getByLabelText("Email"), "a@b.is");
    await userEvent.type(screen.getByLabelText("Password"), "hunter2hunter2");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("account page")).toBeInTheDocument();
  });
});

const incomplete: Manager = {
  flavor: "fantasy", teamName: "FC", favoriteClubId: "385", color: "#1E88E5",
  onboarding: { squadComplete: false, playersOwned: 0, squadSize: 15 },
};

test("after login with an incomplete squad, lands on /players", async () => {
  vi.spyOn(api, "getManager").mockResolvedValue(incomplete);
  const login = vi.fn().mockResolvedValue(undefined);
  renderWithProviders(<LoginPage />, {
    auth: { login },
    initialEntries: ["/login"],
  });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "a@b.is" } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "pw" } });
  fireEvent.click(screen.getByRole("button", { name: /log ?in/i }));
  await waitFor(() => expect(login).toHaveBeenCalled());
  await waitFor(() => expect(api.getManager).toHaveBeenCalled());
});

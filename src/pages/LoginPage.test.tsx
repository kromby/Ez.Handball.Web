import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import LoginPage from "./LoginPage";
import { renderWithProviders } from "../test/renderWithQuery";
import { ApiError } from "../api/client";

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
});

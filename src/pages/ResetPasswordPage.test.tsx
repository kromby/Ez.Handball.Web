import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import ResetPasswordPage from "./ResetPasswordPage";
import { renderWithProviders } from "../test/renderWithQuery";
import * as auth from "../api/authEndpoints";
import { ApiError } from "../api/client";

afterEach(() => vi.restoreAllMocks());

describe("ResetPasswordPage", () => {
  test("submits the token from the URL with the new password", async () => {
    const reset = vi.spyOn(auth, "resetPassword").mockResolvedValue(undefined);
    renderWithProviders(<ResetPasswordPage />, { initialEntries: ["/reset-password?token=abc"] });

    await userEvent.type(screen.getByLabelText("New password"), "newpassword123");
    await userEvent.click(screen.getByRole("button", { name: "Set new password" }));

    expect(reset).toHaveBeenCalledWith("abc", "newpassword123");
    expect(await screen.findByText(/password updated/i)).toBeInTheDocument();
  });

  test("explains an expired link", async () => {
    vi.spyOn(auth, "resetPassword").mockRejectedValue(new ApiError(401, "token_expired", "x"));
    renderWithProviders(<ResetPasswordPage />, { initialEntries: ["/reset-password?token=abc"] });

    await userEvent.type(screen.getByLabelText("New password"), "newpassword123");
    await userEvent.click(screen.getByRole("button", { name: "Set new password" }));

    expect(await screen.findByText("This link has expired.")).toBeInTheDocument();
  });
});

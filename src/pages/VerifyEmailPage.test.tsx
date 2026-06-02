import { screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import VerifyEmailPage from "./VerifyEmailPage";
import { renderWithProviders } from "../test/renderWithQuery";
import * as auth from "../api/authEndpoints";
import { ApiError } from "../api/client";

afterEach(() => vi.restoreAllMocks());

describe("VerifyEmailPage", () => {
  test("verifies the token from the URL and confirms success", async () => {
    const verify = vi.spyOn(auth, "verifyEmail").mockResolvedValue(undefined);
    renderWithProviders(<VerifyEmailPage />, { initialEntries: ["/verify-email?token=abc"] });

    expect(await screen.findByText(/email verified/i)).toBeInTheDocument();
    expect(verify).toHaveBeenCalledWith("abc");
  });

  test("explains an invalid token", async () => {
    vi.spyOn(auth, "verifyEmail").mockRejectedValue(new ApiError(401, "invalid_token", "x"));
    renderWithProviders(<VerifyEmailPage />, { initialEntries: ["/verify-email?token=abc"] });

    expect(await screen.findByText("This link is invalid or already used.")).toBeInTheDocument();
  });
});

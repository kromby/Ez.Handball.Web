import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import ForgotPasswordPage from "./ForgotPasswordPage";
import { renderWithProviders } from "../test/renderWithQuery";
import * as auth from "../api/authEndpoints";
import { ApiError } from "../api/client";

afterEach(() => vi.restoreAllMocks());

// apostrophe-agnostic: the UI uses a typographic ’, the assertion shouldn't care
const confirmation = /If an account exists for that email, we.ve sent reset instructions\./;

describe("ForgotPasswordPage", () => {
  test("shows the same confirmation on success", async () => {
    vi.spyOn(auth, "requestPasswordReset").mockResolvedValue(undefined);
    renderWithProviders(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText("Email"), "a@b.is");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText(confirmation)).toBeInTheDocument();
  });

  test("shows the same confirmation even when the request errors", async () => {
    vi.spyOn(auth, "requestPasswordReset").mockRejectedValue(new ApiError(500, null, "x"));
    renderWithProviders(<ForgotPasswordPage />);

    await userEvent.type(screen.getByLabelText("Email"), "a@b.is");
    await userEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText(confirmation)).toBeInTheDocument();
  });
});

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import RegisterPage from "./RegisterPage";
import { renderWithProviders } from "../test/renderWithQuery";
import { ApiError } from "../api/client";
import * as endpoints from "../api/endpoints";
import type { Club } from "../api/types";

const clubs: Club[] = [
  { clubId: "385", name: "Afturelding", logoUrl: null },
  { clubId: "412", name: "Fram", logoUrl: null },
];

beforeEach(() => {
  vi.spyOn(endpoints, "getClubs").mockResolvedValue(clubs);
});
afterEach(() => vi.restoreAllMocks());

async function fillDetails() {
  await userEvent.type(screen.getByLabelText("Display name"), "Halla");
  await userEvent.type(screen.getByLabelText("Email"), "a@b.is");
  await userEvent.type(screen.getByLabelText("Password"), "hunter2hunter2");
}

describe("RegisterPage (two-step)", () => {
  test("collects details, then picking a club registers and celebrates", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<RegisterPage />, { auth: { register } });

    await fillDetails();
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));

    const aftur = await screen.findByRole("button", { name: /Afturelding/ });
    await userEvent.click(aftur);

    expect(register).toHaveBeenCalledWith({
      email: "a@b.is",
      password: "hunter2hunter2",
      displayName: "Halla",
      language: "is",
      favoriteClubId: "385",
    });
    expect(await screen.findByText(/you.re in/i)).toBeInTheDocument();
  });

  test("blocks Continue until the details are valid", async () => {
    const register = vi.fn();
    renderWithProviders(<RegisterPage />, { auth: { register } });

    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));

    expect(screen.getByRole("heading", { name: "Your details" })).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  test("email_taken bounces back to the details step with an email error", async () => {
    const register = vi.fn().mockRejectedValue(new ApiError(409, "email_taken", "x"));
    renderWithProviders(<RegisterPage />, { auth: { register } });

    await fillDetails();
    await userEvent.click(screen.getByRole("button", { name: /Continue/ }));
    await userEvent.click(await screen.findByRole("button", { name: /Afturelding/ }));

    expect(await screen.findByText("That email is already registered.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your details" })).toBeInTheDocument();
  });
});

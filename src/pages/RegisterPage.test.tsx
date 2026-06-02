import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import RegisterPage from "./RegisterPage";
import { renderWithProviders } from "../test/renderWithQuery";
import { ApiError } from "../api/client";
import * as endpoints from "../api/endpoints";
import type { Club } from "../api/types";

const clubs: Club[] = [
  { clubId: "385", name: "Afturelding", logoUrl: null },
  { clubId: "412", name: "Fram", logoUrl: null },
];

afterEach(() => vi.restoreAllMocks());

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText("Email"), "a@b.is");
  await userEvent.type(screen.getByLabelText("Password"), "hunter2hunter2");
  await userEvent.type(screen.getByLabelText("Display name"), "Jon");
  await userEvent.selectOptions(screen.getByLabelText("Language"), "is");
  await userEvent.selectOptions(await screen.findByLabelText("Favorite club"), "385");
}

describe("RegisterPage", () => {
  test("registers with the chosen favorite club", async () => {
    vi.spyOn(endpoints, "getClubs").mockResolvedValue(clubs);
    const register = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<RegisterPage />, { auth: { register } });

    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(register).toHaveBeenCalledWith({
      email: "a@b.is",
      password: "hunter2hunter2",
      displayName: "Jon",
      language: "is",
      favoriteClubId: "385",
    });
  });

  test("maps email_taken to the email field", async () => {
    vi.spyOn(endpoints, "getClubs").mockResolvedValue(clubs);
    const register = vi.fn().mockRejectedValue(new ApiError(409, "email_taken", "x"));
    renderWithProviders(<RegisterPage />, { auth: { register } });

    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("That email is already registered.")).toBeInTheDocument();
  });

  test("blocks submission until a club is chosen", async () => {
    vi.spyOn(endpoints, "getClubs").mockResolvedValue(clubs);
    const register = vi.fn();
    renderWithProviders(<RegisterPage />, { auth: { register } });

    await userEvent.type(screen.getByLabelText("Email"), "a@b.is");
    await userEvent.type(screen.getByLabelText("Password"), "hunter2hunter2");
    await userEvent.type(screen.getByLabelText("Display name"), "Jon");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(screen.getByText("Please choose your favorite club.")).toBeInTheDocument());
    expect(register).not.toHaveBeenCalled();
  });
});

import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import AccountPage from "./AccountPage";
import { renderWithProviders } from "../test/renderWithQuery";
import * as endpoints from "../api/endpoints";
import type { AuthUser, Club } from "../api/types";

const clubs: Club[] = [
  { clubId: "385", name: "Afturelding", logoUrl: null },
  { clubId: "412", name: "Fram", logoUrl: null },
];

const verifiedUser: AuthUser = {
  id: "u1", email: "a@b.is", displayName: "Jon", language: "is",
  favoriteClubId: "385", emailVerified: true, createdAt: "2026-06-02T00:00:00Z", lastLoginAt: null,
};
const unverifiedUser: AuthUser = { ...verifiedUser, emailVerified: false };

afterEach(() => vi.restoreAllMocks());

describe("AccountPage", () => {
  test("saves a changed display name", async () => {
    vi.spyOn(endpoints, "getClubs").mockResolvedValue(clubs);
    const updateProfile = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<AccountPage />, {
      auth: { status: "authenticated", user: verifiedUser, updateProfile },
    });

    const nameInput = await screen.findByLabelText("Display name");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Nonni");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateProfile).toHaveBeenCalledWith({
      displayName: "Nonni",
      language: "is",
      favoriteClubId: "385",
    });
  });

  test("shows the verify banner and resends for unverified users", async () => {
    vi.spyOn(endpoints, "getClubs").mockResolvedValue(clubs);
    const resendVerification = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<AccountPage />, {
      auth: { status: "authenticated", user: unverifiedUser, resendVerification },
    });

    expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Resend verification" }));
    expect(resendVerification).toHaveBeenCalled();
  });

  test("logs out", async () => {
    vi.spyOn(endpoints, "getClubs").mockResolvedValue(clubs);
    const logout = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<AccountPage />, {
      auth: { status: "authenticated", user: verifiedUser, logout },
    });

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(logout).toHaveBeenCalledWith(false);
  });
});

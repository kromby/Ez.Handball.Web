import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";
import * as auth from "../api/authEndpoints";
import * as store from "./tokenStore";
import type { AuthResponse, AuthUser } from "../api/types";

const user: AuthUser = {
  id: "u1",
  email: "a@b.is",
  displayName: "Jon",
  language: "is",
  favoriteClubId: "385",
  emailVerified: false,
  createdAt: "2026-06-02T00:00:00Z",
  lastLoginAt: null,
};
const pair: AuthResponse = { accessToken: "a", refreshToken: "r", expiresIn: 900, user };

function Probe() {
  const { status, user, login, logout } = useAuth();
  return (
    <div>
      <p>status: {status}</p>
      <p>user: {user?.displayName ?? "none"}</p>
      <button onClick={() => login("a@b.is", "pw")}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  store.clearSession();
});
afterEach(() => vi.restoreAllMocks());

describe("AuthProvider", () => {
  test("settles to anonymous when there is no stored token", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText("status: anonymous")).toBeInTheDocument();
  });

  test("bootstraps to authenticated when a refresh token is stored", async () => {
    localStorage.setItem("ezhb.refreshToken", "r0");
    vi.spyOn(store, "refresh").mockResolvedValue(true);
    vi.spyOn(auth, "getMe").mockResolvedValue(user);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(await screen.findByText("status: authenticated")).toBeInTheDocument();
    expect(screen.getByText("user: Jon")).toBeInTheDocument();
  });

  test("login stores the session and flips to authenticated", async () => {
    vi.spyOn(auth, "login").mockResolvedValue(pair);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("status: anonymous");
    await userEvent.click(screen.getByRole("button", { name: "login" }));
    expect(await screen.findByText("status: authenticated")).toBeInTheDocument();
    expect(store.getAccessToken()).toBe("a");
  });

  test("logout clears the session and calls the endpoint", async () => {
    vi.spyOn(auth, "login").mockResolvedValue(pair);
    const logoutSpy = vi.spyOn(auth, "logout").mockResolvedValue(undefined);
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await screen.findByText("status: anonymous");
    await userEvent.click(screen.getByRole("button", { name: "login" }));
    await screen.findByText("status: authenticated");
    await userEvent.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() => expect(screen.getByText("status: anonymous")).toBeInTheDocument());
    expect(logoutSpy).toHaveBeenCalledWith("r", false);
    expect(store.getAccessToken()).toBeNull();
  });
});

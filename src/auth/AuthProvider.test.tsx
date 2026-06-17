import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";
import * as auth from "../api/authEndpoints";
import * as store from "./tokenStore";
import type { AuthResponse, AuthUser } from "../api/types";

const user: AuthUser = {
  id: "u1",
  email: "a@b.is",
  displayName: "Jon",
  teamName: "Old FC",
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

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  store.clearSession();
  queryClient = new QueryClient();
});
afterEach(() => vi.restoreAllMocks());

describe("AuthProvider", () => {
  test("settles to anonymous when there is no stored token", async () => {
    render(<Probe />, { wrapper });
    expect(await screen.findByText("status: anonymous")).toBeInTheDocument();
  });

  test("bootstraps to authenticated when a refresh token is stored", async () => {
    localStorage.setItem("ezhb.refreshToken", "r0");
    vi.spyOn(store, "refresh").mockResolvedValue(true);
    vi.spyOn(auth, "getMe").mockResolvedValue(user);

    render(<Probe />, { wrapper });
    expect(await screen.findByText("status: authenticated")).toBeInTheDocument();
    expect(screen.getByText("user: Jon")).toBeInTheDocument();
  });

  test("login stores the session and flips to authenticated", async () => {
    vi.spyOn(auth, "login").mockResolvedValue(pair);
    render(<Probe />, { wrapper });
    await screen.findByText("status: anonymous");
    await userEvent.click(screen.getByRole("button", { name: "login" }));
    expect(await screen.findByText("status: authenticated")).toBeInTheDocument();
    expect(store.getAccessToken()).toBe("a");
  });

  test("logout clears the session and calls the endpoint", async () => {
    vi.spyOn(auth, "login").mockResolvedValue(pair);
    const logoutSpy = vi.spyOn(auth, "logout").mockResolvedValue(undefined);
    render(<Probe />, { wrapper });
    await screen.findByText("status: anonymous");
    await userEvent.click(screen.getByRole("button", { name: "login" }));
    await screen.findByText("status: authenticated");
    await userEvent.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() => expect(screen.getByText("status: anonymous")).toBeInTheDocument());
    expect(logoutSpy).toHaveBeenCalledWith("r", false);
    expect(store.getAccessToken()).toBeNull();
  });

  test("logout clears the React Query cache to prevent cross-user leaks", async () => {
    vi.spyOn(auth, "login").mockResolvedValue(pair);
    vi.spyOn(auth, "logout").mockResolvedValue(undefined);
    queryClient.setQueryData(["shortlist"], { playerIds: ["p1"] });
    render(<Probe />, { wrapper });
    await screen.findByText("status: anonymous");
    await userEvent.click(screen.getByRole("button", { name: "login" }));
    await screen.findByText("status: authenticated");
    await userEvent.click(screen.getByRole("button", { name: "logout" }));
    await waitFor(() => expect(screen.getByText("status: anonymous")).toBeInTheDocument());
    expect(queryClient.getQueryData(["shortlist"])).toBeUndefined();
  });

  test("setTeamName updates the current user's team name", async () => {
    localStorage.setItem("ezhb.refreshToken", "r0");
    vi.spyOn(store, "refresh").mockResolvedValue(true);
    vi.spyOn(auth, "getMe").mockResolvedValue(user);

    function TeamProbe() {
      const { user: u, setTeamName } = useAuth();
      return (
        <>
          <span data-testid="tn">{u?.teamName ?? "-"}</span>
          <button onClick={() => setTeamName("New FC")}>rename</button>
        </>
      );
    }

    render(<TeamProbe />, { wrapper });
    expect(await screen.findByTestId("tn")).toHaveTextContent("Old FC");
    fireEvent.click(screen.getByText("rename"));
    expect(screen.getByTestId("tn")).toHaveTextContent("New FC");
  });
});

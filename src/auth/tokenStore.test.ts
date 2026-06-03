import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as store from "./tokenStore";
import type { AuthResponse } from "../api/types";

const pair: AuthResponse = {
  accessToken: "access-1",
  refreshToken: "refresh-1",
  expiresIn: 900,
  user: {
    id: "u1",
    email: "a@b.is",
    displayName: "Jon",
    language: "is",
    favoriteClubId: "385",
    emailVerified: false,
    createdAt: "2026-06-02T00:00:00Z",
    lastLoginAt: null,
  },
};

function mockFetchOnce(ok: boolean, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 401,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  localStorage.clear();
  store.clearSession();
  store.onSessionCleared(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("tokenStore", () => {
  test("setSession stores access token in memory and refresh token in localStorage", () => {
    store.setSession({ accessToken: "a", refreshToken: "r" });
    expect(store.getAccessToken()).toBe("a");
    expect(localStorage.getItem("ezhb.refreshToken")).toBe("r");
  });

  test("clearSession wipes both", () => {
    store.setSession({ accessToken: "a", refreshToken: "r" });
    store.clearSession();
    expect(store.getAccessToken()).toBeNull();
    expect(store.getRefreshToken()).toBeNull();
  });

  test("refresh posts the stored refresh token and stores the rotated pair", async () => {
    store.setSession({ accessToken: "old", refreshToken: "refresh-0" });
    const fetchMock = mockFetchOnce(true, pair);
    const ok = await store.refresh();
    expect(ok).toBe(true);
    expect(store.getAccessToken()).toBe("access-1");
    expect(store.getRefreshToken()).toBe("refresh-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ refreshToken: "refresh-0" });
  });

  test("concurrent refresh calls hit the endpoint once (single-flight)", async () => {
    store.setSession({ accessToken: "old", refreshToken: "refresh-0" });
    const fetchMock = mockFetchOnce(true, pair);
    const [a, b] = await Promise.all([store.refresh(), store.refresh()]);
    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("failed refresh clears the session and fires onSessionCleared", async () => {
    store.setSession({ accessToken: "old", refreshToken: "refresh-0" });
    const cleared = vi.fn();
    store.onSessionCleared(cleared);
    mockFetchOnce(false, { error: "invalid_token" });
    const ok = await store.refresh();
    expect(ok).toBe(false);
    expect(store.getAccessToken()).toBeNull();
    expect(store.getRefreshToken()).toBeNull();
    expect(cleared).toHaveBeenCalledTimes(1);
  });

  test("refresh with no stored token fails without calling fetch", async () => {
    const fetchMock = mockFetchOnce(true, pair);
    const ok = await store.refresh();
    expect(ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

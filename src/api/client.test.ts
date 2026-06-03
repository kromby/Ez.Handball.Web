import { afterEach, describe, expect, test, vi } from "vitest";
import { apiGet, ApiError, apiPost, authedGet, authedSend } from "./client";
import * as store from "../auth/tokenStore";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetch(response: Partial<Response> & { jsonBody?: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    text: () => Promise.resolve(response.jsonBody !== undefined ? JSON.stringify(response.jsonBody) : ""),
  } as Response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("apiGet", () => {
  test("returns parsed JSON on 200", async () => {
    const fetchMock = mockFetch({ ok: true, status: 200, jsonBody: { hello: "world" } });
    const result = await apiGet<{ hello: string }>("/api/thing");
    expect(result).toEqual({ hello: "world" });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/api/thing"));
  });

  test("throws ApiError with status and code on 404", async () => {
    mockFetch({ ok: false, status: 404, jsonBody: { error: "player_not_found" } });
    const err = await apiGet("/api/players/x").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 404, code: "player_not_found" });
  });

  test("throws ApiError with null code when body is not JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("not json"),
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiGet("/api/x")).rejects.toMatchObject({ status: 500, code: null });
  });
});

describe("authed requests", () => {
  afterEach(() => {
    localStorage.clear();
    store.clearSession();
    vi.unstubAllGlobals();
  });

  test("authedGet attaches the bearer token", async () => {
    store.setSession({ accessToken: "tok", refreshToken: "r" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ id: "u1" })),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const result = await authedGet<{ id: string }>("/api/users/me");
    expect(result).toEqual({ id: "u1" });
    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer tok");
  });

  test("authedGet refreshes once on 401 then retries", async () => {
    store.setSession({ accessToken: "stale", refreshToken: "r" });
    const fetchMock = vi
      .fn()
      // first protected call → 401
      .mockResolvedValueOnce({ ok: false, status: 401, text: () => Promise.resolve("") } as Response)
      // refresh call → new pair
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            JSON.stringify({ accessToken: "fresh", refreshToken: "r2", expiresIn: 900, user: {} }),
          ),
      } as Response)
      // retried protected call → 200
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({ id: "u1" })),
      } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const result = await authedGet<{ id: string }>("/api/users/me");
    expect(result).toEqual({ id: "u1" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(store.getAccessToken()).toBe("fresh");
  });

  test("authedGet clears session and throws when refresh fails", async () => {
    store.setSession({ accessToken: "stale", refreshToken: "r" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401, text: () => Promise.resolve("") } as Response)
      .mockResolvedValueOnce({ ok: false, status: 401, text: () => Promise.resolve("") } as Response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(authedGet("/api/users/me")).rejects.toBeInstanceOf(ApiError);
    expect(store.getAccessToken()).toBeNull();
    // one protected call + one refresh attempt, no retry
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("apiPost posts JSON and parses the body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ accessToken: "a" })),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiPost<{ accessToken: string }>("/api/auth/login", { email: "a@b.is" });
    expect(result).toEqual({ accessToken: "a" });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "a@b.is" });
  });

  test("authedSend returns undefined on 204", async () => {
    store.setSession({ accessToken: "tok", refreshToken: "r" });
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 204, text: () => Promise.resolve("") } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const result = await authedSend<void>("/api/auth/logout", "POST", { refreshToken: "r" });
    expect(result).toBeUndefined();
  });

  test("apiPost maps validation_error details", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({ error: "validation_error", details: { field: "email" } })),
    } as Response);
    vi.stubGlobal("fetch", fetchMock);

    const err = await apiPost("/api/auth/register", {}).catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 400, code: "validation_error", details: { field: "email" } });
  });
});

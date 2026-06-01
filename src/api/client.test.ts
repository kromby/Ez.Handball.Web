import { afterEach, describe, expect, test, vi } from "vitest";
import { apiGet, ApiError } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetch(response: Partial<Response> & { jsonBody?: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: async () => response.jsonBody,
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
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);
    await expect(apiGet("/api/x")).rejects.toMatchObject({ status: 500, code: null });
  });
});

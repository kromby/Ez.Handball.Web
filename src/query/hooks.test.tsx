import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import * as api from "../api/endpoints";
import { ApiError } from "../api/client";
import { AuthContext } from "../auth/useAuth";
import { buildAuth, queryWrapper } from "../test/renderWithQuery";
import { createQueryClient } from "./queryClient";
import { useLeaderboard, usePlayer, useSquad, useBuyPlayer, useSellPlayer, useMiniLeague, useCreateMiniLeague, useInvite, useJoinMiniLeague } from "./hooks";

afterEach(() => vi.restoreAllMocks());

test("useLeaderboard returns data from the endpoint", async () => {
  vi.spyOn(api, "getLeaderboard").mockResolvedValue({
    metric: "goals",
    total: 0,
    offset: 0,
    limit: 50,
    entries: [],
  });
  const { result } = renderHook(() => useLeaderboard("goals", 0, 50), { wrapper: queryWrapper() });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.metric).toBe("goals");
});

test("usePlayer is disabled when id is empty", () => {
  const spy = vi.spyOn(api, "getPlayer").mockResolvedValue({} as never);
  renderHook(() => usePlayer(""), { wrapper: queryWrapper() });
  expect(spy).not.toHaveBeenCalled();
});

function anonymousWrapper() {
  const client = createQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={buildAuth({ status: "anonymous" })}>
        {children}
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

test("useSquad is disabled when not authenticated", () => {
  const spy = vi.spyOn(api, "getSquad");
  renderHook(() => useSquad(), { wrapper: anonymousWrapper() });
  expect(spy).not.toHaveBeenCalled();
});

test("useBuyPlayer writes the returned squad into the cache on success", async () => {
  const squad = { flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 91, currency: "ISK" }, squadValue: { amount: 9, currency: "ISK" } };
  vi.spyOn(api, "buyPlayer").mockResolvedValue(squad as never);
  const client = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useBuyPlayer(), { wrapper });
  await act(async () => { await result.current.mutateAsync("123"); });
  expect(client.getQueryData(["squad", "fantasy"])).toMatchObject({ remainingBudget: { amount: 91 } });
});

test("useSellPlayer writes the returned squad into the cache on success", async () => {
  const squad = { flavor: "fantasy", players: [], budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 33, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" } };
  vi.spyOn(api, "sellPlayer").mockResolvedValue(squad as never);
  const client = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useSellPlayer(), { wrapper });
  await act(async () => { await result.current.mutateAsync("p1"); });
  expect(client.getQueryData(["squad", "fantasy"])).toMatchObject({ remainingBudget: { amount: 33 } });
});

test("useMiniLeague is disabled when not authenticated", () => {
  const spy = vi.spyOn(api, "getMiniLeague");
  renderHook(() => useMiniLeague("abc"), { wrapper: anonymousWrapper() });
  expect(spy).not.toHaveBeenCalled();
});

test("useCreateMiniLeague returns the created league", async () => {
  const league = { id: "abc", name: "L", season: "2025-26", creatorUserId: "u1", memberCount: 1, role: "creator", createdAt: "", members: [] };
  vi.spyOn(api, "createMiniLeague").mockResolvedValue(league as never);
  const client = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useCreateMiniLeague(), { wrapper });
  let created: unknown;
  await act(async () => { created = await result.current.mutateAsync("L"); });
  expect(created).toMatchObject({ id: "abc" });
});

test("useInvite maps 404 no_invite to null", async () => {
  vi.spyOn(api, "getInvite").mockRejectedValue(new ApiError(404, "no_invite", "HTTP 404"));
  const { result } = renderHook(() => useInvite("L1"), { wrapper: queryWrapper() });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toBe(null);
});

test("useInvite rethrows other errors", async () => {
  vi.spyOn(api, "getInvite").mockRejectedValue(new ApiError(403, "not_member", "x"));
  const { result } = renderHook(() => useInvite("L1"), { wrapper: queryWrapper() });
  await waitFor(() => expect(result.current.isError).toBe(true));
});

test("useJoinMiniLeague returns the league", async () => {
  const league = { id: "L1", name: "L", season: "2025-26", creatorUserId: "u1", memberCount: 2, role: "member", createdAt: "", members: [] };
  vi.spyOn(api, "joinMiniLeague").mockResolvedValue(league as never);
  const client = createQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useJoinMiniLeague(), { wrapper });
  let joined: unknown;
  await act(async () => { joined = await result.current.mutateAsync("tok1"); });
  expect(joined).toMatchObject({ id: "L1" });
});

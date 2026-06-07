import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { afterEach, expect, test, vi } from "vitest";
import type { ReactNode } from "react";
import * as api from "../api/endpoints";
import { AuthContext } from "../auth/useAuth";
import { buildAuth, queryWrapper } from "../test/renderWithQuery";
import { createQueryClient } from "./queryClient";
import { useLeaderboard, usePlayer, useSquad, useBuyPlayer } from "./hooks";

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

import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import { queryWrapper } from "../test/renderWithQuery";
import { useLeaderboard, usePlayer } from "./hooks";

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

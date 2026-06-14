import { renderHook, act } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { formatCountdown, useCountdown } from "./useCountdown";

test("formatCountdown shows days/hours/minutes when >= 1 day", () => {
  const ms = (2 * 86400 + 3 * 3600 + 14 * 60 + 9) * 1000;
  expect(formatCountdown(ms)).toEqual({ locked: false, label: "2d 03h 14m" });
});

test("formatCountdown shows hours/minutes/seconds when < 1 day", () => {
  const ms = (3 * 3600 + 14 * 60 + 9) * 1000;
  expect(formatCountdown(ms)).toEqual({ locked: false, label: "03h 14m 09s" });
});

test("formatCountdown reports locked at or past zero", () => {
  expect(formatCountdown(0)).toEqual({ locked: true, label: "" });
  expect(formatCountdown(-5000)).toEqual({ locked: true, label: "" });
});

test("useCountdown ticks toward the deadline", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-13T00:00:00Z"));
  const deadline = "2026-06-13T00:00:10Z";
  const { result } = renderHook(() => useCountdown(deadline));
  expect(result.current.label).toBe("00h 00m 10s");
  act(() => {
    vi.advanceTimersByTime(3000);
  });
  expect(result.current.label).toBe("00h 00m 07s");
  vi.useRealTimers();
});

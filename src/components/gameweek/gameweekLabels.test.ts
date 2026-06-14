import { expect, test } from "vitest";
import type { Gameweek } from "../../api/types";
import {
  gameweekLabelKey,
  isCurrent,
  roundByLabel,
  sectionGameweeks,
} from "./gameweekLabels";

function gw(number: number, status: Gameweek["status"]): Gameweek {
  return {
    number,
    roundLabel: String(number),
    tournamentId: "8444",
    deadline: "2026-06-20T16:00:00Z",
    status,
    matches: [],
  };
}

test("Open maps to open when current, upcoming otherwise", () => {
  expect(gameweekLabelKey("Open", true)).toBe("open");
  expect(gameweekLabelKey("Open", false)).toBe("upcoming");
});

test("non-open statuses map directly regardless of current", () => {
  expect(gameweekLabelKey("DeadlineLocked", true)).toBe("locked");
  expect(gameweekLabelKey("InPlay", false)).toBe("live");
  expect(gameweekLabelKey("Settled", false)).toBe("final");
});

test("sectionGameweeks splits around the current gameweek", () => {
  const all = [gw(5, "Settled"), gw(6, "InPlay"), gw(7, "Open"), gw(8, "Open")];
  const sections = sectionGameweeks(all, gw(7, "Open"), gw(5, "Settled"));
  expect(sections.hero?.number).toBe(7);
  expect(sections.comingUp.map((g) => g.number)).toEqual([8]);
  expect(sections.results.map((g) => g.number)).toEqual([6, 5]);
});

test("a past InPlay gameweek lands in results", () => {
  const all = [gw(6, "InPlay"), gw(7, "Open")];
  const sections = sectionGameweeks(all, gw(7, "Open"), null);
  expect(sections.results.map((g) => g.number)).toEqual([6]);
});

test("falls back to lastSettled hero when current is null", () => {
  const all = [gw(5, "Settled"), gw(6, "Settled")];
  const sections = sectionGameweeks(all, null, gw(6, "Settled"));
  expect(sections.hero?.number).toBe(6);
  expect(sections.results.map((g) => g.number)).toEqual([5]);
});

test("empty when no current and no lastSettled", () => {
  const sections = sectionGameweeks([gw(1, "Open")], null, null);
  expect(sections.hero).toBeNull();
  expect(sections.comingUp).toEqual([]);
  expect(sections.results).toEqual([]);
});

test("isCurrent is true only for the current gameweek number", () => {
  expect(isCurrent(gw(7, "Open"), gw(7, "Open"))).toBe(true);
  expect(isCurrent(gw(6, "InPlay"), gw(7, "Open"))).toBe(false);
  expect(isCurrent(gw(7, "Open"), null)).toBe(false);
});

test("roundByLabel finds the matching round group", () => {
  const listing = {
    tournamentId: "8444",
    tournamentName: "Olís",
    season: "2025-26",
    rounds: [
      { round: "7", startDate: "2026-06-20", endDate: "2026-06-21", matches: [] },
    ],
  };
  expect(roundByLabel(listing, "7")?.round).toBe("7");
  expect(roundByLabel(listing, "9")).toBeUndefined();
  expect(roundByLabel(undefined, "7")).toBeUndefined();
});

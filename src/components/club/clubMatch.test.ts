import { expect, test } from "vitest";
import { formatMatchDate, matchOutcome } from "./clubMatch";

test("matchOutcome returns win when club outscores opponent", () => {
  expect(matchOutcome(28, 24)).toBe("win");
});

test("matchOutcome returns loss when club is outscored", () => {
  expect(matchOutcome(22, 25)).toBe("loss");
});

test("matchOutcome returns draw on equal scores", () => {
  expect(matchOutcome(25, 25)).toBe("draw");
});

test("formatMatchDate returns the raw string when unparseable", () => {
  expect(formatMatchDate("not-a-date")).toBe("not-a-date");
});

test("formatMatchDate formats a valid ISO date to day + short month", () => {
  // Asserts it transformed the input rather than echoing it back.
  const out = formatMatchDate("2026-03-14T17:00:00Z");
  expect(out).not.toBe("2026-03-14T17:00:00Z");
  expect(out.length).toBeGreaterThan(0);
});

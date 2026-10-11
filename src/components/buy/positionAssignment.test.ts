import { expect, test } from "vitest";
import { eligiblePositions, solvePositions } from "./positionAssignment";

test("eligiblePositions: primary first, drops blank or duplicate secondary", () => {
  expect(eligiblePositions("CB", "LB")).toEqual(["CB", "LB"]);
  expect(eligiblePositions("CB", "")).toEqual(["CB"]);
  expect(eligiblePositions("CB", null)).toEqual(["CB"]);
  expect(eligiblePositions("CB", "CB")).toEqual(["CB"]);
  expect(eligiblePositions(null, "LB")).toEqual([]);
});

test("single-position players within the cap fit", () => {
  expect(solvePositions([["CB"], ["CB"]], { CB: 2 })).toBe(true);
});

test("single-position players over the cap don't fit", () => {
  expect(solvePositions([["CB"], ["CB"], ["CB"]], { CB: 2 })).toBe(false);
});

test("backtracks: a dual player listed first moves to their secondary", () => {
  expect(solvePositions([["CB", "LB"], ["CB"]], { CB: 1, LB: 1 })).toBe(true);
});

test("unknown positions and positions without a cap never block", () => {
  expect(solvePositions([[], ["FP"], ["FP"], ["CB"]], { CB: 1 })).toBe(true);
});

import { expect, test } from "vitest";
import { evaluateBuy } from "./buyState";
import type { Squad, SquadConstraints } from "../../api/types";

const constraints: SquadConstraints = {
  ruleSetVersion: 1, maxSquadSize: 2, startingCap: { amount: 100, currency: "ISK" },
  posLimits: { GK: 1, CB: 2 },
};
const emptySquad: Squad = {
  flavor: "fantasy", players: [],
  budgetUsed: { amount: 0, currency: "ISK" }, remainingBudget: { amount: 50, currency: "ISK" }, squadValue: { amount: 0, currency: "ISK" },
};

test("owned takes priority", () => {
  const squad: Squad = { ...emptySquad, players: [{ playerId: "p1", name: null, clubId: null, clubName: null, position: "CB", gender: null, price: null, rating: 0, pricePaid: { amount: 10, currency: "ISK" } }] };
  expect(evaluateBuy({ playerId: "p1", position: "CB", price: { amount: 10, currency: "ISK" } }, squad, constraints).state).toBe("owned");
});

test("squad full", () => {
  const full: Squad = { ...emptySquad, players: [
    { playerId: "a", name: null, clubId: null, clubName: null, position: "CB", gender: null, price: null, rating: 0, pricePaid: { amount: 1, currency: "ISK" } },
    { playerId: "b", name: null, clubId: null, clubName: null, position: "CB", gender: null, price: null, rating: 0, pricePaid: { amount: 1, currency: "ISK" } },
  ] };
  expect(evaluateBuy({ playerId: "p2", position: "GK", price: { amount: 1, currency: "ISK" } }, full, constraints).reason).toBe("squad_full");
});

test("position limit", () => {
  const squad: Squad = { ...emptySquad, players: [
    { playerId: "a", name: null, clubId: null, clubName: null, position: "GK", gender: null, price: null, rating: 0, pricePaid: { amount: 1, currency: "ISK" } },
  ] };
  expect(evaluateBuy({ playerId: "p2", position: "GK", price: { amount: 1, currency: "ISK" } }, squad, constraints).reason).toBe("position_limit");
});

test("insufficient budget", () => {
  expect(evaluateBuy({ playerId: "p2", position: "GK", price: { amount: 999, currency: "ISK" } }, emptySquad, constraints).reason).toBe("insufficient_budget");
});

test("buyable when all rules pass", () => {
  expect(evaluateBuy({ playerId: "p2", position: "GK", price: { amount: 10, currency: "ISK" } }, emptySquad, constraints).state).toBe("buyable");
});

test("unavailable when position is missing", () => {
  expect(evaluateBuy({ playerId: "p2", position: null, price: { amount: 10, currency: "ISK" } }, emptySquad, constraints).state).toBe("unavailable");
});

test("unavailable when price is missing", () => {
  expect(evaluateBuy({ playerId: "p2", position: "GK", price: null }, emptySquad, constraints).state).toBe("unavailable");
});

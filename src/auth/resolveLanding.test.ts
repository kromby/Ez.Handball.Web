import { afterEach, expect, test, vi } from "vitest";
import * as api from "../api/endpoints";
import type { Manager } from "../api/types";
import { resolveLanding } from "./resolveLanding";

afterEach(() => vi.restoreAllMocks());

function manager(squadComplete: boolean): Manager {
  return {
    flavor: "fantasy", teamName: "FC", favoriteClubId: "385", color: "#1E88E5",
    onboarding: { squadComplete, playersOwned: squadComplete ? 15 : 9, squadSize: 15 },
  };
}

test("honors an explicit 'from' without fetching the manager", async () => {
  const spy = vi.spyOn(api, "getManager").mockResolvedValue(manager(false));
  expect(await resolveLanding("/leagues")).toBe("/leagues");
  expect(spy).not.toHaveBeenCalled();
});

test("routes to /players when the squad is incomplete", async () => {
  vi.spyOn(api, "getManager").mockResolvedValue(manager(false));
  expect(await resolveLanding()).toBe("/players");
});

test("routes to / when the squad is complete", async () => {
  vi.spyOn(api, "getManager").mockResolvedValue(manager(true));
  expect(await resolveLanding()).toBe("/");
});

test("falls back to / when the manager fetch fails", async () => {
  vi.spyOn(api, "getManager").mockRejectedValue(new Error("boom"));
  expect(await resolveLanding()).toBe("/");
});

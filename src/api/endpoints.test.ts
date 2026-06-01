import { afterEach, expect, test, vi } from "vitest";
import { getLeaderboard, getPlayer, getPlayerHistory, getPlayerStats, getMatch } from "./endpoints";
import * as client from "./client";

afterEach(() => vi.restoreAllMocks());

function spyGet() {
  return vi.spyOn(client, "apiGet").mockResolvedValue({} as never);
}

test("getLeaderboard builds query string with metric/offset/limit", async () => {
  const spy = spyGet();
  await getLeaderboard({ metric: "goals", offset: 50, limit: 50 });
  expect(spy).toHaveBeenCalledWith("/api/leaderboard?metric=goals&offset=50&limit=50");
});

test("getLeaderboard omits empty params", async () => {
  const spy = spyGet();
  await getLeaderboard({});
  expect(spy).toHaveBeenCalledWith("/api/leaderboard");
});

test("getPlayer encodes the id", async () => {
  const spy = spyGet();
  await getPlayer("a/b");
  expect(spy).toHaveBeenCalledWith("/api/players/a%2Fb");
});

test("getPlayerHistory hits the history path", async () => {
  const spy = spyGet();
  await getPlayerHistory("7");
  expect(spy).toHaveBeenCalledWith("/api/players/7/history");
});

test("getPlayerStats hits the stats path", async () => {
  const spy = spyGet();
  await getPlayerStats("7");
  expect(spy).toHaveBeenCalledWith("/api/players/7/stats");
});

test("getMatch hits the match path", async () => {
  const spy = spyGet();
  await getMatch("99");
  expect(spy).toHaveBeenCalledWith("/api/matches/99");
});

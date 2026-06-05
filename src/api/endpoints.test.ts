import { afterEach, expect, test, vi } from "vitest";
import { getLeaderboard, getPlayer, getPlayerHistory, getPlayerStats, getMatch, getShortlist, addToShortlist, removeFromShortlist, getSeasons, getTournaments, getGenders } from "./endpoints";
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

function spyAuthedGet() {
  return vi.spyOn(client, "authedGet").mockResolvedValue({} as never);
}
function spyAuthedSend() {
  return vi.spyOn(client, "authedSend").mockResolvedValue(undefined as never);
}

test("getShortlist hits the shortlist path", async () => {
  const spy = spyAuthedGet();
  await getShortlist();
  expect(spy).toHaveBeenCalledWith("/api/users/me/shortlist");
});

test("addToShortlist PUTs the encoded player id", async () => {
  const spy = spyAuthedSend();
  await addToShortlist("a/b");
  expect(spy).toHaveBeenCalledWith("/api/users/me/shortlist/a%2Fb", "PUT");
});

test("removeFromShortlist DELETEs the encoded player id", async () => {
  const spy = spyAuthedSend();
  await removeFromShortlist("a/b");
  expect(spy).toHaveBeenCalledWith("/api/users/me/shortlist/a%2Fb", "DELETE");
});

test("getLeaderboard includes filters when present", async () => {
  const spy = spyGet();
  await getLeaderboard({ metric: "goals", season: "2025-26", tournamentId: "8444", gender: "karlar" });
  expect(spy).toHaveBeenCalledWith("/api/leaderboard?metric=goals&season=2025-26&tournamentId=8444&gender=karlar");
});

test("getLeaderboard omits filters when absent", async () => {
  const spy = spyGet();
  await getLeaderboard({ metric: "goals" });
  expect(spy).toHaveBeenCalledWith("/api/leaderboard?metric=goals");
});

test("getSeasons requests /api/seasons", async () => {
  const spy = spyGet();
  await getSeasons();
  expect(spy).toHaveBeenCalledWith("/api/seasons");
});

test("getTournaments encodes the season into the query", async () => {
  const spy = spyGet();
  await getTournaments("2025/26");
  expect(spy).toHaveBeenCalledWith("/api/tournaments?season=2025%2F26");
});

test("getGenders requests /api/genders", async () => {
  const spy = spyGet();
  await getGenders();
  expect(spy).toHaveBeenCalledWith("/api/genders");
});

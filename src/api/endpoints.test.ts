import { afterEach, expect, test, vi } from "vitest";
import { getLeaderboard, getPlayer, getPlayerHistory, getPlayerStats, getMatch, getShortlist, addToShortlist, removeFromShortlist, getSeasons, getTournaments, getGenders, getSquad, getSquadConstraints, getPlayerPool, buyPlayer, sellPlayer, createMiniLeague, getMiniLeague, getInvite, generateInvite, previewInvite, joinMiniLeague } from "./endpoints";
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

test("getSquad calls the authed squad endpoint", async () => {
  const spy = spyAuthedGet();
  await getSquad();
  expect(spy).toHaveBeenCalledWith("/api/users/me/squad?flavor=fantasy");
});

test("getSquadConstraints calls the public constraints endpoint", async () => {
  const spy = spyGet();
  await getSquadConstraints();
  expect(spy).toHaveBeenCalledWith("/api/squad/constraints?flavor=fantasy");
});

test("getPlayerPool builds the query string from params", async () => {
  const spy = spyGet();
  await getPlayerPool({ season: "2025-26", position: "GK", sort: "Price", offset: 0, limit: 50 });
  const url = spy.mock.calls[0][0] as string;
  expect(url).toContain("/api/players/pool?");
  expect(url).toContain("season=2025-26");
  expect(url).toContain("position=GK");
  expect(url).toContain("sort=Price");
  // offset=0 must survive (the `!= null` guard, not a truthy check)
  expect(url).toContain("offset=0");
  expect(url).toContain("limit=50");
});

test("getPlayerPool omits empty params", async () => {
  const spy = spyGet();
  await getPlayerPool({});
  expect(spy).toHaveBeenCalledWith("/api/players/pool");
});

test("buyPlayer POSTs the playerId + flavor body", async () => {
  const spy = vi.spyOn(client, "authedSend").mockResolvedValue({} as never);
  await buyPlayer("123");
  expect(spy).toHaveBeenCalledWith("/api/users/me/squad/players", "POST", { playerId: "123", flavor: "fantasy" });
});

test("sellPlayer DELETEs the encoded player id with flavor", async () => {
  const spy = vi.spyOn(client, "authedSend").mockResolvedValue({} as never);
  await sellPlayer("a/b");
  expect(spy).toHaveBeenCalledWith("/api/users/me/squad/players/a%2Fb?flavor=fantasy", "DELETE");
});

test("createMiniLeague POSTs to /api/mini-leagues with name body", async () => {
  const spy = vi.spyOn(client, "authedSend").mockResolvedValue({} as never);
  await createMiniLeague("Office Olís");
  expect(spy).toHaveBeenCalledWith("/api/mini-leagues", "POST", { name: "Office Olís" });
});

test("getMiniLeague calls the authed get for /api/mini-leagues/:id", async () => {
  const spy = spyAuthedGet();
  await getMiniLeague("abc123");
  expect(spy).toHaveBeenCalledWith("/api/mini-leagues/abc123");
});

test("getInvite calls authedGet for /api/mini-leagues/:id/invite", async () => {
  const spy = spyAuthedGet();
  await getInvite("L1");
  expect(spy).toHaveBeenCalledWith("/api/mini-leagues/L1/invite");
});

test("generateInvite POSTs to /api/mini-leagues/:id/invite with empty body", async () => {
  const spy = vi.spyOn(client, "authedSend").mockResolvedValue({} as never);
  await generateInvite("L1");
  expect(spy).toHaveBeenCalledWith("/api/mini-leagues/L1/invite", "POST", {});
});

test("previewInvite calls authedGet for /api/mini-leagues/invite/:token", async () => {
  const spy = spyAuthedGet();
  await previewInvite("tok1");
  expect(spy).toHaveBeenCalledWith("/api/mini-leagues/invite/tok1");
});

test("joinMiniLeague POSTs to /api/mini-leagues/join with token body", async () => {
  const spy = vi.spyOn(client, "authedSend").mockResolvedValue({} as never);
  await joinMiniLeague("tok1");
  expect(spy).toHaveBeenCalledWith("/api/mini-leagues/join", "POST", { token: "tok1" });
});

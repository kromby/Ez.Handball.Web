import { apiGet, authedGet, authedSend } from "./client";
import type {
  Club,
  CurrentGameweek,
  Gameweek,
  Gender,
  Invite,
  InvitePreview,
  Leaderboard,
  LeaderboardMetric,
  MatchDetail,
  MiniLeague,
  Player,
  PlayerHistoryResponse,
  PlayerPool,
  PlayerStatsResponse,
  PoolSort,
  RoundListing,
  Season,
  ShortlistResponse,
  Squad,
  SquadConstraints,
  Tournament,
} from "./types";

export function getLeaderboard(params: {
  metric?: LeaderboardMetric;
  offset?: number;
  limit?: number;
  season?: string;
  tournamentId?: string;
  gender?: string;
}): Promise<Leaderboard> {
  const searchParams = new URLSearchParams();
  if (params.metric) searchParams.set("metric", params.metric);
  if (params.offset != null) searchParams.set("offset", String(params.offset));
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  if (params.season) searchParams.set("season", params.season);
  if (params.tournamentId) searchParams.set("tournamentId", params.tournamentId);
  if (params.gender) searchParams.set("gender", params.gender);
  const queryString = searchParams.toString();
  return apiGet<Leaderboard>(`/api/leaderboard${queryString ? `?${queryString}` : ""}`);
}

export function getSeasons(): Promise<Season[]> {
  return apiGet<Season[]>("/api/seasons");
}

export function getTournaments(season: string): Promise<Tournament[]> {
  return apiGet<Tournament[]>(`/api/tournaments?season=${encodeURIComponent(season)}`);
}

export function getGenders(): Promise<Gender[]> {
  return apiGet<Gender[]>("/api/genders");
}

export function getPlayer(id: string): Promise<Player> {
  return apiGet<Player>(`/api/players/${encodeURIComponent(id)}`);
}

export function getPlayerHistory(id: string): Promise<PlayerHistoryResponse> {
  return apiGet<PlayerHistoryResponse>(`/api/players/${encodeURIComponent(id)}/history`);
}

export function getPlayerStats(id: string): Promise<PlayerStatsResponse> {
  return apiGet<PlayerStatsResponse>(`/api/players/${encodeURIComponent(id)}/stats`);
}

export function getMatch(id: string): Promise<MatchDetail> {
  return apiGet<MatchDetail>(`/api/matches/${encodeURIComponent(id)}`);
}

export function getClubs(): Promise<Club[]> {
  return apiGet<Club[]>("/api/clubs");
}

export function getShortlist(): Promise<ShortlistResponse> {
  return authedGet<ShortlistResponse>("/api/users/me/shortlist");
}

export async function addToShortlist(playerId: string): Promise<void> {
  await authedSend(`/api/users/me/shortlist/${encodeURIComponent(playerId)}`, "PUT");
}

export async function removeFromShortlist(playerId: string): Promise<void> {
  await authedSend(`/api/users/me/shortlist/${encodeURIComponent(playerId)}`, "DELETE");
}

export function getSquad(flavor = "fantasy"): Promise<Squad> {
  return authedGet<Squad>(`/api/users/me/squad?flavor=${encodeURIComponent(flavor)}`);
}

export function getSquadConstraints(flavor = "fantasy"): Promise<SquadConstraints> {
  return apiGet<SquadConstraints>(`/api/squad/constraints?flavor=${encodeURIComponent(flavor)}`);
}

export function getPlayers(params: {
  season?: string;
  tournamentId?: string;
  gender?: string;
  position?: string;
  sort?: PoolSort;
  offset?: number;
  limit?: number;
}): Promise<PlayerPool> {
  const sp = new URLSearchParams();
  if (params.season) sp.set("season", params.season);
  if (params.tournamentId) sp.set("tournamentId", params.tournamentId);
  if (params.gender) sp.set("gender", params.gender);
  if (params.position) sp.set("position", params.position);
  if (params.sort) sp.set("sort", params.sort);
  if (params.offset != null) sp.set("offset", String(params.offset));
  if (params.limit != null) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return apiGet<PlayerPool>(`/api/players${qs ? `?${qs}` : ""}`);
}

export function buyPlayer(playerId: string, flavor = "fantasy"): Promise<Squad> {
  return authedSend<Squad>("/api/users/me/squad/players", "POST", { playerId, flavor });
}

export function sellPlayer(playerId: string, flavor = "fantasy"): Promise<Squad> {
  return authedSend<Squad>(
    `/api/users/me/squad/players/${encodeURIComponent(playerId)}?flavor=${encodeURIComponent(flavor)}`,
    "DELETE",
  );
}

export function createMiniLeague(name: string): Promise<MiniLeague> {
  return authedSend<MiniLeague>("/api/mini-leagues", "POST", { name });
}

export function getMiniLeague(id: string): Promise<MiniLeague> {
  return authedGet<MiniLeague>(`/api/mini-leagues/${encodeURIComponent(id)}`);
}

export function getInvite(id: string): Promise<Invite> {
  return authedGet<Invite>(`/api/mini-leagues/${encodeURIComponent(id)}/invite`);
}

export function generateInvite(id: string): Promise<Invite> {
  return authedSend<Invite>(`/api/mini-leagues/${encodeURIComponent(id)}/invite`, "POST", {});
}

export function previewInvite(token: string): Promise<InvitePreview> {
  return authedGet<InvitePreview>(`/api/mini-leagues/invite/${encodeURIComponent(token)}`);
}

export function joinMiniLeague(token: string): Promise<MiniLeague> {
  return authedSend<MiniLeague>("/api/mini-leagues/join", "POST", { token });
}

export function getGameweeks(version?: number): Promise<Gameweek[]> {
  const qs = version != null ? `?version=${version}` : "";
  return apiGet<Gameweek[]>(`/api/gameweeks${qs}`);
}

export function getCurrentGameweek(version?: number): Promise<CurrentGameweek> {
  const qs = version != null ? `?version=${version}` : "";
  return apiGet<CurrentGameweek>(`/api/gameweeks/current${qs}`);
}

export function getRounds(tournamentId: string): Promise<RoundListing> {
  return apiGet<RoundListing>(`/api/tournaments/${encodeURIComponent(tournamentId)}/rounds`);
}

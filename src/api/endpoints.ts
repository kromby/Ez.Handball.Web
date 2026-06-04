import { apiGet, authedGet, authedSend } from "./client";
import type {
  Club,
  Leaderboard,
  LeaderboardMetric,
  MatchDetail,
  Player,
  PlayerHistoryResponse,
  PlayerStatsResponse,
  ShortlistResponse,
} from "./types";

export function getLeaderboard(params: {
  metric?: LeaderboardMetric;
  offset?: number;
  limit?: number;
}): Promise<Leaderboard> {
  const searchParams = new URLSearchParams();
  if (params.metric) searchParams.set("metric", params.metric);
  if (params.offset != null) searchParams.set("offset", String(params.offset));
  if (params.limit != null) searchParams.set("limit", String(params.limit));
  const queryString = searchParams.toString();
  return apiGet<Leaderboard>(`/api/leaderboard${queryString ? `?${queryString}` : ""}`);
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

export function addToShortlist(playerId: string): Promise<void> {
  return authedSend<void>(`/api/users/me/shortlist/${encodeURIComponent(playerId)}`, "PUT");
}

export function removeFromShortlist(playerId: string): Promise<void> {
  return authedSend<void>(`/api/users/me/shortlist/${encodeURIComponent(playerId)}`, "DELETE");
}

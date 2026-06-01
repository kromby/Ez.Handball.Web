import { apiGet } from "./client";
import type {
  Leaderboard,
  LeaderboardMetric,
  MatchDetail,
  Player,
  PlayerHistoryResponse,
  PlayerStatsResponse,
} from "./types";

export function getLeaderboard(params: {
  metric?: LeaderboardMetric;
  offset?: number;
  limit?: number;
}): Promise<Leaderboard> {
  const q = new URLSearchParams();
  if (params.metric) q.set("metric", params.metric);
  if (params.offset != null) q.set("offset", String(params.offset));
  if (params.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return apiGet<Leaderboard>(`/api/leaderboard${qs ? `?${qs}` : ""}`);
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

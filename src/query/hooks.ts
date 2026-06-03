import { useQuery } from "@tanstack/react-query";
import * as api from "../api/endpoints";
import type { LeaderboardMetric } from "../api/types";

export function useLeaderboard(metric: LeaderboardMetric, offset: number, limit: number) {
  return useQuery({
    queryKey: ["leaderboard", metric, offset, limit],
    queryFn: () => api.getLeaderboard({ metric, offset, limit }),
  });
}

export function usePlayer(id: string) {
  return useQuery({
    queryKey: ["player", id],
    queryFn: () => api.getPlayer(id),
    enabled: id.length > 0,
  });
}

export function usePlayerHistory(id: string) {
  return useQuery({
    queryKey: ["player-history", id],
    queryFn: () => api.getPlayerHistory(id),
    enabled: id.length > 0,
  });
}

export function usePlayerStats(id: string) {
  return useQuery({
    queryKey: ["player-stats", id],
    queryFn: () => api.getPlayerStats(id),
    enabled: id.length > 0,
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ["match", id],
    queryFn: () => api.getMatch(id),
    enabled: id.length > 0,
  });
}

export function useClubs() {
  return useQuery({
    queryKey: ["clubs"],
    queryFn: () => api.getClubs(),
    staleTime: Infinity,
  });
}

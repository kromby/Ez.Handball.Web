import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/endpoints";
import type { LeaderboardMetric, PoolSort, ShortlistItem, ShortlistResponse } from "../api/types";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/useAuth";

export function useLeaderboard(
  metric: LeaderboardMetric,
  offset: number,
  limit: number,
  filters: { season?: string; tournamentId?: string; gender?: string } = {},
  options: { enabled?: boolean } = {},
) {
  const { season, tournamentId, gender } = filters;
  return useQuery({
    queryKey: ["leaderboard", metric, offset, limit, season ?? null, tournamentId ?? null, gender ?? null],
    queryFn: () => api.getLeaderboard({ metric, offset, limit, season, tournamentId, gender }),
    enabled: options.enabled ?? true,
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

export function useClub(id: string) {
  return useQuery({
    queryKey: ["club", id],
    queryFn: () => api.getClub(id),
    enabled: id.length > 0,
  });
}

export function useClubRoster(id: string) {
  return useQuery({
    queryKey: ["club-roster", id],
    queryFn: () => api.getClubRoster(id),
    enabled: id.length > 0,
  });
}

export function useSeasons() {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: () => api.getSeasons(),
    staleTime: Infinity,
  });
}

export function useTournaments(season: string | undefined) {
  return useQuery({
    queryKey: ["tournaments", season ?? null],
    queryFn: () => api.getTournaments(season as string),
    enabled: Boolean(season),
    staleTime: Infinity,
  });
}

export function useGenders() {
  return useQuery({
    queryKey: ["genders"],
    queryFn: () => api.getGenders(),
    staleTime: Infinity,
  });
}

export function useCurrentGameweek() {
  return useQuery({
    queryKey: ["gameweek-current"],
    queryFn: () => api.getCurrentGameweek(),
  });
}

export function useGameweeks() {
  return useQuery({
    queryKey: ["gameweeks"],
    queryFn: () => api.getGameweeks(),
  });
}

export function useRounds(tournamentId: string | undefined) {
  return useQuery({
    queryKey: ["rounds", tournamentId ?? null],
    queryFn: () => api.getRounds(tournamentId as string),
    enabled: Boolean(tournamentId),
    staleTime: Infinity,
  });
}

const SHORTLIST_KEY = ["shortlist"] as const;

export function useShortlist() {
  const { status } = useAuth();
  return useQuery({
    queryKey: SHORTLIST_KEY,
    queryFn: () => api.getShortlist(),
    enabled: status === "authenticated",
  });
}

export function useAddToShortlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) => api.addToShortlist(playerId),
    onMutate: async (playerId: string) => {
      await qc.cancelQueries({ queryKey: SHORTLIST_KEY });
      const prev = qc.getQueryData<ShortlistResponse>(SHORTLIST_KEY);
      if (prev && !prev.items.some((i) => i.playerId === playerId)) {
        const optimistic: ShortlistItem = {
          playerId, name: null, clubId: null, clubName: null, position: null,
          gender: null, price: null, pickPercentage: null, createdAt: "",
        };
        qc.setQueryData<ShortlistResponse>(SHORTLIST_KEY, {
          ...prev, items: [...prev.items, optimistic], count: prev.count + 1,
        });
      }
      return { prev };
    },
    onError: (_err, _playerId, ctx) => {
      if (ctx?.prev) qc.setQueryData(SHORTLIST_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: SHORTLIST_KEY }),
  });
}

export function useRemoveFromShortlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) => api.removeFromShortlist(playerId),
    onMutate: async (playerId: string) => {
      await qc.cancelQueries({ queryKey: SHORTLIST_KEY });
      const prev = qc.getQueryData<ShortlistResponse>(SHORTLIST_KEY);
      if (prev) {
        const wasMember = prev.items.some((i) => i.playerId === playerId);
        qc.setQueryData<ShortlistResponse>(SHORTLIST_KEY, {
          ...prev,
          items: prev.items.filter((i) => i.playerId !== playerId),
          count: Math.max(0, prev.count - (wasMember ? 1 : 0)),
        });
      }
      return { prev };
    },
    onError: (_err, _playerId, ctx) => {
      if (ctx?.prev) qc.setQueryData(SHORTLIST_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: SHORTLIST_KEY }),
  });
}

const SQUAD_KEY = (flavor = "fantasy") => ["squad", flavor] as const;

export function useSquad(flavor = "fantasy") {
  const { status } = useAuth();
  return useQuery({
    queryKey: SQUAD_KEY(flavor),
    queryFn: () => api.getSquad(flavor),
    enabled: status === "authenticated",
  });
}

export function useMyGameweeks() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["my-gameweeks"],
    queryFn: () => api.getMyGameweeks(),
    enabled: status === "authenticated",
  });
}

export function useSquadConstraints(flavor = "fantasy", options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["squad-constraints", flavor],
    queryFn: () => api.getSquadConstraints(flavor),
    staleTime: Infinity,
    enabled: options.enabled ?? true,
  });
}

export function useBuyPlayer(flavor = "fantasy") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) => api.buyPlayer(playerId, flavor),
    onSuccess: (result) => {
      qc.setQueryData(SQUAD_KEY(flavor), result.squad);
      qc.invalidateQueries({ queryKey: ["gameweek-current"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: SQUAD_KEY(flavor) }),
  });
}

export function usePlayers(params: {
  season?: string;
  tournamentId?: string;
  gender?: string;
  position?: string;
  name?: string;
  clubId?: string;
  sort?: PoolSort;
  offset?: number;
  limit?: number;
}, options: { enabled?: boolean } = {}) {
  const { season, tournamentId, gender, position, name, clubId, sort, offset, limit } = params;
  return useQuery({
    queryKey: ["players", season ?? null, tournamentId ?? null, gender ?? null, position ?? null, name ?? null, clubId ?? null, sort ?? "Goals", offset ?? 0, limit ?? 50],
    queryFn: () => api.getPlayers(params),
    enabled: options.enabled ?? true,
  });
}

export function useSellPlayer(flavor = "fantasy") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playerId: string) => api.sellPlayer(playerId, flavor),
    onSuccess: (result) => {
      qc.setQueryData(SQUAD_KEY(flavor), result.squad);
      qc.invalidateQueries({ queryKey: ["gameweek-current"] });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: SQUAD_KEY(flavor) }),
  });
}

export function useMiniLeague(id: string) {
  const { status } = useAuth();
  return useQuery({
    queryKey: ["mini-league", id],
    queryFn: () => api.getMiniLeague(id),
    enabled: status === "authenticated" && id.length > 0,
  });
}

export function useCreateMiniLeague() {
  return useMutation({
    mutationFn: (name: string) => api.createMiniLeague(name),
  });
}

export function useInvite(id: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["invite", id],
    queryFn: async (): Promise<import("../api/types").Invite | null> => {
      try {
        return await api.getInvite(id);
      } catch (err) {
        if (err instanceof ApiError && err.code === "no_invite") return null;
        throw err;
      }
    },
    enabled: options.enabled ?? true,
    staleTime: Infinity,
  });
}

export function useGenerateInvite(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.generateInvite(id),
    onSuccess: (invite) => qc.setQueryData(["invite", id], invite),
  });
}

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: ["invite-preview", token],
    queryFn: () => api.previewInvite(token),
    enabled: token.length > 0,
  });
}

export function useJoinMiniLeague() {
  return useMutation({
    mutationFn: (token: string) => api.joinMiniLeague(token),
  });
}

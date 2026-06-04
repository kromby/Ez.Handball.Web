export type LeaderboardMetric =
  | "goals"
  | "yellowCards"
  | "twoMinuteSuspensions"
  | "redCards"
  | "games";

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  name: string | null;
  clubId: string;
  clubName: string | null;
  gender: string;
  games: number;
  goals: number;
  yellowCards: number;
  twoMinuteSuspensions: number;
  redCards: number;
  avgGoals: number;
}

export interface Leaderboard {
  metric: string;
  total: number;
  offset: number;
  limit: number;
  entries: LeaderboardEntry[];
}

export interface Player {
  playerId: string;
  name: string;
  jerseyNumber: string | null;
  dateOfBirth: string | null;
  age: number | null;
  teamId: string;
  clubId: string;
  clubName: string | null;
  gender: string;
}

export interface PlayerHistoryEntry {
  season: string;
  tournamentId: string;
  tournamentName: string | null;
  clubId: string;
  clubName: string | null;
  games: number;
  totalGoals: number;
  totalYellowCards: number;
  totalTwoMinuteSuspensions: number;
  totalRedCards: number;
  avgGoals: number;
  avgYellowCards: number;
  avgTwoMinuteSuspensions: number;
  avgRedCards: number;
}

export interface PlayerHistoryTotals {
  games: number;
  totalGoals: number;
  totalYellowCards: number;
  totalTwoMinuteSuspensions: number;
  totalRedCards: number;
  avgGoals: number;
  avgYellowCards: number;
  avgTwoMinuteSuspensions: number;
  avgRedCards: number;
}

export interface PlayerHistoryResponse {
  playerId: string;
  history: PlayerHistoryEntry[];
  totals: PlayerHistoryTotals | null;
}

export interface PlayerStat {
  matchId: string;
  tournamentId: string;
  tournamentName: string | null;
  season: string;
  teamId: string;
  clubName: string | null;
  goals: number;
  yellowCards: number;
  twoMinuteSuspensions: number;
  redCards: number;
}

export interface PlayerStatsResponse {
  playerId: string;
  stats: PlayerStat[];
}

export interface LineScore {
  firstHalf: number;
  secondHalf: number;
  final: number;
}

export interface MatchPlayerLine {
  playerId: string;
  name: string | null;
  jerseyNumber: string | null;
  position: string | null;
  goals: number;
  yellowCards: number;
  twoMinuteSuspensions: number;
  redCards: number;
}

export interface MatchTeam {
  teamId: string;
  clubId: string;
  clubName: string | null;
  score: LineScore;
  players: MatchPlayerLine[];
}

export interface MatchDetail {
  matchId: string;
  tournamentId: string;
  tournamentName: string | null;
  season: string;
  date: string;
  venue: string | null;
  attendance: number | null;
  status: string;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
}

export type Language = "is" | "en";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  language: Language;
  favoriteClubId: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  language: Language;
  favoriteClubId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  language?: Language;
  favoriteClubId?: string;
}

export interface Club {
  clubId: string;
  name: string;
  logoUrl: string | null;
}

export interface ShortlistItem {
  playerId: string;
  name: string | null;
  clubId: string | null;
  clubName: string | null;
  position: string | null;
  gender: string | null;
  price: number | null;
  pickPercentage: number | null;
  createdAt: string;
}

export interface ShortlistResponse {
  items: ShortlistItem[];
  count: number;
  max: number;
}

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

export interface Season {
  label: string;
  isCurrent: boolean;
}

export interface Tournament {
  tournamentId: string;
  name: string;
  gender: string;
}

export interface Gender {
  value: string;
  label: string;
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
  position?: string | null;  // ADD — optional
  price?: Money | null;      // ADD — optional
  rating?: number | null; // current-season fantasy rating (Backend#78); 0 = no games, null = uncomputable
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
  teamName?: string;     // public team identity (from GET /api/users/me)
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
  teamName: string;          // ADD
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

export interface Money {
  amount: number;
  currency: string;
}

export interface SquadPlayer {
  playerId: string;
  name: string | null;
  clubId: string | null;
  clubName: string | null;
  position: string | null;
  gender: string | null;
  price: Money | null;   // current market value
  pricePaid: Money;      // locked at purchase
  rating: number;        // current-season fantasy rating (#52); 0 = below min-games guard
}

export interface Squad {
  flavor: string;
  players: SquadPlayer[];
  budgetUsed: Money;       // Σ pricePaid (tied up in squad)
  remainingBudget: Money;  // authoritative stored cash balance
  squadValue: Money;       // Σ current price
}

export interface SquadConstraints {
  ruleSetVersion: number;
  maxSquadSize: number;
  startingCap: Money;
  posLimits: Record<string, number>;
}

export interface BuyViolation {
  code: string;
  message: string;
}

export type PoolSort =
  | "Rating"
  | "Price"
  | "Goals"
  | "Games"
  | "YellowCards"
  | "TwoMinuteSuspensions"
  | "RedCards";

export interface PoolEntry {
  rank: number;
  playerId: string;
  name: string | null;
  clubId: string;
  clubName: string | null;
  gender: string;
  position: string;
  games: number;
  goals: number;
  yellowCards: number;
  twoMinuteSuspensions: number;
  redCards: number;
  avgGoals: number;
  price: Money;
  rating: number;
  pickPercentage: number | null; // always null for now
}

export interface PlayerPool {
  sort: string;
  total: number;
  offset: number;
  limit: number;
  entries: PoolEntry[];
}

export interface MiniLeagueMember {
  userId: string;
  role: string; // "creator" | "member"
  joinedAt: string;
}

export interface MiniLeague {
  id: string;
  name: string;
  season: string;
  creatorUserId: string;
  memberCount: number;
  role: string | null; // caller's role, or null if not a member
  createdAt: string;
  members: MiniLeagueMember[];
}

export interface Invite {
  token: string;
  expiresAt: string | null;
}

export interface InvitePreview {
  leagueId: string;
  name: string;
  season: string;
  memberCount: number;
}

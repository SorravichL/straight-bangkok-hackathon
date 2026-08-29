// Shapes shared by the API routes and the client. Kept free of any server imports
// so "use client" components can import the types too.
export type CosmeticItem = {
  id?: string;
  name: string;
  price: string;
  imageUrl: string;
  happiness: number;
};

/**
 * A row of public.players, as it comes back from Supabase.
 *
 * `age`, `turn` and `points` are owned by the server clock — they are derived
 * from game_clock and refreshed by sync_player() on every read. Clients read
 * them; they never write them.
 */
export type PlayerRow = {
  id: string;
  username: string;
  server: string;
  money: number;
  happiness: number;
  knowledge: number;
  occupation: string;
  age: number;
  turn: number;
  points: number;
  joined_at_tick: number;
  cosmetics: CosmeticItem[];
  created_at: string;
  updated_at: string;
};

/** Shape of clock_state(): everything needed to render a live countdown. */
export type ClockState = {
  started_at: string;
  tick_seconds: number;
  starting_age: number;
  max_points: number;
  global_tick: number;
  /** Postgres' clock, so the browser can correct its own drift. */
  server_now: string;
  next_tick_at: string;
};

/** Every player-facing endpoint returns the player alongside the clock. */
export type PlayerResponse = {
  player: PlayerRow;
  clock: ClockState;
};

/**
 * The columns a client may write back.
 *
 * `age`, `turn` and `points` are deliberately absent: they belong to the
 * server clock, so a client cannot age itself or mint ⌛ points.
 */
export const SAVEABLE_FIELDS = [
  "money",
  "happiness",
  "knowledge",
  "occupation",
  "cosmetics",
] as const;

export type SaveableField = (typeof SAVEABLE_FIELDS)[number];
export type SavePayload = Partial<Pick<PlayerRow, SaveableField>>;

export const USERNAME_PATTERN = /^[a-zA-Z0-9]+#\d{4}$/;
export const SERVERS = ["Server 1", "Server 2", "Server 3"] as const;

/**
 * Combined ranking score:
 *   happiness * 0.5 + (netWorth / 1000) * 0.5
 * where netWorth = cash + assets - debt.
 *
 * Assets and debt aren't stored yet (investments and loans don't persist as
 * separate balances), so netWorth is currently just cash. Pass them in once
 * they exist and the ranking picks them up with no other change.
 */
export function overallScore(
  happiness: number,
  cash: number,
  assets = 0,
  debt = 0
): number {
  const netWorth = cash + assets - debt;
  return happiness * 0.5 + (netWorth / 1000) * 0.5;
}

export type LeaderboardMetric = "money" | "knowledge" | "happiness";
export const LEADERBOARD_METRICS: LeaderboardMetric[] = ["money", "knowledge", "happiness"];

export type LeaderboardEntry = {
  rank: number;
  id: string;
  username: string;
  score: number;
};

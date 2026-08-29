import { NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";
import { jsonError } from "@/app/lib/api";
import { LEADERBOARD_METRICS, overallScore, type LeaderboardMetric } from "@/app/lib/game";

/** One line of the roster — enough for the list, not the detail view. */
export type RosterEntry = {
  id: string;
  username: string;
  server: string;
  money: number;
  happiness: number;
  knowledge: number;
  age: number;
  points: number;
  occupation: string;
  items: number;
  updated_at: string;
  /** happiness * 0.5 + (netWorth / 1000) * 0.5 */
  score: number;
};

const SORT_COLUMN: Record<LeaderboardMetric | "age", string> = {
  money: "money",
  knowledge: "knowledge",
  happiness: "happiness",
  age: "live_age",
};

/** "all" is a computed score, so it can't be an index scan — we sort it here. */
const SORTS = [...LEADERBOARD_METRICS, "age", "all"] as const;

/**
 * GET /api/roster?server=Server%201&sort=money
 *
 * Everyone in the room, read from the player_live view so age and ⌛ points are
 * current without having to touch each row. `server` is optional.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const requested = searchParams.get("sort") ?? "money";
  if (!SORTS.includes(requested as (typeof SORTS)[number])) {
    return NextResponse.json(
      { error: `sort must be one of: ${SORTS.join(", ")}` },
      { status: 400 }
    );
  }
  // "all" has no column to order by; fetch by money then re-sort below.
  const column = requested === "all" ? "money" : SORT_COLUMN[requested as LeaderboardMetric | "age"];
  const server = searchParams.get("server");

  try {
    const supabase = getSupabase();
    let query = supabase
      .from("player_live")
      .select("id, username, server, money, happiness, knowledge, live_age, live_points, occupation, items, updated_at")
      .order(column, { ascending: false })
      // Stable order between requests when scores tie.
      .order("updated_at", { ascending: true })
      .limit(200);

    if (server) query = query.eq("server", server);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const players: RosterEntry[] = (data ?? []).map((row) => {
      const record = row as Record<string, unknown>;
      const money = Number(record.money ?? 0);
      const happiness = Number(record.happiness ?? 0);
      return {
        id: String(record.id),
        username: String(record.username),
        server: String(record.server),
        money,
        happiness,
        knowledge: Number(record.knowledge ?? 0),
        age: Number(record.live_age ?? 0),
        points: Number(record.live_points ?? 0),
        occupation: String(record.occupation ?? "Unemployed"),
        items: Number(record.items ?? 0),
        updated_at: String(record.updated_at),
        // Assets and debt aren't tracked yet, so net worth is cash.
        score: overallScore(happiness, money),
      };
    });

    if (requested === "all") players.sort((a, b) => b.score - a.score);

    return NextResponse.json({ players, sort: requested });
  } catch (error) {
    return jsonError(error);
  }
}

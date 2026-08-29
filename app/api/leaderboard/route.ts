import { NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";
import { jsonError } from "@/app/lib/api";
import {
  LEADERBOARD_METRICS,
  type LeaderboardEntry,
  type LeaderboardMetric,
} from "@/app/lib/game";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/**
 * GET /api/leaderboard?metric=money|knowledge|happiness&server=Server%201&limit=25
 *
 * Ranks players by one stat. `server` is optional — leave it off for a global board.
 * Responds { metric, entries }.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const requested = searchParams.get("metric") ?? "money";
  if (!LEADERBOARD_METRICS.includes(requested as LeaderboardMetric)) {
    return NextResponse.json(
      { error: `metric must be one of: ${LEADERBOARD_METRICS.join(", ")}` },
      { status: 400 }
    );
  }
  const metric = requested as LeaderboardMetric;

  const parsedLimit = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(Math.trunc(parsedLimit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const server = searchParams.get("server");

  try {
    const supabase = getSupabase();
    let query = supabase
      .from("players")
      .select(`id, username, ${metric}`)
      .order(metric, { ascending: false })
      // Tie-break so equal scores keep a stable order between requests.
      .order("updated_at", { ascending: true })
      .limit(limit);

    if (server) query = query.eq("server", server);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const entries: LeaderboardEntry[] = (data ?? []).map((row, index) => {
      const record = row as unknown as Record<string, unknown>;
      return {
        rank: index + 1,
        id: String(record.id),
        username: String(record.username),
        score: Number(record[metric] ?? 0),
      };
    });

    return NextResponse.json({ metric, entries });
  } catch (error) {
    return jsonError(error);
  }
}

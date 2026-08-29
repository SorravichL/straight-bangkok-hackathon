import { NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";
import { jsonError } from "@/app/lib/api";
import { loadClock, loadPlayer } from "@/app/lib/players";
import { SAVEABLE_FIELDS, type PlayerRow, type SavePayload } from "@/app/lib/game";

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/players/:id — load a run, aged forward to the current tick.
 *
 * This is what the client polls, so a player who leaves the tab closed still
 * comes back at the right age with their ⌛ points accrued.
 */
export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;

  try {
    const supabase = getSupabase();
    const player = await loadPlayer(supabase, id);
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    return NextResponse.json({ player, clock: await loadClock(supabase) });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * PATCH /api/players/:id — save progress.
 *
 * Body may contain money, happiness, knowledge, occupation, cosmetics.
 * age, turn and points are owned by the server clock and are ignored here, as
 * is anything else (username, server, id) — so a client can't rename itself
 * onto another player's row or age itself to the top of the leaderboard.
 */
export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const incoming = (body ?? {}) as Record<string, unknown>;
  const update: SavePayload = {};

  for (const field of SAVEABLE_FIELDS) {
    const value = incoming[field];
    if (value === undefined) continue;

    switch (field) {
      case "occupation":
        if (typeof value !== "string") {
          return NextResponse.json({ error: "occupation must be a string" }, { status: 400 });
        }
        update.occupation = value;
        break;
      case "cosmetics":
        if (!Array.isArray(value)) {
          return NextResponse.json({ error: "cosmetics must be an array" }, { status: 400 });
        }
        update.cosmetics = value as PlayerRow["cosmetics"];
        break;
      default:
        if (typeof value !== "number" || !Number.isFinite(value)) {
          return NextResponse.json({ error: `${field} must be a number` }, { status: 400 });
        }
        update[field] = Math.round(value);
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const supabase = getSupabase();

    // Bring age/points up to date first, so the row we return is current even
    // though this request only writes the client-owned stats.
    const synced = await loadPlayer(supabase, id);
    if (!synced) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("players")
      .update(update)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    return NextResponse.json({ player: data as PlayerRow, clock: await loadClock(supabase) });
  } catch (error) {
    return jsonError(error);
  }
}

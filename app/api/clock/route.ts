import { NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";
import { loadClock } from "@/app/lib/players";
import { jsonError } from "@/app/lib/api";

/**
 * GET /api/clock — the room's shared clock.
 *
 * Age and ⌛ points are derived from this, so every player in the room advances
 * together whether or not their browser is open.
 */
export async function GET() {
  try {
    return NextResponse.json({ clock: await loadClock(getSupabase()) });
  } catch (error) {
    return jsonError(error);
  }
}

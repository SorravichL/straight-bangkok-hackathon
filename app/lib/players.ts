import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClockState, PlayerRow } from "@/app/lib/game";

/** Reads the global clock. */
export async function loadClock(supabase: SupabaseClient): Promise<ClockState> {
  const { data, error } = await supabase.rpc("clock_state").single();
  if (error) throw new Error(`Could not read the game clock: ${error.message}`);
  return data as ClockState;
}

/**
 * Reads a player with age, turn and ⌛ points brought up to the current tick.
 * Returns null if the id doesn't exist.
 */
export async function loadPlayer(
  supabase: SupabaseClient,
  id: string
): Promise<PlayerRow | null> {
  const { data, error } = await supabase.rpc("sync_player", { p_id: id }).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PlayerRow | null) ?? null;
}

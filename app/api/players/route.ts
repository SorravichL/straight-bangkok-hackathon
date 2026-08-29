import { NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";
import { jsonError } from "@/app/lib/api";
import { loadClock, loadPlayer } from "@/app/lib/players";
import { DEFAULT_SERVER, SERVERS, USERNAME_PATTERN, type PlayerRow } from "@/app/lib/game";
import startData from "@/app/data/startData.json";

/**
 * POST /api/players — join a server.
 *
 * Body: { username: "boom#1234", server: "Server 1" }
 *
 * A new player is anchored to the current tick, so whoever walks in mid-demo
 * still starts at the clock's starting age rather than inheriting the room's
 * elapsed years. An existing username+server resumes instead, aged forward to
 * the present. Responds { player, clock, resumed }.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const { username } = (body ?? {}) as { username?: string; server?: string };
  // The homepage no longer asks for a server; fall back to the shared room.
  const server = (body as { server?: string })?.server ?? DEFAULT_SERVER;

  if (typeof username !== "string" || !USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      { error: "Please enter a username in the format yourname#1234" },
      { status: 400 }
    );
  }
  if (typeof server !== "string" || !SERVERS.includes(server as (typeof SERVERS)[number])) {
    return NextResponse.json({ error: "Please select a server before proceeding" }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const clock = await loadClock(supabase);

    const existing = await supabase
      .from("players")
      .select("id")
      .eq("username", username)
      .eq("server", server)
      .maybeSingle();

    if (existing.error) {
      return NextResponse.json({ error: existing.error.message }, { status: 500 });
    }
    if (existing.data) {
      const player = await loadPlayer(supabase, existing.data.id as string);
      return NextResponse.json({ player, clock: await loadClock(supabase), resumed: true });
    }

    const created = await supabase
      .from("players")
      .insert({
        username,
        server,
        money: startData.money,
        happiness: startData.happiness,
        knowledge: startData.knowledge,
        occupation: startData.occupation,
        cosmetics: startData.cosmetics,
        // Anchor to the current tick so latecomers start young.
        age: clock.starting_age,
        turn: 1,
        joined_at_tick: clock.global_tick,
        points_synced_tick: clock.global_tick,
      })
      .select("*")
      .single();

    if (created.error) {
      // Two people hit PLAY with the same name at once: the loser of the race
      // gets the unique-violation, so hand back the row the winner created.
      if (created.error.code === "23505") {
        const raced = await supabase
          .from("players")
          .select("id")
          .eq("username", username)
          .eq("server", server)
          .single();
        if (!raced.error) {
          const player = await loadPlayer(supabase, raced.data.id as string);
          return NextResponse.json({ player, clock: await loadClock(supabase), resumed: true });
        }
      }
      return NextResponse.json({ error: created.error.message }, { status: 500 });
    }

    return NextResponse.json(
      { player: created.data as PlayerRow, clock, resumed: false },
      { status: 201 }
    );
  } catch (error) {
    return jsonError(error);
  }
}

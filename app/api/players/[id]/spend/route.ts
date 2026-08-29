import { NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";
import { loadClock, loadPlayer } from "@/app/lib/players";
import { jsonError } from "@/app/lib/api";
import { ACTION_CARDS, actionPoints, resolveEffects } from "@/app/lib/actions";
import { hasJob } from "@/app/lib/jobs";
import type { PlayerRow } from "@/app/lib/game";

/**
 * POST /api/players/:id/spend — trade ⌛ time for something else.
 *
 * Body: { action: "Study" }
 *
 * The cost and the payoff are resolved here, against the player's stored
 * occupation, so Working pays what the job actually pays. spend_points()
 * applies it in one statement that refuses to overdraw, so a double-tap can't
 * spend the same point twice.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const name = (body as { action?: unknown })?.action;
  if (typeof name !== "string" || !(name in ACTION_CARDS)) {
    return NextResponse.json({ error: `Unknown action: ${String(name)}` }, { status: 400 });
  }
  if (ACTION_CARDS[name].opensCareers) {
    return NextResponse.json(
      { error: "Pick a job from the career list instead" },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabase();

    // Read the player first: Working and Overtime pay by occupation.
    const current = await loadPlayer(supabase, id);
    if (!current) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    // Working and Overtime pay a salary, so they need a job to pay it.
    if (ACTION_CARDS[name].requiresJob && !hasJob(current.occupation)) {
      return NextResponse.json(
        { error: "Find a job before you can work" },
        { status: 409 }
      );
    }

    const cost = actionPoints(name);
    const effects = resolveEffects(name, current.occupation);

    const { data, error } = await supabase
      .rpc("spend_points", {
        p_id: id,
        p_points: cost,
        d_money: effects.money,
        d_happiness: effects.happiness,
        d_knowledge: effects.knowledge,
      })
      .maybeSingle();

    if (error) {
      if (error.message.includes("INSUFFICIENT_POINTS")) {
        return NextResponse.json(
          { error: `Not enough ⌛ time — that costs ${cost}` },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    return NextResponse.json({
      player: data as PlayerRow,
      clock: await loadClock(supabase),
      spent: cost,
      // Echoed back so the page can show exactly what this year earned.
      effects,
    });
  } catch (error) {
    return jsonError(error);
  }
}

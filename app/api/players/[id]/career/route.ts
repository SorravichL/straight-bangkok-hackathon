import { NextResponse } from "next/server";
import { getSupabase } from "@/app/lib/supabase";
import { loadClock, loadPlayer } from "@/app/lib/players";
import { jsonError } from "@/app/lib/api";
import { actionPoints } from "@/app/lib/actions";
import { canTake, findJob, JOBS } from "@/app/lib/jobs";
import type { PlayerRow } from "@/app/lib/game";

/**
 * GET /api/players/:id/career — the job list, with what this player qualifies for.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = getSupabase();
    const player = await loadPlayer(supabase, id);
    if (!player) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    return NextResponse.json({
      jobs: JOBS.map((job) => ({ ...job, eligible: canTake(job, player.knowledge) })),
      knowledge: player.knowledge,
      occupation: player.occupation,
    });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * POST /api/players/:id/career — transfer to a job.
 *
 * Body: { job: "Doctor" }
 *
 * Costs ⌛1 and requires the job's minimum 🎓. Browsing the list is free;
 * you only pay when you commit. Knowledge is re-read here rather than trusted
 * from the client, so the gate can't be talked around.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const title = (body as { job?: unknown })?.job;
  if (typeof title !== "string") {
    return NextResponse.json({ error: "job must be a name" }, { status: 400 });
  }

  const job = JOBS.find((candidate) => candidate.title === title);
  if (!job) return NextResponse.json({ error: `Unknown job: ${title}` }, { status: 400 });

  try {
    const supabase = getSupabase();

    const current = await loadPlayer(supabase, id);
    if (!current) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    if (current.occupation === job.title) {
      return NextResponse.json({ error: `You already work as a ${job.title}` }, { status: 409 });
    }
    if (!canTake(job, current.knowledge)) {
      return NextResponse.json(
        { error: `${job.title} needs 🎓 ${job.minKnowledge} — you have ${current.knowledge}` },
        { status: 409 }
      );
    }

    const cost = actionPoints("Find Career");
    const { data, error } = await supabase
      .rpc("spend_points", {
        p_id: id,
        p_points: cost,
        d_money: 0,
        d_happiness: 0,
        d_knowledge: 0,
        d_occupation: job.title,
      })
      .maybeSingle();

    if (error) {
      if (error.message.includes("INSUFFICIENT_POINTS")) {
        return NextResponse.json(
          { error: `Not enough ⌛ time — changing job costs ${cost}` },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "Player not found" }, { status: 404 });

    return NextResponse.json({
      player: data as PlayerRow,
      clock: await loadClock(supabase),
      job: findJob(job.title),
    });
  } catch (error) {
    return jsonError(error);
  }
}

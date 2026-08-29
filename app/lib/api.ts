import { NextResponse } from "next/server";

/**
 * Turns a thrown error into a JSON response. Without this, a missing
 * .env.local surfaces as an empty 500 that the client can't even parse.
 */
export function jsonError(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  return NextResponse.json({ error: message }, { status });
}

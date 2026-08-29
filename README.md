# FinAge Game

A financial-planning game built with Next.js 15 (App Router) and Supabase.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
```

## Backend setup (Supabase)

### 1. Create the tables

In the Supabase dashboard: **SQL Editor → New query**, run these two in order.
Both are safe to re-run.

1. [`supabase/schema.sql`](supabase/schema.sql) — the `players` table
2. [`supabase/migration-002-live-clock.sql`](supabase/migration-002-live-clock.sql) — the room clock, ⌛ points, and the `player_live` view

This creates one table, `public.players`, holding each player's identity
(`username` + `server`) and their live game state (money, happiness, knowledge,
occupation, age, turn, cosmetics). RLS is turned on with no policies, so the
public anon key can't touch it — all access goes through the API routes below.

### 2. Add your keys

Copy the template and fill in both values from **Project Settings → API**:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Then restart `npm run dev` — Next.js only reads env files at startup.

- `.env.local` is gitignored. Never commit it.
- The `service_role` key bypasses Row Level Security. It must stay server-side:
  don't rename it to `NEXT_PUBLIC_…` and don't import `app/lib/supabase.ts`
  from a `"use client"` file.
- Deploying to Vercel? Add the same two variables under
  **Project → Settings → Environment Variables**.

## Live room clock

The demo runs on one shared clock. **Age and ⌛ points are derived from it, not
pushed by a background job** — `tick = floor((now - started_at) / tick_seconds)` —
so a player whose laptop was shut the whole time still comes back correctly aged,
and there is no cron to babysit.

- One tick = 1 year. Default **300 seconds (5 min)**, set in `game_clock.tick_seconds`.
- Every tick grants **1 ⌛ point**, banked up to **12** (`max_points`).
- Whoever joins starts at **age 18** with **3 points**, whenever they walk in —
  a latecomer is anchored to the current tick, not to the room's elapsed years.
- The Action page shows the countdown and spends points; the server looks up the
  cost and the stat effects, so a client can't mint points or forge a payout.

### Running a session

```sql
-- 1. rehearse fast
update public.game_clock set tick_seconds = 20;

-- 2. back to demo speed, and start the clock as people walk in
update public.game_clock set tick_seconds = 300, started_at = now();

-- 3. watch the room
select username, live_age, live_points, money from public.player_live order by live_age desc;

-- 4. reset between runs
delete from public.players;
update public.game_clock set started_at = now();
```

More in [`supabase/queries.sql`](supabase/queries.sql).

## API

| Route | Purpose |
| --- | --- |
| `POST /api/players` | Join a server. Body `{ username, server }`. Creates a player seeded from `app/data/startData.json`, or returns the existing run for that name+server. Responds `{ player, resumed }`. |
| `GET /api/players/:id` | Load a saved run. |
| `PATCH /api/players/:id` | Save progress. Accepts any of `money`, `happiness`, `knowledge`, `occupation`, `age`, `turn`, `cosmetics`. Everything else is ignored. |
| `GET /api/leaderboard` | `?metric=money\|knowledge\|happiness&server=Server%201&limit=25`. `server` is optional; omit it for a global board. |
| `GET /api/clock` | The room's shared clock: current tick, tick length, and when the next year lands. |
| `POST /api/players/:id/spend` | Spend ⌛ points. Body `{ actions: ["Study","Working"] }`. Cost and effects are resolved server-side from `app/lib/actions.ts`. |

## How the game talks to the database

`app/context/GameProvider.tsx` is the only place the frontend touches the API:

- `joinGame(username, server)` — called by the homepage's PLAY button.
- Autosave — any `setPlayer(...)` anywhere in the app is written back ~600ms later.
- `commitPlayer(updater)` — apply a change *and* flush it immediately; used by the
  outcome screen so the leaderboard ranks fresh numbers.
- The player id is kept in `localStorage`, so a page reload resumes the run.

Note: there is no authentication — anyone who knows a player id can write to it.
That's fine for a hackathon demo; add Supabase Auth before this goes anywhere real.

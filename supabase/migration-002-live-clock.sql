-- Migration 002 — live server clock, aging, and action points.
-- Safe to run on the existing database. Re-runnable.

-- ---------------------------------------------------------------------------
-- 1. One global clock for the whole room.
--    Age and points are DERIVED from this, never pushed by a background job:
--    tick = floor((now() - started_at) / tick_seconds). A player who closes
--    their laptop still comes back correctly aged.
-- ---------------------------------------------------------------------------
create table if not exists public.game_clock (
  id              boolean primary key default true,
  started_at      timestamptz not null default now(),
  tick_seconds    integer     not null default 300,   -- 5 minutes = 1 year
  starting_age    integer     not null default 18,
  starting_points integer     not null default 3,     -- points granted on join
  max_points      integer     not null default 12,    -- ⌛ bank cap
  constraint game_clock_singleton check (id),
  constraint game_clock_tick_positive check (tick_seconds > 0)
);

insert into public.game_clock (id) values (true) on conflict (id) do nothing;

alter table public.game_clock enable row level security;

-- ---------------------------------------------------------------------------
-- 2. Per-player clock anchors.
--    joined_at_tick pins where a player entered, so latecomers still start at 18.
-- ---------------------------------------------------------------------------
alter table public.players
  add column if not exists joined_at_tick     integer not null default 0,
  add column if not exists points             integer not null default 3,
  add column if not exists points_synced_tick integer not null default 0;

alter table public.players alter column age set default 18;

-- ---------------------------------------------------------------------------
-- 3. The clock itself.
-- ---------------------------------------------------------------------------
create or replace function public.current_tick()
returns integer
language sql
stable
as $$
  select greatest(0, floor(extract(epoch from (now() - c.started_at)) / c.tick_seconds)::integer)
  from public.game_clock c
  where c.id;
$$;

-- ---------------------------------------------------------------------------
-- 4. Lazy point regen + age catch-up, run whenever a player is read.
--    Points accrue 1 per tick and stop at max_points, so the cap is applied at
--    accrual time rather than as a formula over totals (which would let a
--    player "recover" points they had already spent).
--    The `gt > points_synced_tick` guard makes this a no-op read most of the
--    time — one write per player per tick, not one per request.
-- ---------------------------------------------------------------------------
create or replace function public.sync_player(p_id uuid)
returns public.players
language plpgsql
as $$
declare
  c      public.game_clock;
  gt     integer;
  p_row  public.players;
begin
  select * into c from public.game_clock where id;
  gt := public.current_tick();

  update public.players p
     set points             = least(c.max_points, p.points + (gt - p.points_synced_tick)),
         points_synced_tick = gt,
         age                = c.starting_age + greatest(0, gt - p.joined_at_tick),
         turn               = greatest(0, gt - p.joined_at_tick) + 1
   where p.id = p_id
     and gt > p.points_synced_tick
  returning p.* into p_row;

  if p_row.id is null then
    select * into p_row from public.players where id = p_id;
  end if;

  return p_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Spending points. Atomic, so a double-click can't overdraw the bank.
-- ---------------------------------------------------------------------------
create or replace function public.spend_points(
  p_id         uuid,
  p_points     integer,
  d_money      bigint,
  d_happiness  integer,
  d_knowledge  integer,
  d_occupation text default null
)
returns public.players
language plpgsql
as $$
declare
  p_row public.players;
begin
  perform public.sync_player(p_id);

  update public.players
     set points     = points - p_points,
         money      = money + d_money,
         happiness  = happiness + d_happiness,
         knowledge  = knowledge + d_knowledge,
         occupation = coalesce(d_occupation, occupation)
   where id = p_id
     and points >= p_points
  returning * into p_row;

  if p_row.id is null then
    raise exception 'INSUFFICIENT_POINTS';
  end if;

  return p_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. A view that shows live values, for eyeballing the room in the SQL editor.
-- ---------------------------------------------------------------------------
create or replace view public.player_live as
select
  p.id,
  p.username,
  p.server,
  p.money,
  p.knowledge,
  p.happiness,
  p.occupation,
  p.joined_at_tick,
  public.current_tick()                                          as global_tick,
  greatest(0, public.current_tick() - p.joined_at_tick)           as years_lived,
  c.starting_age + greatest(0, public.current_tick() - p.joined_at_tick) as live_age,
  least(c.max_points, p.points + greatest(0, public.current_tick() - p.points_synced_tick)) as live_points,
  jsonb_array_length(p.cosmetics)                                 as items,
  p.updated_at
from public.players p
cross join public.game_clock c;

-- ---------------------------------------------------------------------------
-- 7. Everything the client needs to render a countdown, in one round trip.
--    server_now is Postgres' clock, so the browser can correct for its own drift.
-- ---------------------------------------------------------------------------
create or replace function public.clock_state()
returns table (
  started_at   timestamptz,
  tick_seconds integer,
  starting_age integer,
  max_points   integer,
  global_tick  integer,
  server_now   timestamptz,
  next_tick_at timestamptz
)
language sql
stable
as $$
  select
    c.started_at,
    c.tick_seconds,
    c.starting_age,
    c.max_points,
    public.current_tick(),
    now(),
    c.started_at + make_interval(secs => (public.current_tick() + 1)::double precision * c.tick_seconds)
  from public.game_clock c
  where c.id;
$$;
